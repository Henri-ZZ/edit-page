// Shared utilities for Edit Page: storage access + premium (license) state.
// Imported by background.js and popup.js as an ES module. The actual license
// verification lives in license.js — here we only mirror the persisted
// "verified-until" deadline so feature gating stays cheap and synchronous.

export const STORAGE_KEYS = {
  LICENSE: "license", // object|null: verified license state (see license.js)
};

export const LANGUAGE_PREFERENCE_KEY = "languagePreference";
export const SUPPORTED_LANGUAGES = ["en", "zh"];
export const SCREENSHOT_DESTINATION_KEY = "screenshotDestination";
export const SCREENSHOT_DESTINATIONS = ["clipboard", "download"];

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

/** Empty preference follows the browser UI language. */
export async function getLanguagePreference() {
  const result = await chrome.storage.sync.get(LANGUAGE_PREFERENCE_KEY);
  const value = result[LANGUAGE_PREFERENCE_KEY];
  return SUPPORTED_LANGUAGES.includes(value) ? value : "";
}

export async function setLanguagePreference(value) {
  const normalized = SUPPORTED_LANGUAGES.includes(value) ? value : "";
  await chrome.storage.sync.set({ [LANGUAGE_PREFERENCE_KEY]: normalized });
  return normalized;
}

/** Preference > browser UI language > English. */
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
  return candidates.some((value) => String(value || "").toLowerCase().startsWith("zh"))
    ? "zh"
    : "en";
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
