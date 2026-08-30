// Service worker for Edit Page.
//
// Lightweight: answers a ping, clears stale screenshot data on page unload,
// and runs the license heartbeat (Licentra check-in) on an alarm so
// revocations / refunds take effect without waiting for the user to open the
// popup again.

import { STORAGE_KEYS, refreshPremiumState } from '../shared.js';
import { maybeCheckIn } from '../license.js';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const withTimeout = (promise, milliseconds, message) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), milliseconds);
  })
]);

const setCaptureProgress = (progress) =>
  chrome.storage.local.set({ fullPageCaptureProgress: progress });

async function ensureOffscreenDocument() {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen/offscreen.html')]
    });
    if (contexts.length > 0) return;
  }

  await chrome.offscreen.createDocument({
    url: 'offscreen/offscreen.html',
    reasons: ['BLOBS'],
    justification: 'Stitch full-page screenshot segments into one image'
  }).catch((error) => {
    if (!error.message.includes('single offscreen document')) throw error;
  });
}

const sendToStitcher = (message) => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
      return;
    }
    if (!response?.ok) {
      reject(new Error(response?.error || 'Screenshot stitching failed'));
      return;
    }
    resolve(response);
  });
});

const captureVisibleTab = (windowId) => new Promise((resolve, reject) => {
  chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
      return;
    }
    resolve(dataUrl);
  });
});

async function preparePageForCapture(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const root = document.documentElement;
      const body = document.body;
      const totalHeight = Math.max(
        root.scrollHeight,
        root.offsetHeight,
        root.clientHeight,
        body?.scrollHeight || 0,
        body?.offsetHeight || 0
      );

      window._editPageFullCaptureState = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        rootScrollBehavior: root.style.getPropertyValue('scroll-behavior'),
        rootScrollBehaviorPriority: root.style.getPropertyPriority('scroll-behavior'),
        fixedElements: []
      };
      root.style.setProperty('scroll-behavior', 'auto', 'important');

      // Sampling elements visible in the viewport is dramatically cheaper than
      // calling getComputedStyle for every node on large application pages.
      const visibleCandidates = new Set();
      const xPoints = [2, window.innerWidth * 0.25, window.innerWidth * 0.5, window.innerWidth * 0.75, window.innerWidth - 2];
      const yStep = Math.max(48, Math.floor(window.innerHeight / 12));
      for (let y = 2; y < window.innerHeight; y += yStep) {
        for (const x of xPoints) {
          for (const element of document.elementsFromPoint(x, y)) {
            let current = element;
            while (current && current !== root) {
              visibleCandidates.add(current);
              current = current.parentElement;
            }
          }
        }
      }

      visibleCandidates.forEach((element) => {
        const styles = getComputedStyle(element);
        if (styles.position !== 'fixed' && styles.position !== 'sticky') return;
        if (styles.position === 'sticky' && styles.top === 'auto' && styles.bottom === 'auto') return;
        const rect = element.getBoundingClientRect();
        window._editPageFullCaptureState.fixedElements.push({
          element,
          isBottom: rect.top > window.innerHeight / 2,
          opacity: element.style.getPropertyValue('opacity'),
          opacityPriority: element.style.getPropertyPriority('opacity')
        });
      });

      return {
        totalHeight,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        dpr: window.devicePixelRatio || 1
      };
    }
  });
  return result.result;
}

async function scrollPageForCapture(tabId, y, isFirst, isLast) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (captureY, first, last) => {
      const state = window._editPageFullCaptureState;
      state?.fixedElements.forEach((item) => {
        const shouldShow = item.isBottom ? last : first;
        if (shouldShow) {
          if (item.opacity) {
            item.element.style.setProperty('opacity', item.opacity, item.opacityPriority);
          } else {
            item.element.style.removeProperty('opacity');
          }
        } else {
          item.element.style.setProperty('opacity', '0', 'important');
        }
      });

      window.scrollTo(0, captureY);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 220));
      return { actualY: window.scrollY };
    },
    args: [y, isFirst, isLast]
  });
  return result.result;
}

async function restorePageAfterCapture(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const state = window._editPageFullCaptureState;
      if (!state) return;

      state.fixedElements.forEach((item) => {
        if (item.opacity) {
          item.element.style.setProperty('opacity', item.opacity, item.opacityPriority);
        } else {
          item.element.style.removeProperty('opacity');
        }
      });

      if (state.rootScrollBehavior) {
        document.documentElement.style.setProperty(
          'scroll-behavior',
          state.rootScrollBehavior,
          state.rootScrollBehaviorPriority
        );
      } else {
        document.documentElement.style.removeProperty('scroll-behavior');
      }
      window.scrollTo(state.scrollX, state.scrollY);
      window._editPageFullCaptureState = null;
    }
  }).catch(() => {});
}

