// Shared utilities for Edit Page: storage access + premium (license) state.
// Imported by background.js and popup.js as an ES module. The actual license
// verification lives in license.js — here we only mirror the persisted
// "verified-until" deadline so feature gating stays cheap and synchronous.

export const STORAGE_KEYS = {
  LICENSE: "license", // object|null: verified license state (see license.js)
};

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
