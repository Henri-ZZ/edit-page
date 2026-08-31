// Service worker for Edit Page.
//
// Lightweight: answers a ping, clears stale screenshot data on page unload,
// and runs the license heartbeat (Licentra check-in) on an alarm so
// revocations / refunds take effect without waiting for the user to open the
// popup again.

import {
  STORAGE_KEYS,
  UNINSTALL_URL,
  getGettingStartedUrl,
  getHideRepeatedElements,
  refreshPremiumState
} from '../shared.js';
import { maybeCheckIn } from '../license.js';

// Chrome opens this page only after the extension has been uninstalled.
chrome.runtime.setUninstallURL(UNINSTALL_URL, () => {
  void chrome.runtime.lastError;
});

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const withTimeout = (promise, milliseconds, message) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), milliseconds);
  })
]);

const setCaptureProgress = (progress) =>
  chrome.storage.local.set({ fullPageCaptureProgress: progress });

const CAPTURE_LOCK_KEY = 'fullPageCaptureLock';
const CAPTURE_LOCK_MAX_AGE_MS = 4 * 60 * 1000;
let captureTaskActive = false;

async function acquireCaptureLock(captureId) {
  // This synchronous guard closes the read/write race between two messages
  // handled by the same worker. storage.session also survives a worker restart.
  if (captureTaskActive) return false;
  captureTaskActive = true;

  try {
    const result = await chrome.storage.session.get(CAPTURE_LOCK_KEY);
    const existing = result[CAPTURE_LOCK_KEY];
    if (
      existing?.captureId &&
      Number.isFinite(existing.startedAt) &&
      Date.now() - existing.startedAt < CAPTURE_LOCK_MAX_AGE_MS
    ) {
      captureTaskActive = false;
      return false;
    }
    await chrome.storage.session.set({
      [CAPTURE_LOCK_KEY]: { captureId, startedAt: Date.now() }
    });
    return true;
  } catch (error) {
    captureTaskActive = false;
    throw error;
  }
}

async function releaseCaptureLock(captureId) {
  try {
    const result = await chrome.storage.session.get(CAPTURE_LOCK_KEY);
    if (result[CAPTURE_LOCK_KEY]?.captureId === captureId) {
      await chrome.storage.session.remove(CAPTURE_LOCK_KEY);
    }
  } catch {
    // The in-memory guard is still released below. A stale session lock has a
    // maximum age and therefore cannot block screenshots permanently.
  } finally {
    captureTaskActive = false;
  }
}

async function assertTargetTabActive(tabId, windowId) {
  const [activeTab] = await chrome.tabs.query({ active: true, windowId });
  if (activeTab?.id !== tabId) {
    const error = new Error('Keep the page tab active until the full-page screenshot finishes');
    error.code = 'tab_changed';
    throw error;
  }
}

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

