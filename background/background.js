// Service worker for Edit Page.
//
// Lightweight: answers a ping, clears stale screenshot data on page unload,
// and runs the license heartbeat (Licentra check-in) on an alarm so
// revocations / refunds take effect without waiting for the user to open the
// popup again.

import { STORAGE_KEYS, refreshPremiumState } from '../shared.js';
import { maybeCheckIn } from '../license.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ pong: true });
  } else if (request.action === 'pageUnload') {
    chrome.storage.local.remove('replaceImageData');
  }
  return true;
});

// ───────────────────────── license (premium) ─────────────────────────

const LICENSE_CHECK_IN_ALARM = 'license-check-in';

function scheduleLicenseCheckIn() {
  // Heartbeat at half the signature TTL (default 24h) so revocations / refunds
  // take effect without waiting for a full browser restart.
  chrome.alarms.create(LICENSE_CHECK_IN_ALARM, { periodInMinutes: 12 * 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === LICENSE_CHECK_IN_ALARM) {
    maybeCheckIn().then(() => refreshPremiumState());
  }
});

// Keep the sync premium cache in step with activation from the popup.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEYS.LICENSE]) {
    refreshPremiumState();
  }
});

chrome.runtime.onStartup.addListener(() => {
  refreshPremiumState();
  maybeCheckIn().then(() => refreshPremiumState());
});

// Warm the cache on service-worker startup.
refreshPremiumState();
scheduleLicenseCheckIn();