async function captureFullPage(tabId, windowId) {
  let prepared = false;
  try {
    await setCaptureProgress({ status: 'preparing' });
    const metrics = await withTimeout(
      preparePageForCapture(tabId),
      8000,
      'Page preparation timed out'
    );
    prepared = true;

    const { totalHeight, viewportHeight, viewportWidth, dpr } = metrics;
    const totalSegments = Math.ceil(totalHeight / viewportHeight);
    await withTimeout(ensureOffscreenDocument(), 8000, 'Screenshot processor did not start');
    await withTimeout(
      sendToStitcher({
        type: 'EDIT_PAGE_STITCH_START',
        width: viewportWidth,
        height: totalHeight,
        dpr
      }),
      8000,
      'Screenshot processor did not respond'
    );

    for (let index = 0; index < totalSegments; index += 1) {
      const targetY = index * viewportHeight;
      const isFirst = index === 0;
      const isLast = index === totalSegments - 1;
      const { actualY } = await withTimeout(
        scrollPageForCapture(tabId, targetY, isFirst, isLast),
        5000,
        `Page did not scroll to segment ${index + 1}`
      );
      if (index > 0) await wait(330);

      const dataUrl = await withTimeout(
        captureVisibleTab(windowId),
        10000,
        `Segment ${index + 1} capture timed out`
      );
      const sourceY = Math.max(0, targetY - actualY);
      const segmentHeight = Math.min(
        viewportHeight - sourceY,
        totalHeight - targetY
      );

      await withTimeout(
        sendToStitcher({
          type: 'EDIT_PAGE_STITCH_ADD',
          dataUrl,
          y: targetY,
          height: segmentHeight,
          sourceY,
          viewportWidth
        }),
        10000,
        `Segment ${index + 1} stitching timed out`
      );
      await setCaptureProgress({
        status: 'capturing',
        current: index + 1,
        total: totalSegments
      });
    }

    await setCaptureProgress({ status: 'stitching' });
    const result = await withTimeout(
      sendToStitcher({ type: 'EDIT_PAGE_STITCH_FINISH' }),
      15000,
      'Final image stitching timed out'
    );
    await setCaptureProgress({ status: 'done' });
    return { ok: true, dataUrl: result.dataUrl };
  } catch (error) {
    await setCaptureProgress({ status: 'error', error: error.message });
    return { ok: false, error: error.message };
  } finally {
    if (prepared) await restorePageAfterCapture(tabId);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ pong: true });
  } else if (request.action === 'pageUnload') {
    chrome.storage.local.remove('replaceImageData');
  } else if (request.action === 'captureFullPage') {
    (async () => {
      sendResponse(await captureFullPage(request.tabId, request.windowId));
    })();
    return true;
  } else if (request.type === 'refresh-license-state') {
    (async () => {
      sendResponse({ ok: true, premium: await initializeLicenseState() });
    })();
    return true;
  }
  return false;
});

// ───────────────────────── license (premium) ─────────────────────────

const LICENSE_CHECK_IN_ALARM = 'license-check-in';
let licenseInitializationPromise = null;

function initializeLicenseState() {
  if (licenseInitializationPromise) return licenseInitializationPromise;
  licenseInitializationPromise = (async () => {
    await refreshPremiumState();
    await maybeCheckIn();
    return refreshPremiumState();
  })().finally(() => {
    licenseInitializationPromise = null;
  });
  return licenseInitializationPromise;
}

function scheduleLicenseCheckIn() {
  // Heartbeat at half the signature TTL (default 24h) so revocations / refunds
  // take effect without waiting for a full browser restart.
  chrome.alarms.create(LICENSE_CHECK_IN_ALARM, { periodInMinutes: 12 * 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === LICENSE_CHECK_IN_ALARM) {
    initializeLicenseState().catch(() => {});
  }
});

// Keep the sync premium cache in step with activation from the popup.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEYS.LICENSE]) {
    refreshPremiumState();
  }
});

chrome.runtime.onStartup.addListener(() => {
  initializeLicenseState().catch(() => {});
});

// Service-worker module load also covers extension re-enable, where Chrome
// does not guarantee a runtime.onStartup event.
initializeLicenseState().catch(() => {});
scheduleLicenseCheckIn();
