// Shared utilities for Edit Page: storage access + premium (license) state.
// Imported by background.js and popup.js as an ES module. The actual license
// verification lives in license.js — here we only mirror the persisted
// "verified-until" deadline so feature gating stays cheap and synchronous.

import { LANGUAGE_OPTIONS, normalizeLanguageCode } from "./i18n/locales.js";

export const STORAGE_KEYS = {
  LICENSE: "license", // object|null: verified license state (see license.js)
};

export const WEBSITE_BASE_URL = "https://editpage.henriz.dev";
export const UNINSTALL_URL = `${WEBSITE_BASE_URL}/goodbye`;
export const GETTING_STARTED_URL = `${WEBSITE_BASE_URL}/getting-started`;
export const LANGUAGE_PREFERENCE_KEY = "languagePreference";
export const SUPPORTED_LANGUAGES = LANGUAGE_OPTIONS.map(({ code }) => code);
export const SCREENSHOT_DESTINATION_KEY = "screenshotDestination";
export const SCREENSHOT_DESTINATIONS = ["clipboard", "download"];
export const HIDE_REPEATED_ELEMENTS_KEY = "hideRepeatedElements";

export function getBrowserPlatform(userAgent = "") {
  if (/Edg\//i.test(userAgent)) return "edge";
  return "chrome";
}

export function getGettingStartedUrl(userAgent = "") {
  const browser = getBrowserPlatform(userAgent);
  return `${GETTING_STARTED_URL}?installed=1&browser=${browser}`;
}

export async function getScreenshotDestination() {
  const result = await chrome.storage.sync.get(SCREENSHOT_DESTINATION_KEY);
  const value = result[SCREENSHOT_DESTINATION_KEY];
  return SCREENSHOT_DESTINATIONS.includes(value) ? value : "clipboard";
}

export async function setScreenshotDestination(value) {
  const normalized = SCREENSHOT_DESTINATIONS.includes(value) ? value : "clipboard";
  await chrome.storage.sync.set({ [SCREENSHOT_DESTINATION_KEY]: normalized });
  return normalized;
}

export async function getHideRepeatedElements() {
  const result = await chrome.storage.sync.get(HIDE_REPEATED_ELEMENTS_KEY);
  return result[HIDE_REPEATED_ELEMENTS_KEY] !== false;
}

export async function setHideRepeatedElements(value) {
  const normalized = value !== false;
  await chrome.storage.sync.set({ [HIDE_REPEATED_ELEMENTS_KEY]: normalized });
  return normalized;
}

// ───────────────────────── free usage quotas ─────────────────────────
// Free tier: each advanced feature has its own allowance, but limits are
// OR-combined — as soon as ANY feature reaches its limit, ALL advanced
// features are locked for 12 hours starting at that moment. When the lock
// expires, every counter resets to zero. Premium bypasses quotas entirely.

export const FEATURE_USAGE_KEY = "featureUsage";
export const QUOTA_LOCK_MS = 12 * 60 * 60 * 1000;
export const FREE_FEATURE_LIMITS = {
  replaceImage: 5, // image imports: upload and pasted URL both count
  fullPageScreenshot: 3,
  removeElement: 5, // counted per entering remove mode, not per removed element
};

const normalizeFeatureUsage = (raw) => {
  // Build defaults from FREE_FEATURE_LIMITS so newly added features are
  // always present even when older stored data lacks their entries.
  const usage = { lockedUntil: 0 };
  for (const feature of Object.keys(FREE_FEATURE_LIMITS)) {
    usage[feature] = { count: 0 };
  }
  if (raw && typeof raw === "object") {
    for (const feature of Object.keys(FREE_FEATURE_LIMITS)) {
      const entry = raw[feature];
      if (entry && Number.isFinite(entry.count) && entry.count > 0) {
        usage[feature].count = Math.floor(entry.count);
      }
    }
    if (Number.isFinite(raw.lockedUntil)) {
      usage.lockedUntil = raw.lockedUntil;
    }
  }
  // Lock expired → reset every counter (lazy, no timers needed).
  if (usage.lockedUntil && usage.lockedUntil <= Date.now()) {
    for (const feature of Object.keys(FREE_FEATURE_LIMITS)) {
      usage[feature].count = 0;
    }
    usage.lockedUntil = 0;
  }
  return usage;
};

export async function getFeatureUsage() {
  try {
    const result = await chrome.storage.sync.get(FEATURE_USAGE_KEY);
    return normalizeFeatureUsage(result[FEATURE_USAGE_KEY]);
  } catch {
    return normalizeFeatureUsage(null);
  }
}

/**
 * Free quota state:
 * { limited, lockedUntil, replaceImage: {used, limit, remaining}, fullPageScreenshot: {...} }
 */
export async function getQuotaState() {
  const usage = await getFeatureUsage();
  const now = Date.now();
  const limited = usage.lockedUntil > now;
  const state = { limited, lockedUntil: usage.lockedUntil };
  for (const feature of Object.keys(FREE_FEATURE_LIMITS)) {
    const limit = FREE_FEATURE_LIMITS[feature];
    const used = usage[feature].count;
    state[feature] = { used, limit, remaining: Math.max(0, limit - used) };
  }
  return state;
}

/** Consume one use; locks ALL advanced features for 12h once any limit is hit. */
export async function consumeFeatureUse(feature) {
  if (!FREE_FEATURE_LIMITS[feature]) return getQuotaState();
  const usage = await getFeatureUsage();
  usage[feature].count += 1;
  if (
    !usage.lockedUntil &&
    usage[feature].count >= FREE_FEATURE_LIMITS[feature]
  ) {
    usage.lockedUntil = Date.now() + QUOTA_LOCK_MS;
  }
  await chrome.storage.sync.set({ [FEATURE_USAGE_KEY]: usage });
  return getQuotaState();
}

/** Empty preference follows the browser UI language. */
export async function getLanguagePreference() {
  const result = await chrome.storage.sync.get(LANGUAGE_PREFERENCE_KEY);
  return normalizeLanguageCode(result[LANGUAGE_PREFERENCE_KEY]);
}

export async function setLanguagePreference(value) {
  const normalized = normalizeLanguageCode(value);
  await chrome.storage.sync.set({ [LANGUAGE_PREFERENCE_KEY]: normalized });
  return normalized;
}

/** Preference > browser UI language (including region) > English. */
export async function resolveLanguage() {
  const preference = await getLanguagePreference();
  if (preference) return preference;

  const candidates = [];
  try {
    candidates.push(chrome.i18n.getUILanguage());
  } catch {}
  if (typeof navigator !== "undefined") {
    candidates.push(...(navigator.languages || []), navigator.language);
  }

  for (const value of candidates) {
    const normalized = normalizeLanguageCode(value);
    if (normalized) return normalized;
  }
  return "en";
}

const DEFAULTS = {
  [STORAGE_KEYS.LICENSE]: null,
};

export async function getState(key = null) {
  if (key === null) {
    const all = await chrome.storage.local.get(null);
    return { ...DEFAULTS, ...all };
  }
  const result = await chrome.storage.local.get(key);
  return result[key] ?? DEFAULTS[key];
}

export async function setState(key, value) {
  await chrome.storage.local.set({ [key]: value });
  return value;
}

// ───────────────────────── premium tier ─────────────────────────

// In-memory cache of premium status. Synchronous `isPremium()` reads this; it
// is refreshed from storage by `refreshPremiumState()` at startup in each
// context (and via storage.onChanged in the service worker). The actual
// license verification lives in license.js — here we only mirror the persisted
// "verified-until" deadline so feature gating stays cheap and synchronous.
let premiumActive = false;

/**
 * Whether the current user has an active, non-stale Premium license.
 * Reflects the cache maintained by refreshPremiumState().
 */
export function isPremium() {
  return premiumActive;
}

/**
 * Re-read the persisted license and update the premium cache. Returns the new
 * premium status.
 *
 * A license counts as active while EITHER the server-signed signature window
 * (validUntil) is in the future OR the offline grace window (graceUntil, set
 * on the last successful verify +48h) is in the future — the latter keeps
 * premium usable during a Licentra outage. Business-level expiry
 * (licenseExpiresAt) is NOT extendable by grace: a lapsed subscription is
 * locked regardless of the grace window.
 */
export async function refreshPremiumState() {
  const lic = await getState(STORAGE_KEYS.LICENSE);
  const now = Date.now();
  let active = !!lic && (
    (typeof lic.validUntil === 'number' && lic.validUntil > now) ||
    (typeof lic.graceUntil === 'number' && lic.graceUntil > now)
  );
  if (active && lic.licenseExpiresAt != null) {
    const expiresAt = Date.parse(lic.licenseExpiresAt);
    active = Number.isFinite(expiresAt) && expiresAt > now;
  }
  premiumActive = active;
  return premiumActive;
}
