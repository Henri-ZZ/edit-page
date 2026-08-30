// Premium state uses the shared Licentra client. Activation lives on the
// settings page; the popup only refreshes license state for feature gating.
import {
  maybeCheckIn,
} from '../license.js';
import {
  getScreenshotDestination,
  isPremium,
  refreshPremiumState,
  resolveLanguage,
} from '../shared.js';

const TRIAL_CLICKS = 30;
const APP_BASE_URL = 'https://editpage.henri.ren';
const TRIAL_API_BASES = [`${APP_BASE_URL}/api/trial`];

const i18n = {
  en: {
    title: 'Edit Page',
    settings: 'Settings',
    subtitle: 'Make this page editable',
    chooseTool: 'Choose a tool',
    editText: 'Edit text',
    editTextDesc: 'Change any text on this page',
    editMode: 'Edit Mode',
    exitEdit: 'Exit Edit',
    screenshot: 'Screenshot',
    screenshotDesc: 'Capture the viewport or full page',
    visibleScreenshot: 'Current viewport',
    visibleScreenshotDesc: 'Capture only what you see',
    fullPageScreenshot: 'Full page',
    fullPageScreenshotDesc: 'Scroll and capture the entire page',
    preparingFullPage: 'Preparing full-page capture...',
    capturingFullPage: 'Capturing {current} of {total}...',
    stitchingFullPage: 'Stitching the final image...',
    screenshotting: 'Screenshotting...',
    statusScreenshotting: 'Taking screenshot...',
    statusScreenshotSuccess: 'Screenshot copied to clipboard!',
    statusScreenshotDownloaded: 'Screenshot downloaded!',
    savingScreenshot: 'Saving screenshot...',
    statusScreenshotFailed: 'Screenshot failed: ',
    selectImage: 'Select Image',
    changeImage: 'Change image',
    changeImageDesc: 'Choose and replace an image',
    clearImage: 'Clear selected image',
    replaceMode: 'Replace Image Mode',
    exitReplaceMode: 'Exit Replace Mode',
    clickImageToReplace: 'Click an image on the page to replace',
    imageSelected: 'Image selected, click "Replace Image Mode"',
    statusImageReplaced: 'Image replaced!',
    pleaseSelectImageFirst: 'Please select an image first',
    removeElement: 'Remove element',
    removeElementDesc: 'Click anything to remove it',
    exitRemoveMode: 'Exit remove mode',
    clickElementToRemove: 'Click an element on the page to remove it',
    undo: '↶ Undo',
    redo: '↷ Redo',
    done: 'Done',
    changeCount: '{count} changes',
    editWarning: 'Editing may affect page behavior. Refresh to fully restore.',
    trialExpired: 'Trial Expired',
    trialExpiredDesc: 'Your free trial has ended.',
    unlockNow: 'Unlock Now',
    unlockLicense: 'Unlock with License',
    licensePlaceholder: 'Enter license key',
    licenseFormatHint: 'Format: ABCD-2345-EFGH-6789',
    licenseFormatError: 'License key format should look like ABCD-2345-EFGH-6789.',
    inTrial: 'In trial',
    activating: 'Activating...',
    activatingHint: 'Contacting activation server...',
    activationSuccess: 'Activated successfully!',
    activationFailed: 'Activation failed: ',
    enterLicenseKey: 'Please enter a license key',
    invalidLicenseKey: 'Invalid license key',
    licenseRevoked: 'This license key has been revoked.',
    licenseRefunded: 'This license was refunded.',
    licenseKeyMoved: 'This license key is now active on another device.',
    networkError: 'Network error',
    offlineMode: 'Offline Mode',
    connecting: 'Connecting to server...',
    cannotEditThisPage: 'Cannot edit this page',
    pageNotSupported: 'This page type is not supported',
    haveLicense: 'Have a license key?',
    cancel: 'Cancel',
    purchasePageHint: 'Complete your purchase on the opened page, then enter your license key here.'
  },
  zh: {
    title: 'Edit Page',
    settings: '设置',
    subtitle: '编辑当前页面',
    chooseTool: '选择工具',
    editText: '编辑文字',
    editTextDesc: '直接修改当前页面的文字',
    editMode: '编辑模式',
    exitEdit: '退出编辑',
    screenshot: '截图',
    screenshotDesc: '截取当前视窗或完整网页',
    visibleScreenshot: '当前视窗',
    visibleScreenshotDesc: '只截取当前看到的内容',
    fullPageScreenshot: '整张网页',
    fullPageScreenshotDesc: '自动滚动并截取完整页面',
    preparingFullPage: '正在准备整页截图...',
    capturingFullPage: '正在截取第 {current}/{total} 段...',
    stitchingFullPage: '正在拼接完整图片...',
    screenshotting: '截图中...',
    statusScreenshotting: '正在截图...',
    statusScreenshotSuccess: '截图已保存到剪贴板！',
    statusScreenshotDownloaded: '截图已下载！',
    savingScreenshot: '正在保存截图…',
    statusScreenshotFailed: '截图失败: ',
    selectImage: '选择图片',
    changeImage: '更改图片',
    changeImageDesc: '选择图片并替换页面图片',
    clearImage: '清除已选图片',
    replaceMode: '替换图片模式',
    exitReplaceMode: '退出替换模式',
    clickImageToReplace: '点击页面上的图片进行替换',
    imageSelected: '已选择图片，点击"替换图片模式"',
    statusImageReplaced: '图片已替换！',
    pleaseSelectImageFirst: '请先选择图片',
    removeElement: '移除元素',
    removeElementDesc: '点击页面上的任意元素进行移除',
    exitRemoveMode: '退出移除模式',
    clickElementToRemove: '点击页面上的元素即可移除',
    undo: '↶ 撤回',
    redo: '↷ 重做',
    done: '完成',
    changeCount: '已修改 {count} 项',
    editWarning: '编辑可能影响页面功能，刷新网页可完全恢复。',
    trialExpired: '试用已结束',
    trialExpiredDesc: '您的免费试用已结束。',
    unlockNow: '立即解锁',
    unlockLicense: '使用激活码解锁',
    licensePlaceholder: '请输入激活码',
    licenseFormatHint: '格式：ABCD-2345-EFGH-6789',
    licenseFormatError: '激活码格式不正确，应类似 ABCD-2345-EFGH-6789。',
    inTrial: '试用中',
    activating: '激活中...',
    activatingHint: '正在连接激活服务器...',
    activationSuccess: '激活成功！',
    activationFailed: '激活失败: ',
    enterLicenseKey: '请输入激活码',
    invalidLicenseKey: '激活码无效',
    licenseRevoked: '该激活码已被吊销。',
    licenseRefunded: '该激活码对应的订单已退款。',
    licenseKeyMoved: '该激活码当前已在其他设备上生效。',
    networkError: '网络错误',
    offlineMode: '离线模式',
    connecting: '正在连接服务器...',
    cannotEditThisPage: '无法编辑此页面',
    pageNotSupported: '此类页面不支持编辑',
    haveLicense: '已有激活码？',
    cancel: '取消',
    purchasePageHint: '请在打开的页面完成购买，然后回到这里输入激活码。',
    cannotEditThisPage: '无法编辑此页面',
    pageNotSupported: '此类页面不支持编辑'
  }
};

