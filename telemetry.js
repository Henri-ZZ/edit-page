// Telemetry for Edit Page: aggregate, privacy-preserving product analytics.
//
// Contract: edit-page-web/docs/EDIT_PAGE_TELEMETRY_SPEC.md.
// Principle: "Measure Edit Page, never measure the page."
//
// This module owns identity, environment normalization, local aggregation,
// snapshotting, retry and acknowledgement. It never accepts page-derived data:
// callers pass an approved event constant and, only for activation failures,
// one approved reason. No URLs, text, selectors, images, errors or license
// values may reach this file.
//
// The extension service worker is the only writer of the accumulators, so every
// other context records through `trackTelemetryEvent()`, which is just a
// message. That keeps the read-modify-write cycles single-threaded.

import { isPremium } from "./shared.js";
import { DISTRIBUTION } from "./telemetry-distribution.js";

export const TELEMETRY_ENDPOINT =
  "https://editpage.henriz.dev/api/telemetry/v1/batch";

/** Complete schema-v1 event catalog. */
export const TELEMETRY_EVENTS = Object.freeze([
  "edit.start",
  "text.edit",
  "format.bold",
  "format.italic",
  "format.underline",
  "format.strikethrough",
  "format.font_size",
  "format.text_color",
  "format.background_color",
  "image.replace",
  "element.remove",
  "history.undo",
  "history.redo",
  "screenshot.viewport",
  "screenshot.fullpage",
  "screenshot.copy",
  "screenshot.download",
  "monetization.free_limit_reached",
  "monetization.upgrade_shown",
  "monetization.activation_started",
  "monetization.activation_succeeded",
  "monetization.activation_failed",
  "monetization.checkin_succeeded",
]);

export const ACTIVATION_FAILURE_REASONS = Object.freeze([
  "invalid_key",
  "expired_key",
  "revoked_key",
  "device_limit",
  "network_error",
  "server_error",
  "timeout",
  "unknown",
]);

export const SCHEMA_VERSION = 1;

// Activation failures are stored reason-qualified; the bare event name is not a
// valid counter key (the reporting side sums the reasons instead).
const ORDINARY_COUNTER_KEYS = TELEMETRY_EVENTS.filter(
  (event) => event !== "monetization.activation_failed",
);
const ACTIVATION_FAILURE_COUNTER_KEYS = ACTIVATION_FAILURE_REASONS.map(
  (reason) => `monetization.activation_failed.${reason}`,
);
const COUNTER_KEYS = new Set([
  ...ORDINARY_COUNTER_KEYS,
  ...ACTIVATION_FAILURE_COUNTER_KEYS,
]);

const FLUSH_ALARM = "telemetry-flush";
const MIN_FLUSH_DELAY_MS = 12 * 60 * 60 * 1000;
const MAX_FLUSH_DELAY_MS = 24 * 60 * 60 * 1000;
const STARTUP_FLUSH_MIN_AGE_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15 * 1000;
const RETRY_DELAYS_MS = [15 * 60e3, 60 * 60e3, 4 * 60 * 60e3, 12 * 60 * 60e3, 24 * 60 * 60e3];

const DAY_MS = 86_400_000;
const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/;
// The API rejects usage days older than 7 days and counts at most 7 days per
// batch, so a client that keeps a stale day locally would lose the WHOLE batch
// (permanent 4xx, never retried). Stale days are dropped here instead.
const MAX_USAGE_DAYS = 7;
const MAX_EVENT_AGE_MS = 7 * DAY_MS;
const MAX_FUTURE_DATE_MS = DAY_MS;
const MAX_COUNTER_PER_KEY = 1_000_000;
const MAX_TOTAL_COUNTERS = 7_000_000;

const KEYS = {
  INSTALLATION_ID: "telemetry.installationId",
  PENDING: "telemetry.pendingCounters",
  IN_FLIGHT: "telemetry.inFlightBatch",
  SCHEDULE: "telemetry.schedule",
  DIAGNOSTIC: "telemetry.lastDiagnostic",
};

// ───────────────────────── serialized storage access ─────────────────────────