async function preparePageForCapture(tabId, hideRepeatedElements) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (shouldHideRepeatedElements) => {
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
        fixedElements: [],
        scrollbarStyle: null,
        scrollbarElements: []
      };
      root.style.setProperty('scroll-behavior', 'auto', 'important');

      if (shouldHideRepeatedElements) {
        document.getElementById('edit-page-capture-scrollbar-style')?.remove();
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.id = 'edit-page-capture-scrollbar-style';
        scrollbarStyle.textContent = `
          html, body, * { scrollbar-width: none !important; }
          html::-webkit-scrollbar,
          body::-webkit-scrollbar,
          *::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
        `;
        (document.head || root).appendChild(scrollbarStyle);
        window._editPageFullCaptureState.scrollbarStyle = scrollbarStyle;

        // Root scrollbars are browser UI around the document viewport and are
        // not reliably suppressed by pseudo-element styling alone. Chrome
        // still permits window.scrollTo while overflow is hidden, so capture
        // can continue normally without painting the scrollbars.
        for (const element of new Set([root, body].filter(Boolean))) {
          const item = {
            element,
            overflowX: element.style.getPropertyValue('overflow-x'),
            overflowXPriority: element.style.getPropertyPriority('overflow-x'),
            overflowY: element.style.getPropertyValue('overflow-y'),
            overflowYPriority: element.style.getPropertyPriority('overflow-y')
          };
          window._editPageFullCaptureState.scrollbarElements.push(item);
          element.style.setProperty('overflow-x', 'hidden', 'important');
          element.style.setProperty('overflow-y', 'hidden', 'important');
        }
      }

      // Sampling elements visible in the viewport is dramatically cheaper than
      // calling getComputedStyle for every node on large application pages.
      const visibleCandidates = new Set();
      const addCandidateChain = (element) => {
        let current = element;
        while (current instanceof Element && current !== root) {
          visibleCandidates.add(current);
          current = current.parentElement;
        }
      };
      const addCandidatesAtPoint = (x, y) => {
        for (const element of document.elementsFromPoint(x, y)) {
          addCandidateChain(element);

          // Events and document.elementsFromPoint stop at a shadow host. Walk
          // open shadow roots so fixed controls inside web components can also
          // be de-duplicated. Closed roots are handled through known hosts.
          let shadowHost = element;
          while (shadowHost?.shadowRoot?.elementFromPoint) {
            const shadowElement = shadowHost.shadowRoot.elementFromPoint(x, y);
            if (!(shadowElement instanceof Element) || shadowElement === shadowHost) break;
            addCandidateChain(shadowElement);
            shadowHost = shadowElement;
          }
        }
      };

      const xPoints = Array.from(new Set([
        2,
        18,
        42,
        window.innerWidth * 0.25,
        window.innerWidth * 0.5,
        window.innerWidth * 0.75,
        window.innerWidth - 42,
        window.innerWidth - 18,
        window.innerWidth - 2
      ].map((x) => Math.max(0, Math.min(window.innerWidth - 1, Math.round(x))))));
      const yStep = Math.max(32, Math.floor(window.innerHeight / 20));
      for (let y = 2; y < window.innerHeight; y += yStep) {
        for (const x of xPoints) {
          addCandidatesAtPoint(x, y);
        }
      }

      // Developer overlays often render their UI inside a closed shadow root,
      // so the host is the only reliable element available to page scripts.
      const alwaysHiddenHosts = new Set([
        ...document.querySelectorAll('#edit-page-history-toolbar')
      ]);
      if (shouldHideRepeatedElements) {
        document
          .querySelectorAll('vercel-live-feedback')
          .forEach((element) => alwaysHiddenHosts.add(element));
      }
      alwaysHiddenHosts.forEach((element) => visibleCandidates.add(element));

      const capturedElements = new Map();
      const rememberElement = (element, showOn) => {
        const existing = capturedElements.get(element);
        if (existing) {
          if (showOn === 'never') existing.showOn = 'never';
          return;
        }
        const item = {
          element,
          showOn,
          opacity: element.style.getPropertyValue('opacity'),
          opacityPriority: element.style.getPropertyPriority('opacity')
        };
        capturedElements.set(element, item);
        window._editPageFullCaptureState.fixedElements.push(item);
      };

      visibleCandidates.forEach((element) => {
        if (alwaysHiddenHosts.has(element)) {
          rememberElement(element, 'never');
          return;
        }

        const styles = getComputedStyle(element);
        if (styles.position !== 'fixed' && styles.position !== 'sticky') return;
        if (styles.position === 'sticky' && styles.top === 'auto' && styles.bottom === 'auto') return;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const isSmallOverlay =
          rect.width <= Math.min(240, window.innerWidth * 0.3) &&
          rect.height <= Math.min(240, window.innerHeight * 0.3);
        const isAtSideEdge =
          rect.left <= 80 || rect.right >= window.innerWidth - 80;

        // Small edge controls (chat, feedback, back-to-top, developer tools)
        // have no natural location in a long screenshot, so omit them instead
        // of repeating them or keeping an arbitrary copy.
        if (shouldHideRepeatedElements && isSmallOverlay && isAtSideEdge) {
          rememberElement(element, 'never');
          return;
        }

        rememberElement(
          element,
          rect.top > window.innerHeight / 2 ? 'last' : 'first'
        );
      });

      return {
        totalHeight,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        dpr: window.devicePixelRatio || 1,
        cleanedElementCount: window._editPageFullCaptureState.fixedElements.length
      };
    },
    args: [hideRepeatedElements]
  });
  return result.result;
}

