const TRIAL_CLICKS = 10;
const APP_BASE_URL = 'https://editpage.henri.ren';
const PREVIEW_APP_BASE_URL = 'https://editpage-pre.henri.ren';
const LICENSE_API_BASES = [`${PREVIEW_APP_BASE_URL}/api/license`, `${APP_BASE_URL}/api/license`];
const TRIAL_API_BASES = [`${PREVIEW_APP_BASE_URL}/api/trial`, `${APP_BASE_URL}/api/trial`];
const LICENSE_STORAGE_KEYS = ['deviceId', 'isUnlocked', 'licenseKey'];

const i18n = {
  en: {
    title: 'Edit Page',
    subtitle: 'Make this page editable',
    editMode: 'Edit Mode',
    exitEdit: 'Exit Edit',
    screenshot: 'Screenshot',
    screenshotting: 'Screenshotting...',
    langLabel: 'EN/中',
    statusScreenshotting: 'Taking screenshot...',
    statusScreenshotSuccess: 'Screenshot copied to clipboard!',
    statusScreenshotFailed: 'Screenshot failed: ',
    selectImage: 'Select Image',
    replaceMode: 'Replace Image Mode',
    exitReplaceMode: 'Exit Replace Mode',
    clickImageToReplace: 'Click an image on the page to replace',
    imageSelected: 'Image selected, click "Replace Image Mode"',
    statusImageReplaced: 'Image replaced!',
    pleaseSelectImageFirst: 'Please select an image first',
    trialExpired: 'Trial Expired',
    trialExpiredDesc: 'Your free trial has ended.',
    unlockNow: 'Unlock Now',
    unlockLicense: 'Unlock with License',
    licensePlaceholder: 'Enter license key',
    licenseFormatHint: 'Format: ABCDE-FGHIJ-KLMNO-PQRST',
    licenseFormatError: 'License key format should look like ABCDE-FGHIJ-KLMNO-PQRST.',
    inTrial: 'In trial',
    activating: 'Activating...',
    activatingHint: 'Contacting activation server...',
    activationSuccess: 'Activated successfully!',
    activationFailed: 'Activation failed: ',
    enterLicenseKey: 'Please enter a license key',
    invalidLicenseKey: 'Invalid license key',
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
    subtitle: '编辑当前页面',
    editMode: '编辑模式',
    exitEdit: '退出编辑',
    screenshot: '截图',
    screenshotting: '截图中...',
    langLabel: '中/EN',
    statusScreenshotting: '正在截图...',
    statusScreenshotSuccess: '截图已保存到剪贴板！',
    statusScreenshotFailed: '截图失败: ',
    selectImage: '选择图片',
    replaceMode: '替换图片模式',
    exitReplaceMode: '退出替换模式',
    clickImageToReplace: '点击页面上的图片进行替换',
    imageSelected: '已选择图片，点击"替换图片模式"',
    statusImageReplaced: '图片已替换！',
    pleaseSelectImageFirst: '请先选择图片',
    trialExpired: '试用已结束',
    trialExpiredDesc: '您的免费试用已结束。',
    unlockNow: '立即解锁',
    unlockLicense: '使用激活码解锁',
    licensePlaceholder: '请输入激活码',
    licenseFormatHint: '格式：ABCDE-FGHIJ-KLMNO-PQRST',
    licenseFormatError: '激活码格式不正确，应类似 ABCDE-FGHIJ-KLMNO-PQRST。',
    inTrial: '试用中',
    activating: '激活中...',
    activatingHint: '正在连接激活服务器...',
    activationSuccess: '激活成功！',
    activationFailed: '激活失败: ',
    enterLicenseKey: '请输入激活码',
    invalidLicenseKey: '激活码无效',
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

let currentLang = 'zh';
let trialInfo = { isUnlocked: false, clicksLeft: TRIAL_CLICKS, clicksUsed: 0, isExpired: false, isOffline: true };

const t = (key) => i18n[currentLang][key] || key;

document.addEventListener('DOMContentLoaded', async () => {
  const editBtn = document.getElementById('editBtn');
  const screenshotBtn = document.getElementById('screenshotBtn');
  const statusDiv = document.getElementById('status');
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langLabel = document.getElementById('langLabel');
  const unsupportedPage = document.getElementById('unsupportedPage');
  const paywall = document.getElementById('paywall');
  const mainContent = document.getElementById('mainContent');
  const trialBadge = document.getElementById('trialBadge');
  const trialDaysLeft = document.getElementById('trialDaysLeft');
  const unlockBtn = document.getElementById('unlockBtn');
  const licenseInput = document.getElementById('licenseInput');
  const licenseFeedback = document.getElementById('licenseFeedback');
  const imageInput = document.getElementById('imageInput');
  const selectImageBtn = document.getElementById('selectImageBtn');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const replaceImageBtn = document.getElementById('replaceImageBtn');
  const payBtn = document.getElementById('payBtn');

  let selectedImageData = null;
  let isReplaceMode = false;

  const getStoredLicenseState = async () => {
    const [syncResult, localResult] = await Promise.all([
      chrome.storage.sync.get(['trialClicksUsed']),
      chrome.storage.local.get(LICENSE_STORAGE_KEYS)
    ]);

    return {
      trialClicksUsed: typeof syncResult.trialClicksUsed === 'number' ? syncResult.trialClicksUsed : null,
      ...localResult
    };
  };

  const saveLicenseState = async (data) => {
    await chrome.storage.local.set(data);
  };

  const clearLicenseState = async () => {
    await chrome.storage.local.remove(LICENSE_STORAGE_KEYS);
  };

  const getManifestVersion = () => chrome.runtime.getManifest().version || '0.0.0';

  const generateDeviceId = () => {
    if (globalThis.crypto?.randomUUID) {
      return `dev_${globalThis.crypto.randomUUID()}`;
    }

    const random = Math.random().toString(36).slice(2, 12);
    return `dev_${Date.now().toString(36)}_${random}`;
  };

  const getOrCreateDeviceId = async () => {
    const result = await chrome.storage.local.get(['deviceId']);
    if (result.deviceId) {
      return result.deviceId;
    }

    const deviceId = generateDeviceId();
    await chrome.storage.local.set({ deviceId });
    return deviceId;
  };

  const normalizeError = (reasonOrMessage) => {
    switch (reasonOrMessage) {
      case 'invalid_license':
        return t('invalidLicenseKey');
      case 'device_not_activated':
        return t('licenseKeyMoved');
      case 'Network error':
        return t('networkError');
      default:
        return reasonOrMessage || t('networkError');
    }
  };

  const setLicenseFeedback = (message, kind = 'neutral') => {
    licenseFeedback.textContent = message;
    licenseFeedback.className = `license-feedback${kind === 'neutral' ? '' : ` ${kind}`}`;
  };

  const setLicenseInputError = (hasError) => {
    licenseInput.classList.toggle('input-error', hasError);
  };

  const postLicenseApi = async (path, payload) => {
    let lastError = null;

    for (const baseUrl of LICENSE_API_BASES) {
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

        const looksLikeLicenseApiResponse =
          typeof data === 'object' &&
          data !== null &&
          ('reason' in data || 'error' in data || 'ok' in data);

        if (looksLikeLicenseApiResponse) {
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
    } catch (error) {
      console.warn('[trial] failed to persist exhausted state', error);
    }
  };

  const restoreTrialExhaustedState = async () => {
    try {
      const payload = await getTrialFingerprintPayload();
      const response = await postTrialApi('/status', payload);

      if (response.ok && response.data.exhausted) {
        await chrome.storage.sync.set({ trialClicksUsed: TRIAL_CLICKS });
        return true;
      }
    } catch (error) {
      console.warn('[trial] failed to restore exhausted state', error);
    }

    return false;
  };

  const getTrialInfo = async () => {
    try {
      const result = await getStoredLicenseState();

      if (result.isUnlocked) {
        return { isUnlocked: true, clicksLeft: null, isOffline: false };
      }

      const clicksUsed = result.trialClicksUsed ?? 0;

      const clicksLeft = TRIAL_CLICKS - clicksUsed;

      return { isUnlocked: false, clicksLeft, clicksUsed, isExpired: clicksLeft <= 0, isOffline: false };
    } catch (e) {
      return { isUnlocked: false, clicksLeft: TRIAL_CLICKS, clicksUsed: 0, isExpired: false, isOffline: false };
    }
  };

  const incrementTrialClick = async () => {
    try {
      const result = await getStoredLicenseState();
      if (!result.isUnlocked) {
        const clicksUsed = (result.trialClicksUsed ?? 0) + 1;
        await chrome.storage.sync.set({ trialClicksUsed: clicksUsed });
        if (clicksUsed >= TRIAL_CLICKS) {
          await markTrialExhaustedOnBackend();
        }
      }
    } catch (e) {}
    return await getTrialInfo();
  };

  const normalizeLicenseKey = (key) => {
    const normalized = key
      .trim()
      .toUpperCase()
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 20);
    const parts = normalized.match(/.{1,5}/g) || [];
    return parts.join('-');
  };

  const verifyLicenseKey = (key) => {
    const cleanKey = normalizeLicenseKey(key);
    const keyPattern = /^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){3}$/;
    return keyPattern.test(cleanKey);
  };

  const verifyLicenseWithBackend = async (key) => {
    try {
      const deviceId = await getOrCreateDeviceId();
      const normalizedKey = normalizeLicenseKey(key);
      const response = await postLicenseApi('/verify', {
        deviceId,
        extensionVersion: getManifestVersion(),
        licenseKey: normalizedKey
      });

      if (response.ok && response.data.ok) {
        return { success: true };
      }

      return {
        success: false,
        error: response.data.reason || response.data.error || t('invalidLicenseKey')
      };
    } catch (e) {
      console.error('License verification failed:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const activateLicense = async (key) => {
    if (!verifyLicenseKey(key)) {
      console.log('[license] local format validation failed', { raw: key, normalized: normalizeLicenseKey(key) });
      return { success: false, error: 'local_format_invalid' };
    }

    try {
      const deviceId = await getOrCreateDeviceId();
      const normalizedKey = normalizeLicenseKey(key);
      const response = await postLicenseApi('/activate', {
        deviceId,
        extensionVersion: getManifestVersion(),
        licenseKey: normalizedKey
      });

      if (response.ok && response.data.ok) {
        await saveLicenseState({
          deviceId,
          isUnlocked: true,
          licenseKey: normalizedKey
        });
        return { success: true, replacedDeviceId: response.data.replacedDeviceId || null };
      }

      return {
        success: false,
        error: response.data.reason || response.data.error || t('invalidLicenseKey')
      };
    } catch (e) {
      console.error('License activation failed:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const refreshLicenseStatus = async () => {
    const { isUnlocked, licenseKey } = await chrome.storage.local.get(['isUnlocked', 'licenseKey']);

    if (!isUnlocked || !licenseKey) {
      return false;
    }

    const result = await verifyLicenseWithBackend(licenseKey);

    if (result.success) {
      return true;
    }

    if (result.error !== 'Network error') {
      await clearLicenseState();
    }

    return result.error === 'Network error';
  };

  const updateTrialUI = (info) => {
    trialInfo = info;

    if (info.isUnlocked) {
      paywall.classList.add('hidden');
      mainContent.classList.remove('hidden');
      trialBadge.style.display = 'none';
      return;
    }

    if (info.isExpired) {
      paywall.classList.remove('hidden');
      mainContent.classList.add('hidden');
      return;
    }

    paywall.classList.add('hidden');
    mainContent.classList.remove('hidden');

    trialBadge.textContent = t('inTrial');
    trialBadge.style.display = 'inline-block';

    if (trialDaysLeft) {
      trialDaysLeft.textContent = '';
    }
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
    langLabel.textContent = t('langLabel');
    setLicenseFeedback(t('licenseFormatHint'));
  };

  const showStatus = (message, isSuccess) => {
    console.log('[popup-status]', { message, isSuccess });
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
    editBtn.textContent = isEditing ? t('exitEdit') : t('editMode');
    editBtn.classList.toggle('active', isEditing);
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

  const takeScreenshot = async () => {
    try {
      screenshotBtn.disabled = true;
      screenshotBtn.textContent = t('screenshotting');
      showStatus(t('statusScreenshotting'), true);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png'
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      showStatus(t('statusScreenshotSuccess'), true);
    } catch (e) {
      console.error('Screenshot failed:', e);
      showStatus(t('statusScreenshotFailed') + e.message, false);
    } finally {
      screenshotBtn.disabled = false;
      screenshotBtn.textContent = t('screenshot');
    }
  };

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

  const updateReplaceButton = () => {
    replaceImageBtn.textContent = isReplaceMode ? t('exitReplaceMode') : t('replaceMode');
    replaceImageBtn.classList.toggle('active', isReplaceMode);
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
              img.src = window._editPageReplaceImage;
              if (img.srcset) {
                img.srcset = '';
              }

              const picture = img.closest('picture');
              if (picture) {
                const sources = picture.querySelectorAll('source');
                sources.forEach(source => {
                  source.removeAttribute('srcset');
                  source.removeAttribute('media');
                  source.removeAttribute('type');
                });
              }
            } else {
              img.style.backgroundImage = `url(${window._editPageReplaceImage})`;
            }
          }
        };

        document.addEventListener('click', window._editPageReplaceHandler, true);
        document.addEventListener('mousedown', (e) => e.preventDefault(), true);
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
          window._editPageReplaceHandler = null;
          window._editPageReplaceImage = null;
          document.body.classList.remove('edit-page-replace-mode');
        }
      }
    });
  };

  try {
    const result = await chrome.storage.sync.get(['language', 'languageInitialized']);

    if (result.language) {
      currentLang = result.language;
    } else {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang.startsWith('zh')) {
        currentLang = 'zh';
      } else {
        currentLang = 'en';
      }
      await chrome.storage.sync.set({
        language: currentLang,
        languageInitialized: true
      });
    }
  } catch (e) {
    currentLang = 'zh';
  }

  let startupStatusTimer = setTimeout(() => {
    showStatus(t('connecting'), true);
  }, 350);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageEditable = isEditablePage(tab.url);

  if (!pageEditable) {
    unsupportedPage.classList.remove('hidden');
    paywall.classList.add('hidden');
    mainContent.classList.add('hidden');
    return;
  }

  await refreshLicenseStatus();

  const initialStoredState = await getStoredLicenseState();
  if (!initialStoredState.isUnlocked && initialStoredState.trialClicksUsed == null) {
    await restoreTrialExhaustedState();
  }

  trialInfo = await getTrialInfo();

  clearTimeout(startupStatusTimer);

  applyLanguage();
  updateTrialUI(trialInfo);
  statusDiv.classList.remove('visible');

  langToggleBtn.addEventListener('click', async () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    try {
      await chrome.storage.sync.set({ language: currentLang });
    } catch (e) {}
    applyLanguage();
    const isEditing = await getIsEditing();
    updateButton(isEditing);
  });

  payBtn.addEventListener('click', async () => {
    chrome.tabs.create({ url: APP_BASE_URL });
    showStatus(t('purchasePageHint'), true);
  });

  unlockBtn.addEventListener('click', async () => {
    console.log('[license] unlock button clicked');
    const licenseKey = licenseInput.value.trim();
    if (!licenseKey) {
      setLicenseInputError(true);
      setLicenseFeedback(t('enterLicenseKey'), 'error');
      showStatus(t('enterLicenseKey'), false);
      return;
    }

    const normalizedKey = normalizeLicenseKey(licenseKey);
    licenseInput.value = normalizedKey;
    setLicenseInputError(false);
    setLicenseFeedback(t('activatingHint'));
    unlockBtn.disabled = true;
    unlockBtn.textContent = t('activating');

    const result = await activateLicense(normalizedKey);
    console.log('[license] activation result', result);

    if (result && result.success) {
      setLicenseInputError(false);
      setLicenseFeedback(t('activationSuccess'), 'success');
      showStatus(t('activationSuccess'), true);
      trialInfo = await getTrialInfo();
      updateTrialUI(trialInfo);
    } else {
      const isFormatError = result?.error === 'local_format_invalid';
      const userMessage = isFormatError ? t('licenseFormatError') : normalizeError(result?.error);
      setLicenseInputError(true);
      setLicenseFeedback(userMessage, 'error');
      showStatus(t('activationFailed') + normalizeError(result?.error), false);
    }

    unlockBtn.disabled = false;
    unlockBtn.textContent = t('unlockLicense');
  });

  licenseInput.addEventListener('input', () => {
    setLicenseInputError(false);
    setLicenseFeedback(t('licenseFormatHint'));
  });

  licenseInput.addEventListener('blur', () => {
    const value = licenseInput.value.trim();
    if (!value) {
      return;
    }

    const normalizedKey = normalizeLicenseKey(value);
    licenseInput.value = normalizedKey;

    if (!verifyLicenseKey(normalizedKey)) {
      setLicenseInputError(true);
      setLicenseFeedback(t('licenseFormatError'), 'error');
    } else {
      setLicenseInputError(false);
      setLicenseFeedback(t('licenseFormatHint'));
    }
  });

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

    editBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      await toggleEdit();
      const newIsEditing = await getIsEditing();
      updateButton(newIsEditing);
      updateTrialUI(trialInfo);
    });

    screenshotBtn.addEventListener('click', async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        updateTrialUI(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      await takeScreenshot();
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
      updateReplaceButton();
      if (isReplaceMode) {
        await startReplaceMode();
      } else {
        await stopReplaceMode();
      }
      updateTrialUI(trialInfo);
    });
  }
});