// Every mutation goes through one promise chain. Without it, two concurrent
// events could read the same counters and the second write would drop the
// first increment.
let mutationQueue = Promise.resolve();
function runExclusive(task) {
  const run = mutationQueue.then(task, task);
  mutationQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

const readTelemetryState = async () => {
  const stored = await chrome.storage.local.get([
    KEYS.INSTALLATION_ID,
    KEYS.PENDING,
    KEYS.IN_FLIGHT,
    KEYS.SCHEDULE,
  ]);
  return {
    installationId: stored[KEYS.INSTALLATION_ID] ?? null,
    pending: stored[KEYS.PENDING] ?? {},
    inFlight: stored[KEYS.IN_FLIGHT] ?? null,
    schedule: stored[KEYS.SCHEDULE] ?? {},
  };
};

const rememberDiagnostic = async (diagnostic) => {
  try {
    await chrome.storage.local.set({ [KEYS.DIAGNOSTIC]: diagnostic });
  } catch {
    // Diagnostics are best effort and must never break the product.
  }
};

// ───────────────────────── identity ─────────────────────────

/** Reads or creates the id. The caller must already hold the mutation lock. */
async function readOrCreateInstallationId() {
  const stored = await chrome.storage.local.get(KEYS.INSTALLATION_ID);
  const existing = stored[KEYS.INSTALLATION_ID];
  if (typeof existing === "string" && existing.length >= 32) return existing;

  const installationId = crypto.randomUUID();
  await chrome.storage.local.set({ [KEYS.INSTALLATION_ID]: installationId });
  return installationId;
}

/**
 * Random, resettable installation id. Never derived from hardware, licensing,
 * or any other stable identifier (spec §4.1).
 */
export function ensureInstallationId() {
  return runExclusive(readOrCreateInstallationId);
}

// ───────────────────────── environment ─────────────────────────

const BROWSER_PATTERNS = [
  ["edge", /\bEdg[A-Z]?\/(\d+)/],
  ["opera", /\b(?:OPR|Opera)\/(\d+)/],
  ["vivaldi", /\bVivaldi\/(\d+)/],
  ["chrome", /\bChrome\/(\d+)/],
];

function detectBrowser() {
  const navigatorRef = globalThis.navigator;
  // `navigator.brave` is present only in Brave; its UA otherwise reads as Chrome.
  if (navigatorRef?.brave) return "brave";
  const userAgent = navigatorRef?.userAgent ?? "";
  for (const [browser, pattern] of BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) return browser;
  }
  return "other_chromium";
}

function detectBrowserMajorVersion() {
  const userAgent = globalThis.navigator?.userAgent ?? "";
  for (const [, pattern] of BROWSER_PATTERNS) {
    const match = userAgent.match(pattern);
    if (match) {
      const major = Number.parseInt(match[1], 10);
      return Number.isInteger(major) && major >= 1 && major <= 999
        ? major
        : undefined;
    }
  }
  return undefined;
}

const PLATFORM_OS = {
  mac: "mac",
  win: "windows",
  linux: "linux",
  cros: "chromeos",
  android: "android",
};

async function detectOs() {
  try {
    const info = await chrome.runtime.getPlatformInfo();
    return PLATFORM_OS[info?.os] ?? "other";
  } catch {
    return "other";
  }
}

/** Normalized BCP 47 tag; `und` when nothing usable is available. */
function detectLocale() {
  try {
    const raw = chrome.i18n?.getUILanguage?.() ?? "";
    const normalized = new Intl.Locale(raw.replace(/_/g, "-")).toString();
    return normalized.length <= 35 ? normalized : "und";
  } catch {
    return "und";
  }
}

async function detectEnvironment() {
  const environment = {
    extensionVersion: String(chrome.runtime.getManifest().version ?? "0"),
    browser: detectBrowser(),
    os: await detectOs(),
    locale: detectLocale(),
    distribution: DISTRIBUTION,
    licenseType: isPremium() ? "premium" : "free",
  };
  // Omitting an unknown major version is correct; 0 would be rejected.
  const major = detectBrowserMajorVersion();
  if (major !== undefined) environment.browserMajorVersion = major;
  return environment;
}

// ───────────────────────── local aggregation ─────────────────────────

const utcDateKey = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

async function incrementCounter(counterKey) {
  if (!COUNTER_KEYS.has(counterKey)) return false;
  return runExclusive(async () => {
    await readOrCreateInstallationId();
    const stored = await chrome.storage.local.get(KEYS.PENDING);
    const pending = stored[KEYS.PENDING] ?? {};
    const today = utcDateKey(Date.now());
    const day = { ...(pending[today] ?? {}) };
    day[counterKey] = (day[counterKey] ?? 0) + 1;
    await chrome.storage.local.set({ [KEYS.PENDING]: { ...pending, [today]: day } });
    return true;
  });
}

/**
 * Record one approved event. Runs inside the service worker (or any trusted
 * extension page); unlike `trackTelemetryEvent` it does not round-trip through
 * messaging.
 */
