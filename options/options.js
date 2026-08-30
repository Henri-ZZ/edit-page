import {
  STORAGE_KEYS,
  getState,
  getLanguagePreference,
  getScreenshotDestination,
  isPremium,
  refreshPremiumState,
  resolveLanguage,
  setLanguagePreference,
  setScreenshotDestination,
} from '../shared.js';
import { activateLicense } from '../license.js';

const PREMIUM_URL = 'https://editpage.henri.ren/?utm_source=settings_page';

const messages = {
  en: {
    documentTitle: 'Settings · Edit Page',
    title: 'Edit Page Settings',
    subtitle: 'Customize how Edit Page works for you.',
    language: 'Language',
    languageHelp: 'Choose the interface language, or follow your browser.',
    followBrowser: 'Follow browser',
    screenshotDestination: 'Screenshot save method',
    screenshotDestinationHelp: 'Choose where screenshots are saved.',
    saveToClipboard: 'Clipboard',
    saveAsDownload: 'Download',
    premiumIntro: 'Premium unlocks every feature in this extension.',
    premiumLearn: 'Learn about Premium',
    premiumActivateLabel: 'Already have a License Key?',
    premiumCodePlaceholder: 'Enter License Key',
    premiumActivate: 'Activate',
    premiumActivateEmpty: 'Enter your License Key.',
    premiumActivating: 'Activating...',
    premiumActivateSuccess: 'Premium activated successfully.',
    premiumActivateInvalid: 'This License Key is invalid or expired.',
    premiumActivateRevoked: 'This License Key has been revoked.',
    premiumActivateRefunded: 'This License Key has been refunded.',
    premiumActivateError: 'Activation failed. Check your connection and try again.'
  },
  zh: {
    documentTitle: '设置 · Edit Page',
    title: 'Edit Page 设置',
    subtitle: '按你的习惯设置 Edit Page。',
    language: '语言',
    languageHelp: '选择界面语言，或者跟随浏览器。',
    followBrowser: '跟随浏览器',
    screenshotDestination: '截图保存方式',
    screenshotDestinationHelp: '选择截图保存到哪里。',
    saveToClipboard: '剪贴板',
    saveAsDownload: '下载',
    premiumIntro: 'Premium 可解锁此扩展的全部功能。',
    premiumLearn: '了解 Premium',
    premiumActivateLabel: '已经有许可证密钥？',
    premiumCodePlaceholder: '输入许可证密钥',
    premiumActivate: '激活',
    premiumActivateEmpty: '请输入许可证密钥。',
    premiumActivating: '正在激活…',
    premiumActivateSuccess: 'Premium 激活成功。',
    premiumActivateInvalid: '许可证密钥无效或已过期。',
    premiumActivateRevoked: '该许可证密钥已被吊销。',
    premiumActivateRefunded: '该许可证密钥已退款。',
    premiumActivateError: '激活失败，请检查网络后重试。'
  }
};

const languageSelect = document.getElementById('languageSelect');
let currentLanguage = 'en';

const applyLanguage = async () => {
  currentLanguage = await resolveLanguage();
  const t = (key) => messages[currentLanguage][key] || messages.en[key] || key;
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  document.title = t('documentTitle');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
};

const ensureLicenseState = async () => {
  try {
    return await chrome.runtime.sendMessage({ type: 'refresh-license-state' });
  } catch {
    return null;
  }
};

const deviceLabel = () => {
  const ua = navigator.userAgent || '';
  const os = /Macintosh|Mac OS X/.test(ua) ? 'macOS'
    : /Windows/.test(ua) ? 'Windows'
    : /Android/.test(ua) ? 'Android'
    : /Linux/.test(ua) ? 'Linux'
    : 'Unknown';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /Firefox/.test(ua) ? 'Firefox'
    : /Chrome|Chromium/.test(ua) ? 'Chrome'
    : 'Browser';
  return `${browser} on ${os}`;
};

const activationMessageKey = (reason) => {
  switch (reason) {
    case 'invalid_format':
    case 'license_not_found':
    case 'expired':
    case 'license_expired':
      return 'premiumActivateInvalid';
    case 'license_revoked':
      return 'premiumActivateRevoked';
    case 'license_refunded':
      return 'premiumActivateRefunded';
    default:
      return 'premiumActivateError';
  }
};

const applyPremiumState = () => {
  document.body.classList.toggle('is-premium', isPremium());
};

const showGraceExhaustedNotice = async () => {
  const license = await getState(STORAGE_KEYS.LICENSE);
  if (!license) return;
  const now = Date.now();
  const signatureFresh = typeof license.validUntil === 'number' && license.validUntil > now;
  const graceFresh = typeof license.graceUntil === 'number' && license.graceUntil > now;
  if (signatureFresh || graceFresh) return;

  const status = document.getElementById('premiumActivateStatus');
  const serverError = license.lastServerError;
  status.textContent = serverError?.status && serverError?.error
    ? `${serverError.status} ${serverError.error}`
    : messages[currentLanguage].premiumActivateError;
  status.className = 'premium-activate-status is-error';
  status.hidden = false;
};

const setupPremiumCard = () => {
  const learnButton = document.getElementById('premiumLearnBtn');
  const input = document.getElementById('premiumCodeInput');
  const activateButton = document.getElementById('premiumActivateBtn');
  const status = document.getElementById('premiumActivateStatus');

  learnButton.addEventListener('click', () => {
    chrome.tabs.create({ url: PREMIUM_URL });
  });

  const activate = async () => {
    const code = input.value.trim();
    if (!code) {
      status.textContent = messages[currentLanguage].premiumActivateEmpty;
      status.className = 'premium-activate-status is-error';
      status.hidden = false;
      return;
    }

    activateButton.disabled = true;
    status.textContent = messages[currentLanguage].premiumActivating;
    status.className = 'premium-activate-status';
    status.hidden = false;

    const result = await activateLicense(code, deviceLabel());
    if (result.ok) {
      input.value = '';
      status.textContent = messages[currentLanguage].premiumActivateSuccess;
      status.className = 'premium-activate-status is-success';
      await refreshPremiumState();
      setTimeout(applyPremiumState, 1000);
    } else {
      status.textContent = messages[currentLanguage][activationMessageKey(result.reason)];
      status.className = 'premium-activate-status is-error';
      activateButton.disabled = false;
    }
  };

  activateButton.addEventListener('click', activate);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') activateButton.click();
  });
  input.addEventListener('input', () => {
    status.hidden = true;
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  await applyLanguage();
  await ensureLicenseState();
  await refreshPremiumState();
  applyPremiumState();

  languageSelect.value = await getLanguagePreference();

  const screenshotDestination = await getScreenshotDestination();
  const destinationInputs = document.querySelectorAll('input[name="screenshotDestination"]');
  destinationInputs.forEach((input) => {
    input.checked = input.value === screenshotDestination;
    input.addEventListener('change', async () => {
      if (!input.checked) return;
      await setScreenshotDestination(input.value);
    });
  });

  languageSelect.addEventListener('change', async () => {
    await setLanguagePreference(languageSelect.value);
    await applyLanguage();
  });

  setupPremiumCard();
  await showGraceExhaustedNotice();
});