async function scrollPageForCapture(tabId, y, isFirst, isLast) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (captureY, first, last) => {
      const state = window._editPageFullCaptureState;
      state?.fixedElements.forEach((item) => {
        const shouldShow =
          item.showOn === 'first' ? first :
            item.showOn === 'last' ? last : false;
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
      state.scrollbarStyle?.remove();
      state.scrollbarElements?.forEach((item) => {
        if (item.overflowX) {
          item.element.style.setProperty(
            'overflow-x',
            item.overflowX,
            item.overflowXPriority
          );
        } else {
          item.element.style.removeProperty('overflow-x');
        }
        if (item.overflowY) {
          item.element.style.setProperty(
            'overflow-y',
            item.overflowY,
            item.overflowYPriority
          );
        } else {
          item.element.style.removeProperty('overflow-y');
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
  const captureId = crypto.randomUUID();
  let lockAcquired = false;
  let prepareAttempted = false;
  try {
    lockAcquired = await acquireCaptureLock(captureId);
    if (!lockAcquired) {
      return {
        ok: false,
        errorCode: 'capture_in_progress',
        error: 'A full-page screenshot is already in progress'
      };
    }

    await assertTargetTabActive(tabId, windowId);
    await setCaptureProgress({ status: 'preparing', captureId });
    const hideRepeatedElements = await getHideRepeatedElements();
    prepareAttempted = true;
    const metrics = await withTimeout(
      preparePageForCapture(tabId, hideRepeatedElements),
      8000,
      'Page preparation timed out'
    );

    const { totalHeight, viewportHeight, viewportWidth, dpr } = metrics;
    const totalSegments = Math.ceil(totalHeight / viewportHeight);
    await withTimeout(ensureOffscreenDocument(), 8000, 'Screenshot processor did not start');
    await withTimeout(
      sendToStitcher({
        type: 'EDIT_PAGE_STITCH_START',
        captureId,
        width: viewportWidth,
        height: totalHeight,
        dpr
      }),
      8000,
      'Screenshot processor did not respond'
    );

    for (let index = 0; index < totalSegments; index += 1) {
      await assertTargetTabActive(tabId, windowId);
      const targetY = index * viewportHeight;
      const isFirst = index === 0;
      const isLast = index === totalSegments - 1;
      const { actualY } = await withTimeout(
        scrollPageForCapture(tabId, targetY, isFirst, isLast),
        5000,
        `Page did not scroll to segment ${index + 1}`
      );
      if (index > 0) await wait(330);
      await assertTargetTabActive(tabId, windowId);

      const dataUrl = await withTimeout(
        captureVisibleTab(windowId),
        10000,
        `Segment ${index + 1} capture timed out`
      );
      // Close the small race between the pre-capture check and
      // captureVisibleTab. If the user switched during that interval, discard
      // this bitmap before it can enter the stitched result.
      await assertTargetTabActive(tabId, windowId);
      const sourceY = Math.max(0, targetY - actualY);
      const segmentHeight = Math.min(
        viewportHeight - sourceY,
        totalHeight - targetY
      );

      await withTimeout(
        sendToStitcher({
          type: 'EDIT_PAGE_STITCH_ADD',
          captureId,
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
        captureId,
        current: index + 1,
        total: totalSegments
      });
    }

    await setCaptureProgress({ status: 'stitching', captureId });
    const result = await withTimeout(
      sendToStitcher({ type: 'EDIT_PAGE_STITCH_FINISH', captureId }),
      15000,
      'Final image stitching timed out'
    );
    await setCaptureProgress({ status: 'done', captureId });
    return { ok: true, dataUrl: result.dataUrl };
  } catch (error) {
    await setCaptureProgress({ status: 'error', captureId, error: error.message }).catch(() => {});
    return { ok: false, errorCode: error.code || null, error: error.message };
  } finally {
    if (prepareAttempted) await restorePageAfterCapture(tabId);
    if (lockAcquired) await releaseCaptureLock(captureId);
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

chrome.runtime.onInstalled.addListener((details) => {
  // Updates and re-enables must not reopen the onboarding page.
  if (details.reason !== 'install') return;

  const userAgent = globalThis.navigator?.userAgent || '';
  chrome.tabs.create({ url: getGettingStartedUrl(userAgent) }, () => {
    void chrome.runtime.lastError;
  });
});

// Service-worker module load also covers extension re-enable, where Chrome
// does not guarantee a runtime.onStartup event.
initializeLicenseState().catch(() => {});
scheduleLicenseCheckIn();