export async function recordTelemetryEvent(event) {
  if (event === "monetization.activation_failed") return false;
  return incrementCounter(event);
}

/** Record a terminal activation failure; only the bounded enum is accepted. */
export async function recordActivationFailure(reason) {
  if (!ACTIVATION_FAILURE_REASONS.includes(reason)) return false;
  return incrementCounter(`monetization.activation_failed.${reason}`);
}

/**
 * Fire-and-forget activation verdict for contexts that do not own the
 * accumulators. Only the bounded failure enum is accepted; raw licensing
 * reasons must be mapped before they get here.
 */
export function trackTelemetryActivationFailure(reason) {
  if (!ACTIVATION_FAILURE_REASONS.includes(reason)) return;
  try {
    chrome.runtime
      .sendMessage({ type: "telemetry-activation-failure", reason })
      ?.catch?.(() => {});
  } catch {
    // Telemetry must never affect the product.
  }
}

/**
 * Fire-and-forget recording for contexts that do not own the accumulators
 * (popup, options page, injected page scripts). Sends only the approved event
 * constant — never any page-derived value.
 */
export function trackTelemetryEvent(event) {
  if (!COUNTER_KEYS.has(event)) return;
  try {
    chrome.runtime
      .sendMessage({ type: "telemetry-event", event })
      ?.catch?.(() => {});
  } catch {
    // Telemetry must never affect the product.
  }
}

// ───────────────────────── batching ─────────────────────────

function parseUtcDate(date) {
  if (typeof date !== "string" || !UTC_DATE.test(date)) return null;
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

/** Drop stale days and normalize counters; returns ascending unique days. */
function buildUsage(pending, now) {
  const today = Date.parse(`${utcDateKey(now)}T00:00:00.000Z`);
  const earliest = today - MAX_EVENT_AGE_MS;
  const latest = today + MAX_FUTURE_DATE_MS;
  let total = 0;

  return Object.entries(pending)
    .filter(([date]) => {
      const timestamp = parseUtcDate(date);
      return timestamp !== null && timestamp >= earliest && timestamp <= latest;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-MAX_USAGE_DAYS)
    .map(([date, counters]) => {
      const events = {};
      for (const [key, value] of Object.entries(counters)) {
        if (!COUNTER_KEYS.has(key)) continue;
        const count = Math.min(Math.floor(Number(value) || 0), MAX_COUNTER_PER_KEY);
        if (count <= 0) continue;
        if (total >= MAX_TOTAL_COUNTERS) break;
        events[key] = count;
        total += count;
      }
      return { date, events };
    })
    .filter((day) => Object.keys(day.events).length > 0);
}

function nextFlushDelay() {
  return MIN_FLUSH_DELAY_MS + Math.floor(Math.random() * (MAX_FLUSH_DELAY_MS - MIN_FLUSH_DELAY_MS));
}

function retryDelay(attempts) {
  const base = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)];
  // ±20% jitter keeps retries from synchronizing across installations.
  return Math.round(base * (0.8 + Math.random() * 0.4));
}

export function scheduleTelemetryFlush(delayMs = nextFlushDelay()) {
  try {
    chrome.alarms.create(FLUSH_ALARM, { when: Date.now() + delayMs });
  } catch {
    // Without alarms the next service-worker start still flushes stale data.
  }
}

const postBatch = async (body) => {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  if (typeof AbortSignal?.timeout === "function") {
    init.signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }
  const response = await fetch(TELEMETRY_ENDPOINT, init);
  const text = await response.text().catch(() => "");
  return { status: response.status, retryAfter: response.headers.get("retry-after"), text };
};

const readRetryAfterMs = (value) => {
  const seconds = Number.parseInt(value ?? "", 10);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds * 1000, MAX_FLUSH_DELAY_MS)
    : null;
};

/**
 * Send the pending counters, or retry the persisted in-flight batch unchanged.
 *
 * A snapshot is persisted BEFORE the accumulator is cleared so a crash cannot
 * lose data, and the exact persisted body is resent on every retry so the
 * server's requestId idempotency keeps deduplication intact.
 */
