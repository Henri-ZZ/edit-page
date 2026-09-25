import {
  FEATURE_USAGE_KEY,
  OPTIONAL_PERMISSIONS,
  STORAGE_KEYS,
  WEBSITE_BASE_URL,
  getQuotaState,
  getState,
  getHideRepeatedElements,
  getLanguagePreference,
  getScreenshotDestination,
  getSelectionToolbarEnabled,
  hasOptionalPermission,
  isPremium,
  refreshPremiumState,
  requestOptionalPermission,
  resolveLanguage,
  setLanguagePreference,
  setHideRepeatedElements,
  setScreenshotDestination,
  setSelectionToolbarEnabled,
} from "../shared.js";
import { activateLicense } from "../license.js";
import {
  ADDITIONAL_OPTIONS_MESSAGES,
  LANGUAGE_OPTIONS,
  getLanguageMetadata,
} from "../i18n/locales.js";
import { EDIT_TEXT_SETTINGS_MESSAGES } from "../i18n/edit-text-settings.js";

/** Official website, tagged with the source so analytics can attribute visits from the settings page. */
const CONTACT_URL = `${WEBSITE_BASE_URL}/contact?utm_source=dashboard`;
const STORE_REVIEW_URLS = {
  chrome:
    "https://chromewebstore.google.com/detail/edit-page/edjbgblhciojhakodeflnpampekciifl/reviews?utm_source=dashboard",
  edge: "https://microsoftedge.microsoft.com/addons/detail/edit-page/kgkkdobebceimgmhbiclahicofidniik?utm_source=dashboard",
};
const getBrowserPlatform = (userAgent = "") => {
  if (/Edg\//i.test(userAgent)) return "edge";
  return "chrome";
};
const getStoreReviewUrl = (userAgent = "") =>
  STORE_REVIEW_URLS[getBrowserPlatform(userAgent)];

const messages = {
  en: {
    documentTitle: "Dashboard · Edit Page",
    title: "Dashboard",
    subtitle: "Customize how Edit Page works for you.",
    language: "Language",
    languageHelp: "Choose the interface language, or follow your browser.",
    followBrowser: "Follow browser",
    screenshotSettings: "Screenshot",
    saveMethod: "Save method",
    screenshotDestinationHelp: "Choose where screenshots are saved.",
    saveToClipboard: "Clipboard",
    saveAsDownload: "Download",
    whenCapturingFullPage: "When capturing a full page",
    hideRepeatedElements: "Hide repeated elements",
    hideRepeatedElementsHelp:
      "Hide floating elements, scrollbars, and other content that may repeat in full-page screenshots.",
    premiumIntro:
      "Premium provides unlimited access to all features of this extension, and more enhancements to come.",
    premiumLearn: "Learn about Premium",
    premiumActivateLabel: "Already have a License Key?",
    premiumCodePlaceholder: "Enter License Key",
    premiumActivate: "Activate",
    premiumActivateEmpty: "Enter your License Key.",
    premiumActivating: "Activating...",
    premiumActivateSuccess: "Premium activated successfully.",
    premiumActivateInvalid: "This License Key is invalid or expired.",
    premiumActivateRevoked: "This License Key has been revoked.",
    premiumActivateRefunded: "This License Key has been refunded.",
    premiumActivateError:
      "Activation failed. Check your connection and try again.",
    quotaReplaceImage: "Image imports",
    quotaFullPage: "Full-page screenshot",
    quotaRemoveElement: "Remove element",
    quotaTextFormatting: "Text formatting",
    quotaOfLeft: "{remaining} of {limit} left",
    quotaLimitReached: "Limit reached",
    quotaWindow:
      "When any quota runs out, all advanced features pause for 12 hours. Upgrade to Premium for unlimited use.",
    quotaResumesIn: "Unlocks in {reset}",
    supportSection: "Support",
    supportReviewPrompt: "Enjoying Edit Page?",
    supportFeedbackPrompt: "Found a bug or have a suggestion?",
    leaveReview: "Leave Review",
    sendFeedback: "Send Feedback",
    editTextSettings: "Edit text",
    showSelectionToolbar: "Show toolbar when text is selected",
  },
  es: {
    documentTitle: "Panel · Edit Page",
    title: "Panel",
    subtitle: "Personaliza el funcionamiento de Edit Page.",
    language: "Idioma",
    languageHelp: "Elige el idioma de la interfaz o usa el del navegador.",
    followBrowser: "Usar el idioma del navegador",
    screenshotSettings: "Capturas de pantalla",
    saveMethod: "Método de guardado",
    screenshotDestinationHelp: "Elige dónde se guardan las capturas.",
    saveToClipboard: "Portapapeles",
    saveAsDownload: "Descarga",
    whenCapturingFullPage: "Al capturar la página completa",
    hideRepeatedElements: "Ocultar elementos repetidos",
    hideRepeatedElementsHelp:
      "Oculta elementos flotantes, barras de desplazamiento y otro contenido que podría repetirse en capturas de página completa.",
    premiumIntro:
      "Premium ofrece acceso ilimitado a todas las funciones de la extensión y a futuras mejoras.",
    premiumLearn: "Más información sobre Premium",
    premiumActivateLabel: "¿Ya tienes una clave de licencia?",
    premiumCodePlaceholder: "Introduce la clave de licencia",
    premiumActivate: "Activar",
    premiumActivateEmpty: "Introduce tu clave de licencia.",
    premiumActivating: "Activando...",
    premiumActivateSuccess: "Premium se ha activado correctamente.",
    premiumActivateInvalid: "La clave de licencia no es válida o ha caducado.",
    premiumActivateRevoked: "Esta clave de licencia ha sido revocada.",
    premiumActivateRefunded: "Esta clave de licencia ha sido reembolsada.",
    premiumActivateError: "No se pudo activar. Comprueba tu conexión e inténtalo de nuevo.",
    quotaReplaceImage: "Importaciones de imágenes",
    quotaFullPage: "Capturas de página completa",
    quotaRemoveElement: "Eliminar elementos",
    quotaOfLeft: "Quedan {remaining} de {limit}",
    quotaLimitReached: "Límite alcanzado",
    quotaWindow:
      "Cuando se agota cualquier cuota, todas las funciones avanzadas se pausan durante 12 horas. Actualiza a Premium para usarlas sin límites.",
    quotaResumesIn: "Se desbloquea en {reset}",
    supportSection: "Ayuda",
    supportReviewPrompt: "¿Te gusta Edit Page?",
    supportFeedbackPrompt: "¿Encontraste un error o tienes una sugerencia?",
    leaveReview: "Dejar una reseña",
    sendFeedback: "Enviar comentarios",
  },
  pt: {
    documentTitle: "Painel · Edit Page",
    title: "Painel",
    subtitle: "Personalize o funcionamento do Edit Page.",
    language: "Idioma",
    languageHelp: "Escolha o idioma da interface ou siga o navegador.",
    followBrowser: "Seguir o navegador",
    screenshotSettings: "Captura de tela",
    saveMethod: "Forma de salvar",
    screenshotDestinationHelp: "Escolha onde as capturas serão salvas.",
    saveToClipboard: "Área de transferência",
    saveAsDownload: "Download",
    whenCapturingFullPage: "Ao capturar a página inteira",
    hideRepeatedElements: "Ocultar elementos repetidos",
    hideRepeatedElementsHelp:
      "Oculta elementos flutuantes, barras de rolagem e outros conteúdos que podem se repetir em capturas de página inteira.",
    premiumIntro:
      "O Premium oferece acesso ilimitado a todos os recursos da extensão e a melhorias futuras.",
    premiumLearn: "Saiba mais sobre o Premium",
    premiumActivateLabel: "Já tem uma chave de licença?",
    premiumCodePlaceholder: "Insira a chave de licença",
    premiumActivate: "Ativar",
    premiumActivateEmpty: "Insira sua chave de licença.",
    premiumActivating: "Ativando...",
    premiumActivateSuccess: "Premium ativado com sucesso.",
    premiumActivateInvalid: "Esta chave de licença é inválida ou expirou.",
    premiumActivateRevoked: "Esta chave de licença foi revogada.",
    premiumActivateRefunded: "Esta chave de licença foi reembolsada.",
    premiumActivateError: "Não foi possível ativar. Verifique sua conexão e tente novamente.",
    quotaReplaceImage: "Importações de imagens",
    quotaFullPage: "Capturas de página inteira",
    quotaRemoveElement: "Remover elementos",
    quotaOfLeft: "Restam {remaining} de {limit}",
    quotaLimitReached: "Limite atingido",
    quotaWindow:
      "Quando qualquer cota acaba, todos os recursos avançados ficam pausados por 12 horas. Assine o Premium para uso ilimitado.",
    quotaResumesIn: "Desbloqueia em {reset}",
    supportSection: "Suporte",
    supportReviewPrompt: "Gostando do Edit Page?",
    supportFeedbackPrompt: "Encontrou um erro ou tem uma sugestão?",
    leaveReview: "Avaliar",
    sendFeedback: "Enviar feedback",
  },
  ja: {
    documentTitle: "ダッシュボード · Edit Page",
    title: "ダッシュボード",
    subtitle: "Edit Page の動作をカスタマイズします。",
    language: "言語",
    languageHelp: "表示言語を選択するか、ブラウザーの言語に合わせます。",
    followBrowser: "ブラウザーに合わせる",
    screenshotSettings: "スクリーンショット",
    saveMethod: "保存方法",
    screenshotDestinationHelp: "スクリーンショットの保存先を選択します。",
    saveToClipboard: "クリップボード",
    saveAsDownload: "ダウンロード",
    whenCapturingFullPage: "ページ全体を撮影するとき",
    hideRepeatedElements: "重複要素を非表示",
    hideRepeatedElementsHelp:
      "ページ全体の撮影で重複する可能性があるフローティング要素、スクロールバーなどを非表示にします。",
    premiumIntro: "Premium では、すべての機能と今後の拡張機能を無制限で利用できます。",
    premiumLearn: "Premium の詳細",
    premiumActivateLabel: "ライセンスキーをお持ちですか？",
    premiumCodePlaceholder: "ライセンスキーを入力",
    premiumActivate: "有効化",
    premiumActivateEmpty: "ライセンスキーを入力してください。",
    premiumActivating: "有効化中...",
    premiumActivateSuccess: "Premium を有効化しました。",
    premiumActivateInvalid: "ライセンスキーが無効か、有効期限が切れています。",
    premiumActivateRevoked: "このライセンスキーは取り消されています。",
    premiumActivateRefunded: "このライセンスキーは返金済みです。",
    premiumActivateError: "有効化できませんでした。接続を確認して再試行してください。",
    quotaReplaceImage: "画像のインポート",
    quotaFullPage: "ページ全体の撮影",
    quotaRemoveElement: "要素の削除",
    quotaOfLeft: "{limit} 回中残り {remaining} 回",
    quotaLimitReached: "上限に達しました",
    quotaWindow: "いずれかの上限に達すると、すべての高度な機能が 12 時間停止します。Premium では無制限に利用できます。",
    quotaResumesIn: "{reset}後に解除",
    supportSection: "サポート",
    supportReviewPrompt: "Edit Page を気に入っていただけましたか？",
    supportFeedbackPrompt: "不具合やご意見がありますか？",
    leaveReview: "レビューを書く",
    sendFeedback: "フィードバックを送る",
  },
  zh: {
    documentTitle: "控制面板 · Edit Page",
    title: "控制面板",
    subtitle: "按你的习惯设置 Edit Page。",
    language: "语言",
    languageHelp: "选择界面语言，或者跟随浏览器。",
    followBrowser: "跟随浏览器",
    screenshotSettings: "截图",
    saveMethod: "保存方式",
    screenshotDestinationHelp: "选择截图保存到哪里。",
    saveToClipboard: "剪贴板",
    saveAsDownload: "下载",
    whenCapturingFullPage: "整页截图时",
    hideRepeatedElements: "隐藏重复元素",
    hideRepeatedElementsHelp:
      "隐藏悬浮元素、滚动条等可能在整页截图中重复出现的内容。",
    premiumIntro: "Premium 可无限使用本插件全部功能，以及后续更多增强功能。",
    premiumLearn: "了解 Premium",
    premiumActivateLabel: "已经有激活码？",
    premiumCodePlaceholder: "输入激活码",
    premiumActivate: "激活",
    premiumActivateEmpty: "请输入激活码。",
    premiumActivating: "正在激活…",
    premiumActivateSuccess: "Premium 激活成功。",
    premiumActivateInvalid: "激活码无效或已过期。",
    premiumActivateRevoked: "该激活码已被吊销。",
    premiumActivateRefunded: "该激活码已退款。",
    premiumActivateError: "激活失败，请检查网络后重试。",
    quotaReplaceImage: "图片导入",
    quotaFullPage: "整页截图",
    quotaRemoveElement: "移除元素",
    quotaOfLeft: "剩 {remaining} / {limit} 次",
    quotaLimitReached: "已达上限",
    quotaWindow:
      "任一额度用尽后，全部高级功能暂停 12 小时；升级 Premium 可无限使用。",
    quotaResumesIn: "{reset}后恢复",
    supportSection: "支持",
    supportReviewPrompt: "用得感觉还不错？",
    supportFeedbackPrompt: "遇到 Bug 或有建议？",
    leaveReview: "去评价",
    sendFeedback: "提交反馈",
  },
};

messages["zh-CN"] = messages.zh;
messages["pt-BR"] = messages.pt;
Object.assign(messages, ADDITIONAL_OPTIONS_MESSAGES);
for (const [locale, localizedMessages] of Object.entries(EDIT_TEXT_SETTINGS_MESSAGES)) {
  messages[locale] = { ...(messages[locale] || {}), ...localizedMessages };
}
for (const locale of Object.keys(messages)) {
  if (locale !== "en") messages[locale] = { ...messages.en, ...messages[locale] };
}

const languageSelect = document.getElementById("languageSelect");
let currentLanguage = "en";

const applyLanguage = async () => {
  currentLanguage = await resolveLanguage();
  const t = (key) => messages[currentLanguage][key] || messages.en[key] || key;
  const metadata = getLanguageMetadata(currentLanguage);
  document.documentElement.lang = metadata.lang;
  document.documentElement.dir = metadata.dir;
  document.title = t("documentTitle");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
};

const ensureLicenseState = async () => {
  try {
    return await chrome.runtime.sendMessage({ type: "refresh-license-state" });
  } catch {
    return null;
  }
};

const deviceLabel = () => {
  const ua = navigator.userAgent || "";
  const os = /Macintosh|Mac OS X/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
      ? "Windows"
      : /Android/.test(ua)
        ? "Android"
        : /Linux/.test(ua)
          ? "Linux"
          : "Unknown";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox/.test(ua)
      ? "Firefox"
      : /Chrome|Chromium/.test(ua)
        ? "Chrome"
        : "Browser";
  return `${browser} on ${os}`;
};

const activationMessageKey = (reason) => {
  switch (reason) {
    case "invalid_format":
    case "license_not_found":
    case "expired":
    case "license_expired":
      return "premiumActivateInvalid";
    case "license_revoked":
      return "premiumActivateRevoked";
    case "license_refunded":
      return "premiumActivateRefunded";
    default:
      return "premiumActivateError";
  }
};

const applyPremiumState = () => {
  document.body.classList.toggle("is-premium", isPremium());
};

// Free-tier quota: show per-feature remaining uses in the Premium card.
// OR logic: when any limit is hit, ALL advanced features pause for 12h.
const formatResetIn = (resetsAt) => {
  const totalMinutes = Math.max(0, Math.ceil((resetsAt - Date.now()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (currentLanguage === "zh-CN") return `${hours} 小时 ${minutes} 分钟`;
  if (currentLanguage === "zh-TW") return `${hours} 小時 ${minutes} 分鐘`;
  if (currentLanguage === "ja") return `${hours} 時間 ${minutes} 分`;
  return `${hours} h ${minutes} min`;
};

const renderQuota = async () => {
  const container = document.getElementById("premiumQuota");
  if (!container || isPremium()) return;

  const t = (key) => messages[currentLanguage][key] || messages.en[key] || key;
  const state = await getQuotaState();

  const cell = (feature) => {
    // OR logic: once any feature is locked, every row reads as exhausted even
    // if its own count is still below the cap (the feature is blocked).
    if (state.limited || state[feature].remaining <= 0) {
      return { text: t("quotaLimitReached"), exhausted: true };
    }
    return {
      text: t("quotaOfLeft")
        .replace("{remaining}", String(state[feature].remaining))
        .replace("{limit}", String(state[feature].limit)),
      exhausted: false,
    };
  };

  const replaceCell = cell("replaceImage");
  const fullPageCell = cell("fullPageScreenshot");
  const removeCell = cell("removeElement");
  const formattingCell = cell("textFormatting");

  container.innerHTML = `
    <div class="premium-quota-row">
      <span>${t("quotaTextFormatting")}</span>
      <small${formattingCell.exhausted ? ' class="is-exhausted"' : ""}>${formattingCell.text}</small>
    </div>
    <div class="premium-quota-row">
      <span>${t("quotaReplaceImage")}</span>
      <small${replaceCell.exhausted ? ' class="is-exhausted"' : ""}>${replaceCell.text}</small>
    </div>
    <div class="premium-quota-row">
      <span>${t("quotaRemoveElement")}</span>
      <small${removeCell.exhausted ? ' class="is-exhausted"' : ""}>${removeCell.text}</small>
    </div>
    <div class="premium-quota-row">
      <span>${t("quotaFullPage")}</span>
      <small${fullPageCell.exhausted ? ' class="is-exhausted"' : ""}>${fullPageCell.text}</small>
    </div>
    ${state.limited ? `<p class="premium-quota-resume">${t("quotaResumesIn").replace("{reset}", formatResetIn(state.lockedUntil))}</p>` : ""}
    <p class="premium-quota-reset">${t("quotaWindow")}</p>
  `;
  container.hidden = false;
};

const showGraceExhaustedNotice = async () => {
  const license = await getState(STORAGE_KEYS.LICENSE);
  if (!license) return;
  const now = Date.now();
  const signatureFresh =
    typeof license.validUntil === "number" && license.validUntil > now;
  const graceFresh =
    typeof license.graceUntil === "number" && license.graceUntil > now;
  if (signatureFresh || graceFresh) return;

  const status = document.getElementById("premiumActivateStatus");
  const serverError = license.lastServerError;
  status.textContent =
    serverError?.status && serverError?.error
      ? `${serverError.status} ${serverError.error}`
      : messages[currentLanguage].premiumActivateError;
  status.className = "premium-activate-status is-error";
  status.hidden = false;
};

const setupPremiumCard = () => {
  const learnButton = document.getElementById("premiumLearnBtn");
  const input = document.getElementById("premiumCodeInput");
  const activateButton = document.getElementById("premiumActivateBtn");
  const status = document.getElementById("premiumActivateStatus");

  learnButton.addEventListener("click", () => {
    chrome.tabs.create({ url: `${WEBSITE_BASE_URL}?utm_source=dashboard` });
  });

  const activate = async () => {
    const code = input.value.trim();
    if (!code) {
      status.textContent = messages[currentLanguage].premiumActivateEmpty;
      status.className = "premium-activate-status is-error";
      status.hidden = false;
      return;
    }

    activateButton.disabled = true;
    status.textContent = messages[currentLanguage].premiumActivating;
    status.className = "premium-activate-status";
    status.hidden = false;

    const result = await activateLicense(code, deviceLabel());
    if (result.ok) {
      input.value = "";
      status.textContent = messages[currentLanguage].premiumActivateSuccess;
      status.className = "premium-activate-status is-success";
      await refreshPremiumState();
      setTimeout(applyPremiumState, 1000);
    } else {
      status.textContent =
        messages[currentLanguage][activationMessageKey(result.reason)];
      status.className = "premium-activate-status is-error";
      activateButton.disabled = false;
    }
  };

  activateButton.addEventListener("click", activate);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") activateButton.click();
  });
  input.addEventListener("input", () => {
    status.hidden = true;
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  for (const { code, name } of LANGUAGE_OPTIONS) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    languageSelect.append(option);
  }
  await applyLanguage();
  await ensureLicenseState();
  await refreshPremiumState();
  applyPremiumState();

  languageSelect.value = await getLanguagePreference();

  const screenshotDestination = await getScreenshotDestination();

  // Ask for the optional permission as soon as the matching save method is
  // picked. This page is a regular tab, so the permission dialog does not close
  // anything and the user sees both the prompt and the outcome. A refusal is
  // deliberately silent: the setting is kept, and the popup asks again — with
  // a clear message — the next time a screenshot is actually taken.
  const requestDestinationPermission = async (destination) => {
    const permission =
      destination === "download"
        ? OPTIONAL_PERMISSIONS.DOWNLOADS
        : OPTIONAL_PERMISSIONS.CLIPBOARD_WRITE;
    if (await hasOptionalPermission(permission)) return;
    await requestOptionalPermission(permission);
  };

  const destinationInputs = document.querySelectorAll(
    'input[name="screenshotDestination"]',
  );
  destinationInputs.forEach((input) => {
    input.checked = input.value === screenshotDestination;
    input.addEventListener("change", async () => {
      if (!input.checked) return;
      await setScreenshotDestination(input.value);
      await requestDestinationPermission(input.value);
    });
  });

  const hideRepeatedElements = document.getElementById("hideRepeatedElements");
  hideRepeatedElements.checked = await getHideRepeatedElements();
  hideRepeatedElements.addEventListener("change", async () => {
    await setHideRepeatedElements(hideRepeatedElements.checked);
  });

  const selectionToolbarEnabled = document.getElementById("selectionToolbarEnabled");
  selectionToolbarEnabled.checked = await getSelectionToolbarEnabled();
  selectionToolbarEnabled.addEventListener("change", async () => {
    await setSelectionToolbarEnabled(selectionToolbarEnabled.checked);
  });

  languageSelect.addEventListener("change", async () => {
    await setLanguagePreference(languageSelect.value);
    await applyLanguage();
    await renderQuota();
  });

  setupPremiumCard();
  await showGraceExhaustedNotice();

  // Support: Leave Review goes to the current browser's store; Send Feedback
  // opens the website Contact page (both tagged with utm_source=dashboard).
  const leaveReviewBtn = document.getElementById("leaveReviewBtn");
  if (leaveReviewBtn) {
    leaveReviewBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: getStoreReviewUrl(navigator.userAgent || "") });
    });
  }
  const sendFeedbackBtn = document.getElementById("sendFeedbackBtn");
  if (sendFeedbackBtn) {
    sendFeedbackBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: CONTACT_URL });
    });
  }
  await renderQuota();

  // Keep the countdown fresh; re-render whenever usage changes.
  setInterval(renderQuota, 60 * 1000);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[FEATURE_USAGE_KEY]) renderQuota();
  });
});