let currentLang = 'en';
let trialInfo = { isUnlocked: false, clicksLeft: TRIAL_CLICKS, clicksUsed: 0, isExpired: false, isOffline: true };

const t = (key) => i18n[currentLang][key] || key;

document.addEventListener('DOMContentLoaded', async () => {
  const editBtn = document.getElementById('editBtn');
  const editBtnLabel = document.getElementById('editBtnLabel');
  const screenshotBtn = document.getElementById('screenshotBtn');
  const screenshotBtnLabel = document.getElementById('screenshotBtnLabel');
  const screenshotOptions = document.getElementById('screenshotOptions');
  const visibleScreenshotBtn = document.getElementById('visibleScreenshotBtn');
  const visibleScreenshotLabel = document.getElementById('visibleScreenshotLabel');
  const fullPageScreenshotBtn = document.getElementById('fullPageScreenshotBtn');
  const fullPageScreenshotLabel = document.getElementById('fullPageScreenshotLabel');
  const captureProgress = document.getElementById('captureProgress');
  const captureProgressBar = document.getElementById('captureProgressBar');
  const captureProgressText = document.getElementById('captureProgressText');
  const removeBtn = document.getElementById('removeBtn');
  const removeBtnLabel = document.getElementById('removeBtnLabel');
  const statusDiv = document.getElementById('status');
  const settingsBtn = document.getElementById('settingsBtn');
  const unsupportedPage = document.getElementById('unsupportedPage');
  const mainContent = document.getElementById('mainContent');
  const trialBadge = document.getElementById('trialBadge');
  const imageInput = document.getElementById('imageInput');
  const selectImageBtn = document.getElementById('selectImageBtn');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const replaceImageBtn = document.getElementById('replaceImageBtn');
  const replaceImageBtnLabel = document.getElementById('replaceImageBtnLabel');

  let selectedImageData = null;
  let isReplaceMode = false;
  let isRemoveMode = false;
  const screenshotDestination = await getScreenshotDestination().catch(() => 'clipboard');

  const getStoredTrialState = async () => {
    const syncResult = await chrome.storage.sync.get(['trialClicksUsed']);
    return {
      trialClicksUsed: typeof syncResult.trialClicksUsed === 'number' ? syncResult.trialClicksUsed : null
    };
  };

  const postTrialApi = async (path, payload) => {
    let lastError = null;

    for (const baseUrl of TRIAL_API_BASES) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          return { ok: true, data };
        }

        const looksLikeTrialApiResponse =
          typeof data === 'object' &&
          data !== null &&
          ('exhausted' in data || 'found' in data || 'error' in data || 'ok' in data);

        if (looksLikeTrialApiResponse) {
          return { ok: false, data };
        }

        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404 ||
          response.status === 405 ||
          response.status >= 500
        ) {
          lastError = data;
          continue;
        }

        return { ok: false, data };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Network error');
  };

  const sha256Hex = async (value) => {
    const input = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', input);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const getTrialFingerprintPayload = async () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const screenInfo = `${screen.width || 0}x${screen.height || 0}x${screen.colorDepth || 0}`;
    const platform = [
      navigator.platform || '',
      navigator.vendor || '',
      String(navigator.hardwareConcurrency || 0),
      String(navigator.deviceMemory || 0),
      navigator.userAgentData?.platform || ''
    ].join('|');
    const rawFingerprint = [
      navigator.userAgent || '',
      navigator.language || '',
      timeZone,
      screenInfo,
      platform
    ].join('||');

    return {
      fingerprintHash: await sha256Hex(rawFingerprint),
      language: navigator.language || null,
      platform,
      screen: screenInfo,
      timeZone: timeZone || null,
      userAgent: navigator.userAgent || null
    };
  };

  const markTrialExhaustedOnBackend = async () => {
    try {
      const payload = await getTrialFingerprintPayload();
      await postTrialApi('/exhaust', payload);
    } catch (error) {}
  };

  const restoreTrialExhaustedState = async () => {
    try {
      const payload = await getTrialFingerprintPayload();
      const response = await postTrialApi('/status', payload);

      if (response.ok && response.data.exhausted) {
        await chrome.storage.sync.set({ trialClicksUsed: TRIAL_CLICKS });
        return true;
      }
    } catch (error) {}

    return false;
  };

  const getTrialInfo = async () => {
    try {
      await refreshPremiumState();
      if (isPremium()) {
        return { isUnlocked: true, clicksLeft: null, isOffline: false };
      }

      const result = await getStoredTrialState();
      const clicksUsed = result.trialClicksUsed ?? 0;
      const clicksLeft = TRIAL_CLICKS - clicksUsed;

      return { isUnlocked: false, clicksLeft, clicksUsed, isExpired: clicksLeft <= 0, isOffline: false };
    } catch (e) {
      return { isUnlocked: false, clicksLeft: TRIAL_CLICKS, clicksUsed: 0, isExpired: false, isOffline: false };
    }
  };

  const incrementTrialClick = async () => {
    try {
      await refreshPremiumState();
      if (!isPremium()) {
        const result = await getStoredTrialState();
        const clicksUsed = (result.trialClicksUsed ?? 0) + 1;
        await chrome.storage.sync.set({ trialClicksUsed: clicksUsed });
        if (clicksUsed >= TRIAL_CLICKS) {
          await markTrialExhaustedOnBackend();
        }
      }
    } catch (e) {}
    return await getTrialInfo();
  };

  const refreshLicenseStatus = async () => {
    await refreshPremiumState();
    if (isPremium()) {
      return true;
    }

    // A license row exists but its signature is stale (or the offline grace
    // window has lapsed) — hit Licentra to re-verify / check in.
    const result = await maybeCheckIn();
    await refreshPremiumState();
    return isPremium() || result.ok === true;
  };

  const updateTrialUI = (info) => {
    trialInfo = info;

    if (info.isUnlocked) {
      mainContent.classList.remove('hidden');
      trialBadge.style.display = 'none';
      return;
    }

    if (info.isExpired) {
      mainContent.classList.remove('hidden');
      trialBadge.textContent = t('trialExpired');
      trialBadge.style.display = 'inline-block';
      return;
    }

    mainContent.classList.remove('hidden');

    trialBadge.textContent = t('inTrial');
    trialBadge.style.display = 'inline-block';
  };

  const applyLanguage = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[currentLang][key]) {
        el.textContent = i18n[currentLang][key];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (i18n[currentLang][key]) {
        el.setAttribute('placeholder', i18n[currentLang][key]);
      }
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      if (i18n[currentLang][key]) {
        el.setAttribute('aria-label', i18n[currentLang][key]);
      }
    });
  };

  const showStatus = (message, isSuccess) => {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (isSuccess ? 'success' : 'error');
    statusDiv.classList.add('visible');

    setTimeout(() => {
      statusDiv.classList.remove('visible');
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 4000);
  };

  const updateButton = (isEditing) => {
    editBtnLabel.textContent = isEditing ? t('exitEdit') : t('editText');
    editBtn.classList.toggle('active', isEditing);
    editBtn.setAttribute('aria-pressed', String(isEditing));
  };

  const isEditablePage = (url) => {
    if (!url) return false;
    const blockedProtocols = ['chrome:', 'about:', 'edge:', 'firefox:', 'opera:', 'brave:'];
    return !blockedProtocols.some(protocol => url.startsWith(protocol));
  };

  const getIsEditing = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!document.body.isContentEditable
      });
      return results[0].result;
    } catch (e) {
      return false;
    }
  };

  const toggleEdit = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const isEditing = !document.body.isContentEditable;
        document.body.contentEditable = isEditing;

        if (isEditing) {
          document.body.classList.add('edit-page-editing');
        } else {
          document.body.classList.remove('edit-page-editing');
        }
        return isEditing;
      }
    });

    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .edit-page-editing {
          outline: 3px dashed #e74c3c !important;
          outline-offset: -3px !important;
        }
        .edit-page-editing *:hover {
          outline: 1px dashed #3498db !important;
        }
      `
    });
  };

  const ensureHistoryManager = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (labels) => {
        const toolbarId = 'edit-page-history-toolbar';
        const styleId = 'edit-page-history-styles';

        let style = document.getElementById(styleId);
        if (!style) {
          style = document.createElement('style');
          style.id = styleId;
          document.head.appendChild(style);
        }
        style.textContent = `
            #${toolbarId} {
              position: fixed !important;
              left: 50% !important;
              bottom: 22px !important;
              z-index: 2147483647 !important;
              display: flex !important;
              flex-wrap: wrap !important;
              align-items: center !important;
              gap: 8px !important;
              width: max-content !important;
              max-width: calc(100vw - 32px) !important;
              padding: 8px 10px !important;
              color: #172033 !important;
              font: 13px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
              background: rgba(255, 255, 255, 0.96) !important;
              border: 1px solid rgba(79, 70, 229, 0.2) !important;
              border-radius: 14px !important;
              box-shadow: 0 10px 34px rgba(15, 23, 42, 0.2) !important;
              transform: translateX(-50%) !important;
              backdrop-filter: blur(12px) !important;
              user-select: none !important;
            }
            #${toolbarId} * { box-sizing: border-box !important; }
            #${toolbarId} button {
              flex: none !important;
              width: auto !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 8px 11px !important;
              color: #3730a3 !important;
              font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
              background: #eef2ff !important;
              border: 0 !important;
              border-radius: 9px !important;
              cursor: pointer !important;
            }
            #${toolbarId} button:hover { background: #e0e7ff !important; }
            #${toolbarId} button:disabled { opacity: 0.35 !important; cursor: not-allowed !important; }
            #${toolbarId} .edit-page-history-done { color: #fff !important; background: #4f46e5 !important; }
            #${toolbarId} .edit-page-history-info { flex: none !important; white-space: nowrap !important; color: #64748b !important; }
            #${toolbarId} .edit-page-history-warning {
              flex: 0 1 auto !important;
              min-width: 0 !important;
              color: #92400e !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
              white-space: normal !important;
            }
        `;

        const createToolbar = () => {
          let toolbar = document.getElementById(toolbarId);
          if (toolbar) return toolbar;
          toolbar = document.createElement('div');
          toolbar.id = toolbarId;
          toolbar.contentEditable = 'false';
          toolbar.innerHTML = `
            <button type="button" data-action="undo"></button>
            <button type="button" data-action="redo"></button>
            <span class="edit-page-history-info"></span>
            <span class="edit-page-history-warning"></span>
            <button type="button" class="edit-page-history-done" data-action="done"></button>
          `;
          for (const eventName of ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend']) {
            // Let the target button run first, then stop the event before it
            // bubbles into the host page. Capture-phase blocking here would
            // prevent the toolbar's own buttons from receiving the event.
            toolbar.addEventListener(eventName, (event) => event.stopPropagation());
          }
          toolbar.querySelector('[data-action="undo"]').addEventListener('click', () => window._editPageHistory?.undo());
          toolbar.querySelector('[data-action="redo"]').addEventListener('click', () => window._editPageHistory?.redo());
          toolbar.querySelector('[data-action="done"]').addEventListener('click', () => window._editPageFinishEditingSession?.());
          document.body.appendChild(toolbar);
          return toolbar;
        };

        if (!window._editPageHistory) {
          const history = {
            undoStack: [],
            redoStack: [],
            pendingText: null,
            labels,
            update() {
              const toolbar = createToolbar();
              const undoButton = toolbar.querySelector('[data-action="undo"]');
              const redoButton = toolbar.querySelector('[data-action="redo"]');
              undoButton.textContent = this.labels.undo;
              redoButton.textContent = this.labels.redo;
              toolbar.querySelector('[data-action="done"]').textContent = this.labels.done;
              toolbar.querySelector('.edit-page-history-info').textContent = this.labels.count.replace('{count}', String(this.undoStack.length));
              toolbar.querySelector('.edit-page-history-warning').textContent = this.labels.warning;
              undoButton.disabled = this.undoStack.length === 0;
              redoButton.disabled = this.redoStack.length === 0;
            },
            push(operation) {
              const previous = this.undoStack[this.undoStack.length - 1];
              if (
                operation.type === 'text' &&
                previous?.type === 'text' &&
                previous.element === operation.element &&
                operation.time - previous.time < 900
              ) {
                previous.after = operation.after;
                previous.time = operation.time;
              } else {
                this.undoStack.push(operation);
              }
              this.redoStack = [];
              this.update();
            },
            apply(operation, direction) {
              const value = direction === 'undo' ? operation.before : operation.after;
              if (operation.type === 'text') {
                if (operation.element?.isConnected) operation.element.innerHTML = value;
              } else if (operation.type === 'image') {
                if (!operation.element?.isConnected) return;
                if (operation.imageKind === 'img') {
                  const setAttribute = (name, attributeValue) => {
                    if (attributeValue == null) operation.element.removeAttribute(name);
                    else operation.element.setAttribute(name, attributeValue);
                  };
                  setAttribute('src', value.src);
                  setAttribute('srcset', value.srcset);
                  operation.sources.forEach((source, index) => {
                    const sourceValue = value.sources[index];
                    if (!sourceValue) return;
                    for (const name of ['srcset', 'media', 'type']) {
                      if (sourceValue[name] == null) source.removeAttribute(name);
                      else source.setAttribute(name, sourceValue[name]);
                    }
                  });
                } else {
                  operation.element.style.backgroundImage = value.backgroundImage;
                }
              } else if (operation.type === 'remove') {
                if (direction === 'undo') {
                  if (!operation.parent?.isConnected) return;
                  if (operation.nextSibling?.parentNode === operation.parent) {
                    operation.parent.insertBefore(operation.element, operation.nextSibling);
                  } else {
                    operation.parent.appendChild(operation.element);
                  }
                } else if (operation.element?.isConnected) {
                  operation.element.remove();
                }
              }
            },
            undo() {
              const operation = this.undoStack.pop();
              if (!operation) return;
              this.apply(operation, 'undo');
              this.redoStack.push(operation);
              this.update();
            },
            redo() {
              const operation = this.redoStack.pop();
              if (!operation) return;
              this.apply(operation, 'redo');
              this.undoStack.push(operation);
              this.update();
            }
          };
          window._editPageHistory = history;

          window._editPageTextBeforeInput = () => {
            if (!document.body.isContentEditable) return;
            const selection = window.getSelection();
            let element = selection?.anchorNode;
            if (element?.nodeType === Node.TEXT_NODE) element = element.parentElement;
            if (!(element instanceof Element) || element.closest(`#${toolbarId}`)) return;
            element = element.closest('p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,figcaption,button,a,label,span,div') || element;
            history.pendingText = { element, before: element.innerHTML };
          };

          window._editPageTextInput = () => {
            const pending = history.pendingText;
            history.pendingText = null;
            if (!pending?.element?.isConnected) return;
            const after = pending.element.innerHTML;
            if (pending.before !== after) {
              history.push({
                type: 'text',
                element: pending.element,
                before: pending.before,
                after,
                time: Date.now()
              });
            }
          };

          window._editPageHistoryKeyHandler = (event) => {
            if (!document.getElementById(toolbarId)) return;
            if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) history.redo();
            else history.undo();
          };

          document.addEventListener('beforeinput', window._editPageTextBeforeInput, true);
          document.addEventListener('input', window._editPageTextInput, true);
          document.addEventListener('keydown', window._editPageHistoryKeyHandler, true);
        }

        window._editPageFinishEditingSession = () => {
          document.body.contentEditable = 'false';
          document.body.classList.remove('edit-page-editing', 'edit-page-replace-mode', 'edit-page-remove-mode');
          if (window._editPageReplaceHandler) document.removeEventListener('click', window._editPageReplaceHandler, true);
          if (window._editPageReplaceMouseDownHandler) document.removeEventListener('mousedown', window._editPageReplaceMouseDownHandler, true);
          if (window._editPageRemoveClickHandler) document.removeEventListener('click', window._editPageRemoveClickHandler, true);
          if (window._editPageRemoveOverHandler) document.removeEventListener('mouseover', window._editPageRemoveOverHandler, true);
          if (window._editPageRemoveOutHandler) document.removeEventListener('mouseout', window._editPageRemoveOutHandler, true);
          window._editPageReplaceHandler = null;
          window._editPageReplaceMouseDownHandler = null;
          window._editPageRemoveClickHandler = null;
          window._editPageRemoveOverHandler = null;
          window._editPageRemoveOutHandler = null;
          document.querySelectorAll('.edit-page-remove-target').forEach((element) => element.classList.remove('edit-page-remove-target'));
          document.getElementById(toolbarId)?.remove();
        };

        window._editPageHistory.labels = labels;
        window._editPageHistory.update();
      },
      args: [{
        undo: t('undo'),
        redo: t('redo'),
        done: t('done'),
        count: t('changeCount'),
        warning: t('editWarning')
      }]
    });
  };

  const stopEditMode = async () => {
    if (await getIsEditing()) {
      await toggleEdit();
    }
    updateButton(false);
  };

  const finishEditingSession = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window._editPageFinishEditingSession?.()
    }).catch(() => {});
  };

  const copyScreenshotToClipboard = async (dataUrl) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  };

  const screenshotFilename = (kind) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `edit-page-${kind}-${timestamp}.png`;
  };

  const saveScreenshot = async (dataUrl, kind) => {
    if (screenshotDestination === 'download') {
      await chrome.downloads.download({
        url: dataUrl,
        filename: screenshotFilename(kind),
        saveAs: false
      });
      return t('statusScreenshotDownloaded');
    }
    await copyScreenshotToClipboard(dataUrl);
    return t('statusScreenshotSuccess');
  };

  const takeVisibleScreenshot = async () => {
    try {
      visibleScreenshotBtn.disabled = true;
      visibleScreenshotLabel.textContent = t('screenshotting');
      showStatus(t('statusScreenshotting'), true);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png'
      });

      const successMessage = await saveScreenshot(dataUrl, 'viewport');
      showStatus(successMessage, true);
    } catch (e) {
      console.error('Screenshot failed:', e);
      showStatus(t('statusScreenshotFailed') + e.message, false);
    } finally {
      visibleScreenshotBtn.disabled = false;
      visibleScreenshotLabel.textContent = t('visibleScreenshot');
    }
  };

  const setCaptureProgress = (progress) => {
    if (!progress) {
      captureProgress.classList.add('hidden');
      captureProgressBar.style.width = '0%';
      captureProgressText.textContent = '';
      return;
    }

    captureProgress.classList.remove('hidden');
    let percent = 8;
    let message = t('preparingFullPage');
    if (progress.status === 'capturing') {
      const current = progress.current || 0;
      const total = progress.total || 1;
      percent = Math.max(10, Math.round((current / total) * 88));
      message = t('capturingFullPage')
        .replace('{current}', String(current))
        .replace('{total}', String(total));
    } else if (progress.status === 'stitching') {
      percent = 94;
      message = t('stitchingFullPage');
    } else if (progress.status === 'done') {
      percent = 100;
      message = t('savingScreenshot');
    } else if (progress.status === 'error') {
      percent = 100;
      message = t('statusScreenshotFailed') + (progress.error || '');
    }
    captureProgressBar.style.width = `${percent}%`;
    captureProgressText.textContent = message;
  };

  const takeFullPageScreenshot = async () => {
    fullPageScreenshotBtn.disabled = true;
    visibleScreenshotBtn.disabled = true;
    fullPageScreenshotLabel.textContent = t('screenshotting');
    setCaptureProgress({ status: 'preparing' });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await Promise.race([
        chrome.runtime.sendMessage({
          action: 'captureFullPage',
          tabId: tab.id,
          windowId: tab.windowId
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Full-page capture timed out')), 180000);
        })
      ]);

      if (!result?.ok || !result.dataUrl) {
        throw new Error(result?.error || 'Full-page capture failed');
      }

      const successMessage = await saveScreenshot(result.dataUrl, 'full-page');
      captureProgressBar.style.width = '100%';
      captureProgressText.textContent = successMessage;
      showStatus(successMessage, true);
    } catch (error) {
      console.error('Full-page screenshot failed:', error);
      showStatus(t('statusScreenshotFailed') + error.message, false);
    } finally {
      fullPageScreenshotBtn.disabled = false;
      visibleScreenshotBtn.disabled = false;
      fullPageScreenshotLabel.textContent = t('fullPageScreenshot');
      setTimeout(() => setCaptureProgress(null), 1800);
    }
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.fullPageCaptureProgress?.newValue) {
      setCaptureProgress(changes.fullPageCaptureProgress.newValue);
    }
  });

  const saveImageData = async (data) => {
    try {
      if (data) {
        await chrome.storage.local.set({ replaceImageData: data });
      } else {
        await chrome.storage.local.remove('replaceImageData');
      }
    } catch (e) {}
  };

  const loadImageData = async () => {
    try {
      const result = await chrome.storage.local.get(['replaceImageData']);
      return result.replaceImageData || null;
    } catch (e) {
      return null;
    }
  };

  const checkReplaceModeActive = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!document.body.classList.contains('edit-page-replace-mode')
      });
      return results[0].result;
    } catch (e) {
      return false;
    }
  };

  const checkRemoveModeActive = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!document.body.classList.contains('edit-page-remove-mode')
      });
      return results[0].result;
    } catch (e) {
      return false;
    }
  };

  const updateRemoveButton = () => {
    removeBtnLabel.textContent = isRemoveMode ? t('exitRemoveMode') : t('removeElement');
    removeBtn.classList.toggle('active', isRemoveMode);
    removeBtn.setAttribute('aria-pressed', String(isRemoveMode));
  };

  const stopRemoveMode = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._editPageRemoveClickHandler) {
          document.removeEventListener('click', window._editPageRemoveClickHandler, true);
          document.removeEventListener('mouseover', window._editPageRemoveOverHandler, true);
          document.removeEventListener('mouseout', window._editPageRemoveOutHandler, true);
        }
        window._editPageRemoveClickHandler = null;
        window._editPageRemoveOverHandler = null;
        window._editPageRemoveOutHandler = null;
        document.querySelectorAll('.edit-page-remove-target').forEach((element) => {
          element.classList.remove('edit-page-remove-target');
        });
        document.body.classList.remove('edit-page-remove-mode');
      }
    });
  };

  const startRemoveMode = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._editPageRemoveClickHandler) return;

        const canRemove = (element) =>
          element instanceof Element &&
          element !== document.documentElement &&
          element !== document.body &&
          !element.closest('#edit-page-history-toolbar');

        window._editPageRemoveOverHandler = (event) => {
          if (!canRemove(event.target)) return;
          document.querySelectorAll('.edit-page-remove-target').forEach((element) => {
            if (element !== event.target) element.classList.remove('edit-page-remove-target');
          });
          event.target.classList.add('edit-page-remove-target');
        };

        window._editPageRemoveOutHandler = (event) => {
          if (canRemove(event.target)) event.target.classList.remove('edit-page-remove-target');
        };

        window._editPageRemoveClickHandler = (event) => {
          if (!canRemove(event.target)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          const parent = event.target.parentNode;
          const nextSibling = event.target.nextSibling;
          window._editPageHistory?.push({
            type: 'remove',
            element: event.target,
            parent,
            nextSibling,
            before: null,
            after: null,
            time: Date.now()
          });
          event.target.remove();
        };

        document.addEventListener('mouseover', window._editPageRemoveOverHandler, true);
        document.addEventListener('mouseout', window._editPageRemoveOutHandler, true);
        document.addEventListener('click', window._editPageRemoveClickHandler, true);
        document.body.classList.add('edit-page-remove-mode');
      }
    });

    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .edit-page-remove-mode,
        .edit-page-remove-mode * {
          cursor: crosshair !important;
        }
        .edit-page-remove-target {
          outline: 3px solid #ef4444 !important;
          outline-offset: 2px !important;
          background-color: rgba(239, 68, 68, 0.08) !important;
        }
      `
    });
  };

  const updateReplaceButton = () => {
    replaceImageBtnLabel.textContent = isReplaceMode ? t('exitReplaceMode') : t('replaceMode');
    replaceImageBtn.classList.toggle('active', isReplaceMode);
    replaceImageBtn.setAttribute('aria-pressed', String(isReplaceMode));
  };

  const clearImage = async () => {
    selectedImageData = null;
    imagePreview.classList.add('hidden');
    previewImg.src = '';
    replaceImageBtn.classList.add('hidden');
    await saveImageData(null);
    if (isReplaceMode) {
      isReplaceMode = false;
      updateReplaceButton();
      await stopReplaceMode();
    }
  };

  const startReplaceMode = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (imageData) => {
        if (window._editPageReplaceHandler) {
          return;
        }

        window._editPageReplaceImage = imageData;

        const findImageElement = (element) => {
          if (!element) return null;

          if (element.tagName === 'IMG') {
            return element;
          }

          const img = element.querySelector('img');
          if (img) return img;

          const bgImg = window.getComputedStyle(element).backgroundImage;
          if (bgImg && bgImg !== 'none') {
            return element;
          }

          return null;
        };

        window._editPageReplaceHandler = (e) => {
          if (!window._editPageReplaceImage) return;
          if (e.target instanceof Element && e.target.closest('#edit-page-history-toolbar')) return;

          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          let target = e.target;

          let img = findImageElement(target);

          if (!img) {
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            for (const el of elements) {
              img = findImageElement(el);
              if (img) break;
            }
          }

          if (img) {
            if (img.tagName === 'IMG') {
              const picture = img.closest('picture');
              const sources = picture ? Array.from(picture.querySelectorAll('source')) : [];
              const snapshot = () => ({
                src: img.getAttribute('src'),
                srcset: img.getAttribute('srcset'),
                sources: sources.map((source) => ({
                  srcset: source.getAttribute('srcset'),
                  media: source.getAttribute('media'),
                  type: source.getAttribute('type')
                }))
              });
              const before = snapshot();
              img.src = window._editPageReplaceImage;
              if (img.srcset) {
                img.srcset = '';
              }

              if (picture) {
                sources.forEach(source => {
                  source.removeAttribute('srcset');
                  source.removeAttribute('media');
                  source.removeAttribute('type');
                });
              }
              window._editPageHistory?.push({
                type: 'image',
                imageKind: 'img',
                element: img,
                sources,
                before,
                after: snapshot(),
                time: Date.now()
              });
            } else {
              const before = { backgroundImage: img.style.backgroundImage };
              img.style.backgroundImage = `url(${window._editPageReplaceImage})`;
              window._editPageHistory?.push({
                type: 'image',
                imageKind: 'background',
                element: img,
                sources: [],
                before,
                after: { backgroundImage: img.style.backgroundImage },
                time: Date.now()
              });
            }
          }
        };

        window._editPageReplaceMouseDownHandler = (event) => {
          if (event.target instanceof Element && event.target.closest('#edit-page-history-toolbar')) return;
          event.preventDefault();
        };

        document.addEventListener('click', window._editPageReplaceHandler, true);
        document.addEventListener('mousedown', window._editPageReplaceMouseDownHandler, true);
        document.body.classList.add('edit-page-replace-mode');
      },
      args: [selectedImageData]
    });

    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .edit-page-replace-mode * {
          pointer-events: auto !important;
        }
        .edit-page-replace-mode img,
        .edit-page-replace-mode [style*='background-image'] {
          cursor: crosshair !important;
          outline: 2px dashed #e67e22 !important;
          outline-offset: 2px !important;
        }
        .edit-page-replace-mode img:hover,
        .edit-page-replace-mode [style*='background-image']:hover {
          outline-color: #e74c3c !important;
        }
      `
    });
  };

  const stopReplaceMode = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._editPageReplaceHandler) {
          document.removeEventListener('click', window._editPageReplaceHandler, true);
        }
        if (window._editPageReplaceMouseDownHandler) {
          document.removeEventListener('mousedown', window._editPageReplaceMouseDownHandler, true);
        }
        window._editPageReplaceHandler = null;
        window._editPageReplaceMouseDownHandler = null;
        window._editPageReplaceImage = null;
        document.body.classList.remove('edit-page-replace-mode');
      }
    });
  };

  currentLang = await resolveLanguage().catch(() => 'en');
  applyLanguage();

  settingsBtn.addEventListener('click', (event) => {
    event.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });

  let startupStatusTimer = setTimeout(() => {
    showStatus(t('connecting'), true);
  }, 350);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageEditable = isEditablePage(tab.url);

  if (!pageEditable) {
    unsupportedPage.classList.remove('hidden');
    mainContent.classList.add('hidden');
    return;
  }

  await refreshLicenseStatus();

  const initialStoredState = await getStoredTrialState();
  if (!isPremium() && initialStoredState.trialClicksUsed == null) {
    await restoreTrialExhaustedState();
  }

  trialInfo = await getTrialInfo();

  clearTimeout(startupStatusTimer);

  updateTrialUI(trialInfo);
  statusDiv.classList.remove('visible');

  if (!trialInfo.isExpired || trialInfo.isUnlocked) {
    const isEditing = await getIsEditing();
    updateButton(isEditing);

    const savedImage = await loadImageData();
    if (savedImage) {
      selectedImageData = savedImage;
      previewImg.src = selectedImageData;
      imagePreview.classList.remove('hidden');
      replaceImageBtn.classList.remove('hidden');
    }

    const replaceModeActive = await checkReplaceModeActive();
    if (replaceModeActive && selectedImageData) {
      isReplaceMode = true;
      updateReplaceButton();
    }

    const removeModeActive = await checkRemoveModeActive();
    if (removeModeActive) {
      isRemoveMode = true;
      updateRemoveButton();
    }

    editBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      const willEnableEdit = !(await getIsEditing());
      if (willEnableEdit) {
        await ensureHistoryManager();
        if (isReplaceMode) {
          isReplaceMode = false;
          await stopReplaceMode();
          updateReplaceButton();
        }
        if (isRemoveMode) {
          isRemoveMode = false;
          await stopRemoveMode();
          updateRemoveButton();
        }
      }
      await toggleEdit();
      const newIsEditing = await getIsEditing();
      updateButton(newIsEditing);
      updateTrialUI(trialInfo);
    });

    const prepareForScreenshot = async () => {
      await stopEditMode();
      if (isReplaceMode) {
        isReplaceMode = false;
        await stopReplaceMode();
        updateReplaceButton();
      }
      if (isRemoveMode) {
        isRemoveMode = false;
        await stopRemoveMode();
        updateRemoveButton();
      }
      await finishEditingSession();
    };

    screenshotBtn.addEventListener('click', () => {
      const expanded = screenshotBtn.getAttribute('aria-expanded') === 'true';
      screenshotBtn.setAttribute('aria-expanded', String(!expanded));
      screenshotOptions.classList.toggle('hidden', expanded);
    });

    visibleScreenshotBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      await prepareForScreenshot();
      await takeVisibleScreenshot();
      updateTrialUI(trialInfo);
    });

    fullPageScreenshotBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      await prepareForScreenshot();
      await takeFullPageScreenshot();
      updateTrialUI(trialInfo);
    });

    selectImageBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      imageInput.click();
    });

    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          selectedImageData = event.target.result;
          previewImg.src = selectedImageData;
          imagePreview.classList.remove('hidden');
          replaceImageBtn.classList.remove('hidden');
          await saveImageData(selectedImageData);
          showStatus(t('imageSelected'), true);
        };
        reader.readAsDataURL(file);
      }
    });

    clearImageBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await clearImage();
      imageInput.value = '';
    });

    replaceImageBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      if (!selectedImageData) {
        showStatus(t('pleaseSelectImageFirst'), false);
        return;
      }
      trialInfo = await incrementTrialClick();
      isReplaceMode = !isReplaceMode;
      if (isReplaceMode) {
        await ensureHistoryManager();
        await stopEditMode();
        if (isRemoveMode) {
          isRemoveMode = false;
          await stopRemoveMode();
          updateRemoveButton();
        }
        await startReplaceMode();
      } else {
        await stopReplaceMode();
      }
      updateReplaceButton();
      updateTrialUI(trialInfo);
    });

    removeBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }

      trialInfo = await incrementTrialClick();
      isRemoveMode = !isRemoveMode;
      if (isRemoveMode) {
        await ensureHistoryManager();
        await stopEditMode();
        if (isReplaceMode) {
          isReplaceMode = false;
          await stopReplaceMode();
          updateReplaceButton();
        }
        await startRemoveMode();
        showStatus(t('clickElementToRemove'), true);
      } else {
        await stopRemoveMode();
      }
      updateRemoveButton();
      updateTrialUI(trialInfo);
    });
  }
});