export async function flushTelemetry({ reason = "alarm" } = {}) {
  return runExclusive(async () => {
    const installationId = await readOrCreateInstallationId();
    const { pending, inFlight, schedule } = await readTelemetryState();
    const now = Date.now();
    let batch = inFlight;
    let attempts = Number(schedule.attempts) || 0;

    if (!batch) {
      const usage = buildUsage(pending, now);
      if (usage.length === 0) {
        await chrome.storage.local.set({
          [KEYS.SCHEDULE]: { ...schedule, attempts: 0, lastFlushAt: now },
        });
        scheduleTelemetryFlush();
        return { ok: true, sent: false, reason };
      }

      // One id for both the snapshot and the payload: a retry must resend the
      // exact same requestId for server-side deduplication to work.
      const requestId = crypto.randomUUID();
      batch = {
        requestId,
        createdAt: new Date(now).toISOString(),
        body: {
          schemaVersion: SCHEMA_VERSION,
          requestId,
          installationId,
          sentAt: new Date(now).toISOString(),
          environment: await detectEnvironment(),
          usage,
        },
      };
      // One write for both keys: the snapshot and the cleared accumulator move
      // together, so neither a lost nor a duplicated batch is possible.
      await chrome.storage.local.set({
        [KEYS.IN_FLIGHT]: batch,
        [KEYS.PENDING]: {},
      });
    }

    let outcome;
    try {
      outcome = await postBatch(batch.body);
    } catch {
      outcome = { status: 0, retryAfter: null, text: "" };
    }

    const delay = retryDelay(attempts);

    if (outcome.status === 200) {
      let echoed = null;
      try {
        echoed = JSON.parse(outcome.text || "{}").requestId ?? null;
      } catch {
        echoed = null;
      }
      // Identifier casing is preserved end-to-end but compared loosely, since
      // the parser normalizes uuid columns in the database.
      if (echoed && String(echoed).toLowerCase() !== String(batch.body.requestId).toLowerCase()) {
        await rememberDiagnostic({ code: "request_id_mismatch", at: now });
      }
      await chrome.storage.local.set({
        [KEYS.IN_FLIGHT]: null,
        [KEYS.SCHEDULE]: { attempts: 0, lastFlushAt: now },
      });
      scheduleTelemetryFlush();
      return { ok: true, sent: true, reason };
    }

    if (outcome.status === 429) {
      const retryAfter = readRetryAfterMs(outcome.retryAfter) ?? delay;
      await chrome.storage.local.set({
        [KEYS.SCHEDULE]: { ...schedule, attempts: attempts + 1, nextAttemptAt: now + retryAfter },
      });
      scheduleTelemetryFlush(retryAfter);
      return { ok: false, sent: false, status: 429, reason };
    }

    if (outcome.status >= 400 && outcome.status < 500) {
      // Permanent rejection: the batch is malformed and retrying it unchanged
      // can never succeed. Drop it and keep a content-free diagnostic.
      await chrome.storage.local.set({
        [KEYS.IN_FLIGHT]: null,
        [KEYS.SCHEDULE]: { attempts: 0, lastFlushAt: now },
      });
      await rememberDiagnostic({ code: `rejected_${outcome.status}`, at: now });
      scheduleTelemetryFlush();
      return { ok: false, sent: false, status: outcome.status, dropped: true, reason };
    }

    await chrome.storage.local.set({
      [KEYS.SCHEDULE]: { ...schedule, attempts: attempts + 1, nextAttemptAt: now + delay },
    });
    scheduleTelemetryFlush(delay);
    return { ok: false, sent: false, status: outcome.status, reason };
  });
}

/**
 * Startup catch-up: only transfer when there is something to send and the last
 * accepted upload is at least half a flush interval old.
 */
export async function flushTelemetryIfStale() {
  const { pending, inFlight, schedule } = await readTelemetryState();
  if (!inFlight && Object.keys(pending).length === 0) return { ok: true, sent: false };
  const lastFlushAt = Number(schedule.lastFlushAt) || 0;
  if (Date.now() - lastFlushAt < STARTUP_FLUSH_MIN_AGE_MS) return { ok: true, sent: false };
  return flushTelemetry({ reason: "startup" });
}

/** Message handler entry point for the service worker. */
export async function handleTelemetryMessage(request) {
  if (request?.type === "telemetry-event") {
    return { ok: await recordTelemetryEvent(request.event) };
  }
  if (request?.type === "telemetry-activation-failure") {
    return { ok: await recordActivationFailure(request.reason) };
  }
  return null;
}

/**
 * Create the flush alarm only when it is missing. The service worker restarts
 * on nearly every event, so blindly re-creating the alarm on each start would
 * keep pushing the next upload further into the future.
 */
export async function ensureTelemetryFlushScheduled() {
  try {
    if (await chrome.alarms.get(FLUSH_ALARM)) return false;
  } catch {
    // Fall through and try to create it anyway.
  }
  scheduleTelemetryFlush();
  return true;
}

export const TELEMETRY_FLUSH_ALARM = FLUSH_ALARM;
