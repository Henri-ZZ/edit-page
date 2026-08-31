// Premium state uses the shared Licentra client. Activation lives on the
// settings page; the popup only refreshes license state for feature gating.
import { maybeCheckIn } from "../license.js";
import {
  WEBSITE_BASE_URL,
  getScreenshotDestination,
  isPremium,
  refreshPremiumState,
  resolveLanguage,
} from "../shared.js";

const TRIAL_CLICKS = 300000000;
const TRIAL_API_BASES = [`${WEBSITE_BASE_URL}/api/trial`];

const i18n = {
  en: {
    title: "Edit Page",
    settings: "Settings",
    subtitle: "Make this page editable",
    chooseTool: "Choose a tool",
    editText: "Edit text",
    editTextDesc: "Change any text on this page",
    editMode: "Edit Mode",
    exitEdit: "Exit Edit",
    screenshot: "Screenshot",
    screenshotDesc: "Capture the viewport or full page",
    visibleScreenshot: "Current viewport",
    fullPageScreenshot: "Full page",
    preparingFullPage: "Preparing full-page capture...",
    capturingFullPage: "Capturing {current} of {total}...",
    stitchingFullPage: "Stitching the final image...",
    screenshotting: "Screenshotting...",
    statusScreenshotting: "Taking screenshot...",
    statusScreenshotSuccess: "Screenshot copied to clipboard!",
    statusScreenshotDownloaded: "Screenshot downloaded!",
    savingScreenshot: "Saving screenshot...",
    statusScreenshotFailed: "Screenshot failed: ",
    selectImage: "Select Image",
    changeImage: "Change image",
    changeImageDesc: "Upload or paste an Image URL",
    uploadLocalImage: "Upload from device",
    imageUrlPlaceholder: "Paste Image URL",
    useImageUrl: "Use URL",
    invalidImageUrl: "Enter a valid http or https Image URL.",
    checkingImageUrl: "Checking...",
    imageUrlNotImage: "This URL does not point to a readable image.",
    imageUrlDenied:
      "The source website denied access to this image. It may require sign-in or block external use.",
    imageUrlNotFound: "The image was not found. The URL may have expired or changed.",
    imageUrlHttpError: "The source website returned HTTP {status}, so the image could not be read.",
    imageUrlAccessRestricted:
      "The browser could not access this image. The source website may restrict cross-origin or external image access.",
    imageLoadTimeout: "The image took too long to respond. Check the URL or your network and try again.",
    imageReadFailed:
      "Image could not be read. The file may be damaged, the URL may be invalid, or the source website may block access.",
    trialActionUnavailable: "Your trial has ended. Activate Premium to continue.",
    editModeFailed: "Text editing could not start on this page.",
    replaceModeFailed: "Replacement mode could not start on this page.",
    removeModeFailed: "Remove mode could not start on this page.",
    clearImage: "Clear selected image",
    replaceMode: "Replace Image Mode",
    exitReplaceMode: "Exit Replace Mode",
    clickImageToReplace: "Click an image on the page to replace",
    imageSelected: 'Image selected, click "Replace Image Mode"',
    statusImageReplaced: "Image replaced!",
    pleaseSelectImageFirst: "Please select an image first",
    removeElement: "Remove element",
    removeElementDesc: "Click anything to remove it",
    exitRemoveMode: "Exit remove mode",
    clickElementToRemove: "Click an element on the page to remove it",
    undo: "↶ Undo",
    redo: "↷ Redo",
    done: "Done",
    changeCount: "{count} changes",
    editWarning: "Editing may affect page behavior. Refresh to fully restore.",
    trialExpired: "Trial Expired",
    trialExpiredDesc: "Your free trial has ended.",
    unlockNow: "Unlock Now",
    unlockLicense: "Unlock with License",
    licensePlaceholder: "Enter License Key",
    licenseFormatHint: "Format: ABCD-2345-EFGH-6789",
    licenseFormatError:
      "License Key format should look like ABCD-2345-EFGH-6789.",
    inTrial: "In trial",
    activating: "Activating...",
    activatingHint: "Contacting activation server...",
    activationSuccess: "Activated successfully!",
    activationFailed: "Activation failed: ",
    enterLicenseKey: "Please enter a License Key",
    invalidLicenseKey: "Invalid License Key",
    licenseRevoked: "This License Key has been revoked.",
    licenseRefunded: "This license was refunded.",
    licenseKeyMoved: "This License Key is now active on another device.",
    networkError: "Network error",
    offlineMode: "Offline Mode",
    connecting: "Connecting to server...",
    cannotEditThisPage: "Cannot edit this page",
    pageNotSupported: "This page type is not supported",
    haveLicense: "Have a License Key?",
    cancel: "Cancel",
    purchasePageHint:
      "Complete your purchase on the opened page, then enter your License Key here.",
  },
  zh: {
    title: "Edit Page",
    settings: "设置",
    subtitle: "编辑当前页面",
    chooseTool: "选择工具",
    editText: "编辑文字",
    editTextDesc: "直接修改当前页面的文字",
    editMode: "编辑模式",
    exitEdit: "退出编辑",
    screenshot: "截图",
    screenshotDesc: "截取当前视窗或完整网页",
    visibleScreenshot: "当前视窗",
    fullPageScreenshot: "整张网页",
    preparingFullPage: "正在准备整页截图...",
    capturingFullPage: "正在截取第 {current}/{total} 段...",
    stitchingFullPage: "正在拼接完整图片...",
    screenshotting: "截图中...",
    statusScreenshotting: "正在截图...",
    statusScreenshotSuccess: "截图已保存到剪贴板！",
    statusScreenshotDownloaded: "截图已下载！",
    savingScreenshot: "正在保存截图…",
    statusScreenshotFailed: "截图失败: ",
    selectImage: "选择图片",
    changeImage: "更改图片",
    changeImageDesc: "本地上传或粘贴图片 URL",
    uploadLocalImage: "本地上传",
    imageUrlPlaceholder: "粘贴图片 URL",
    useImageUrl: "使用 URL",
    invalidImageUrl: "请输入有效的 http 或 https 图片 URL。",
    checkingImageUrl: "正在检查…",
    imageUrlNotImage: "该 URL 指向的内容不是可读取的图片。",
    imageUrlDenied: "来源网站拒绝访问该图片，可能需要登录或禁止图片外链。",
    imageUrlNotFound: "未找到该图片，URL 可能已失效或发生变化。",
    imageUrlHttpError: "来源网站返回 HTTP {status}，因此无法读取图片。",
    imageUrlAccessRestricted: "浏览器无法访问该图片，来源网站可能限制跨域或图片外链访问。",
    imageLoadTimeout: "图片响应时间过长，请检查 URL 或网络后重试。",
    imageReadFailed: "图片读取失败。文件可能已损坏、URL 无效，或来源网站限制了访问。",
    trialActionUnavailable: "试用已结束，激活 Premium 后可继续使用。",
    editModeFailed: "无法在当前页面启动编辑文字模式。",
    replaceModeFailed: "无法在当前页面启动替换图片模式。",
    removeModeFailed: "无法在当前页面启动移除元素模式。",
    clearImage: "清除已选图片",
    replaceMode: "替换图片模式",
    exitReplaceMode: "退出替换模式",
    clickImageToReplace: "点击页面上的图片进行替换",
    imageSelected: '已选择图片，点击"替换图片模式"',
    statusImageReplaced: "图片已替换！",
    pleaseSelectImageFirst: "请先选择图片",
    removeElement: "移除元素",
    removeElementDesc: "点击页面上的任意元素进行移除",
    exitRemoveMode: "退出移除模式",
    clickElementToRemove: "点击页面上的元素即可移除",
    undo: "↶ 撤回",
    redo: "↷ 重做",
    done: "完成",
    changeCount: "已修改 {count} 项",
    editWarning: "编辑可能影响页面功能，刷新网页可完全恢复。",
    trialExpired: "试用已结束",
    trialExpiredDesc: "您的免费试用已结束。",
    unlockNow: "立即解锁",
    unlockLicense: "使用激活码解锁",
    licensePlaceholder: "请输入激活码",
    licenseFormatHint: "格式：ABCD-2345-EFGH-6789",
    licenseFormatError: "激活码格式不正确，应类似 ABCD-2345-EFGH-6789。",
    inTrial: "试用中",
    activating: "激活中...",
    activatingHint: "正在连接激活服务器...",
    activationSuccess: "激活成功！",
    activationFailed: "激活失败: ",
    enterLicenseKey: "请输入激活码",
    invalidLicenseKey: "激活码无效",
    licenseRevoked: "该激活码已被吊销。",
    licenseRefunded: "该激活码对应的订单已退款。",
    licenseKeyMoved: "该激活码当前已在其他设备上生效。",
    networkError: "网络错误",
    offlineMode: "离线模式",
    connecting: "正在连接服务器...",
    cannotEditThisPage: "无法编辑此页面",
    pageNotSupported: "此类页面不支持编辑",
    haveLicense: "已有激活码？",
    cancel: "取消",
    purchasePageHint: "请在打开的页面完成购买，然后回到这里输入激活码。",
    cannotEditThisPage: "无法编辑此页面",
    pageNotSupported: "此类页面不支持编辑",
  },
};

let currentLang = "en";
let trialInfo = {
  isUnlocked: false,
  clicksLeft: TRIAL_CLICKS,
  clicksUsed: 0,
  isExpired: false,
  isOffline: true,
};

const t = (key) => i18n[currentLang][key] || key;

document.addEventListener("DOMContentLoaded", async () => {
  const editBtn = document.getElementById("editBtn");
  const editBtnLabel = document.getElementById("editBtnLabel");
  const screenshotBtn = document.getElementById("screenshotBtn");
  const screenshotBtnLabel = document.getElementById("screenshotBtnLabel");
  const screenshotOptions = document.getElementById("screenshotOptions");
  const visibleScreenshotBtn = document.getElementById("visibleScreenshotBtn");
  const visibleScreenshotLabel = document.getElementById(
    "visibleScreenshotLabel",
  );
  const fullPageScreenshotBtn = document.getElementById(
    "fullPageScreenshotBtn",
  );
  const fullPageScreenshotLabel = document.getElementById(
    "fullPageScreenshotLabel",
  );
  const captureProgress = document.getElementById("captureProgress");
  const captureProgressBar = document.getElementById("captureProgressBar");
  const captureProgressText = document.getElementById("captureProgressText");
  const removeBtn = document.getElementById("removeBtn");
  const removeBtnLabel = document.getElementById("removeBtnLabel");
  const statusDiv = document.getElementById("status");
  const settingsBtn = document.getElementById("settingsBtn");
  const unsupportedPage = document.getElementById("unsupportedPage");
  const mainContent = document.getElementById("mainContent");
  const trialBadge = document.getElementById("trialBadge");
  const imageInput = document.getElementById("imageInput");
  const selectImageBtn = document.getElementById("selectImageBtn");
  const imageSourceOptions = document.getElementById("imageSourceOptions");
  const uploadImageBtn = document.getElementById("uploadImageBtn");
  const imageUrlInput = document.getElementById("imageUrlInput");
  const useImageUrlBtn = document.getElementById("useImageUrlBtn");
  const imagePreview = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");
  const clearImageBtn = document.getElementById("clearImageBtn");
  const replaceImageBtn = document.getElementById("replaceImageBtn");
  const replaceImageBtnLabel = document.getElementById("replaceImageBtnLabel");

  let selectedImageData = null;
  let isEditModeTransitioning = false;
  let isReplaceMode = false;
  let isReplaceModeTransitioning = false;
  let isRemoveMode = false;
  let isRemoveModeTransitioning = false;
  const screenshotDestination = await getScreenshotDestination().catch(
    () => "clipboard",
  );

  const getStoredTrialState = async () => {
    const syncResult = await chrome.storage.sync.get(["trialClicksUsed"]);
    return {
      trialClicksUsed:
        typeof syncResult.trialClicksUsed === "number"
          ? syncResult.trialClicksUsed
          : null,
    };
  };

  const postTrialApi = async (path, payload) => {
    let lastError = null;

    for (const baseUrl of TRIAL_API_BASES) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          return { ok: true, data };
        }

        const looksLikeTrialApiResponse =
          typeof data === "object" &&
          data !== null &&
          ("exhausted" in data ||
            "found" in data ||
            "error" in data ||
            "ok" in data);

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

    throw lastError || new Error("Network error");
  };

  const sha256Hex = async (value) => {
    const input = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", input);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const getTrialFingerprintPayload = async () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const screenInfo = `${screen.width || 0}x${screen.height || 0}x${screen.colorDepth || 0}`;
    const platform = [
      navigator.platform || "",
      navigator.vendor || "",
      String(navigator.hardwareConcurrency || 0),
      String(navigator.deviceMemory || 0),
      navigator.userAgentData?.platform || "",
    ].join("|");
    const rawFingerprint = [
      navigator.userAgent || "",
      navigator.language || "",
      timeZone,
      screenInfo,
      platform,
    ].join("||");

    return {
      fingerprintHash: await sha256Hex(rawFingerprint),
      language: navigator.language || null,
      platform,
      screen: screenInfo,
      timeZone: timeZone || null,
      userAgent: navigator.userAgent || null,
    };
  };

  const markTrialExhaustedOnBackend = async () => {
    try {
      const payload = await getTrialFingerprintPayload();
      await postTrialApi("/exhaust", payload);
    } catch (error) {}
  };

  const restoreTrialExhaustedState = async () => {
    try {
      const payload = await getTrialFingerprintPayload();
      const response = await postTrialApi("/status", payload);

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

      return {
        isUnlocked: false,
        clicksLeft,
        clicksUsed,
        isExpired: clicksLeft <= 0,
        isOffline: false,
      };
    } catch (e) {
      return {
        isUnlocked: false,
        clicksLeft: TRIAL_CLICKS,
        clicksUsed: 0,
        isExpired: false,
        isOffline: false,
      };
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
      mainContent.classList.remove("hidden");
      trialBadge.style.display = "none";
      return;
    }

    if (info.isExpired) {
      mainContent.classList.remove("hidden");
      trialBadge.textContent = t("trialExpired");
      trialBadge.style.display = "inline-block";
      return;
    }

    mainContent.classList.remove("hidden");

    trialBadge.textContent = t("inTrial");
    trialBadge.style.display = "inline-block";
  };

  const applyLanguage = () => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (i18n[currentLang][key]) {
        el.textContent = i18n[currentLang][key];
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (i18n[currentLang][key]) {
        el.setAttribute("placeholder", i18n[currentLang][key]);
      }
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (i18n[currentLang][key]) {
        el.setAttribute("aria-label", i18n[currentLang][key]);
      }
    });
  };

  let statusTimer = null;
  const showStatus = (message, isSuccess) => {
    if (statusTimer) clearTimeout(statusTimer);
    statusDiv.textContent = message;
    statusDiv.className = "status " + (isSuccess ? "success" : "error");
    statusDiv.classList.add("visible");

    statusTimer = setTimeout(() => {
      statusDiv.classList.remove("visible");
      statusDiv.textContent = "";
      statusDiv.className = "status";
      statusTimer = null;
    }, 4000);
  };

  const showTrialExpiredToast = (info) => {
    updateTrialUI(info);
    showStatus(t("trialActionUnavailable"), false);
  };

  const updateButton = (isEditing) => {
    editBtnLabel.textContent = isEditing ? t("exitEdit") : t("editText");
    editBtn.classList.toggle("active", isEditing);
    editBtn.setAttribute("aria-pressed", String(isEditing));
  };

  const isEditablePage = (url) => {
    if (!url) return false;
    const blockedProtocols = [
      "chrome:",
      "about:",
      "edge:",
      "firefox:",
      "opera:",
      "brave:",
    ];
    return !blockedProtocols.some((protocol) => url.startsWith(protocol));
  };

  const getIsEditing = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!document.body.isContentEditable,
      });
      return results[0].result;
    } catch (e) {
      return false;
    }
  };

  const toggleEdit = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const isEditing = !document.body.isContentEditable;
        document.body.contentEditable = isEditing;

        if (isEditing) {
          document.body.classList.add("edit-page-editing");
        } else {
          document.body.classList.remove("edit-page-editing");
        }
        return isEditing;
      },
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
        .edit-page-editing #edit-page-history-toolbar:hover,
        .edit-page-editing #edit-page-history-toolbar *:hover {
          outline: none !important;
        }
      `,
    });
  };

  const ensureHistoryManager = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (labels) => {
        const toolbarId = "edit-page-history-toolbar";
        const styleId = "edit-page-history-styles";

        let style = document.getElementById(styleId);
        if (!style) {
          style = document.createElement("style");
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
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
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
            #${toolbarId} .edit-page-history-shortcut {
              display: inline-block !important;
              min-width: 0 !important;
              padding: 2px 4px !important;
              color: inherit !important;
              font: 500 10px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
              white-space: nowrap !important;
              background: rgba(255, 255, 255, 0.62) !important;
              border: 1px solid rgba(55, 48, 163, 0.12) !important;
              border-radius: 4px !important;
              opacity: 0.7 !important;
            }
            #${toolbarId} button:hover { background: #e0e7ff !important; }
            #${toolbarId} button:disabled { opacity: 0.35 !important; cursor: pointer !important; }
            #${toolbarId} .edit-page-history-done { color: #fff !important; background: #4f46e5 !important; }
            #${toolbarId} .edit-page-history-done:hover { color: #fff !important; background: #4338ca !important; }
            #${toolbarId} .edit-page-history-done:active { color: #fff !important; background: #3730a3 !important; }
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
          toolbar = document.createElement("div");
          toolbar.id = toolbarId;
          toolbar.contentEditable = "false";
          toolbar.innerHTML = `
            <button type="button" data-action="undo"><span class="edit-page-history-label"></span><kbd class="edit-page-history-shortcut" aria-hidden="true"></kbd></button>
            <button type="button" data-action="redo"><span class="edit-page-history-label"></span><kbd class="edit-page-history-shortcut" aria-hidden="true"></kbd></button>
            <span class="edit-page-history-info"></span>
            <span class="edit-page-history-warning"></span>
            <button type="button" class="edit-page-history-done" data-action="done"></button>
          `;
          for (const eventName of [
            "mousedown",
            "mouseup",
            "click",
            "touchstart",
            "touchend",
          ]) {
            // Let the target button run first, then stop the event before it
            // bubbles into the host page. Capture-phase blocking here would
            // prevent the toolbar's own buttons from receiving the event.
            toolbar.addEventListener(eventName, (event) =>
              event.stopPropagation(),
            );
          }
          toolbar
            .querySelector('[data-action="undo"]')
            .addEventListener("click", () => window._editPageHistory?.undo());
          toolbar
            .querySelector('[data-action="redo"]')
            .addEventListener("click", () => window._editPageHistory?.redo());
          toolbar
            .querySelector('[data-action="done"]')
            .addEventListener("click", () =>
              window._editPageFinishEditingSession?.(),
            );
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
              const platform =
                navigator.userAgentData?.platform || navigator.platform || "";
              const isApplePlatform = /mac|iphone|ipad|ipod/i.test(platform);
              const undoShortcut = isApplePlatform ? "⌘Z" : "Ctrl Z";
              const redoShortcut = isApplePlatform ? "⇧⌘Z" : "Ctrl Shift Z";
              undoButton.querySelector(".edit-page-history-label").textContent =
                this.labels.undo;
              redoButton.querySelector(".edit-page-history-label").textContent =
                this.labels.redo;
              undoButton.querySelector(".edit-page-history-shortcut").textContent =
                undoShortcut;
              redoButton.querySelector(".edit-page-history-shortcut").textContent =
                redoShortcut;
              undoButton.title = `${this.labels.undo} (${undoShortcut})`;
              redoButton.title = `${this.labels.redo} (${redoShortcut})`;
              undoButton.setAttribute(
                "aria-keyshortcuts",
                isApplePlatform ? "Meta+Z" : "Control+Z",
              );
              redoButton.setAttribute(
                "aria-keyshortcuts",
                isApplePlatform ? "Meta+Shift+Z" : "Control+Shift+Z",
              );
              toolbar.querySelector('[data-action="done"]').textContent =
                this.labels.done;
              toolbar.querySelector(".edit-page-history-info").textContent =
                this.labels.count.replace(
                  "{count}",
                  String(this.undoStack.length),
                );
              toolbar.querySelector(".edit-page-history-warning").textContent =
                this.labels.warning;
              undoButton.disabled = this.undoStack.length === 0;
              redoButton.disabled = this.redoStack.length === 0;
            },
            push(operation) {
              const previous = this.undoStack[this.undoStack.length - 1];
              if (
                operation.type === "text" &&
                previous?.type === "text" &&
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
              const value =
                direction === "undo" ? operation.before : operation.after;
              if (operation.type === "text") {
                if (operation.element?.isConnected)
                  operation.element.innerHTML = value;
              } else if (operation.type === "image") {
                if (!operation.element?.isConnected) return;
                if (operation.imageKind === "img") {
                  const setAttribute = (name, attributeValue) => {
                    if (attributeValue == null)
                      operation.element.removeAttribute(name);
                    else operation.element.setAttribute(name, attributeValue);
                  };
                  setAttribute("src", value.src);
                  setAttribute("srcset", value.srcset);
                  operation.sources.forEach((source, index) => {
                    const sourceValue = value.sources[index];
                    if (!sourceValue) return;
                    for (const name of ["srcset", "media", "type"]) {
                      if (sourceValue[name] == null)
                        source.removeAttribute(name);
                      else source.setAttribute(name, sourceValue[name]);
                    }
                  });
                } else {
                  operation.element.style.backgroundImage =
                    value.backgroundImage;
                }
              } else if (operation.type === "remove") {
                if (direction === "undo") {
                  if (!operation.parent?.isConnected) return;
                  if (operation.nextSibling?.parentNode === operation.parent) {
                    operation.parent.insertBefore(
                      operation.element,
                      operation.nextSibling,
                    );
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
              this.apply(operation, "undo");
              this.redoStack.push(operation);
              this.update();
            },
            redo() {
              const operation = this.redoStack.pop();
              if (!operation) return;
              this.apply(operation, "redo");
              this.undoStack.push(operation);
              this.update();
            },
          };
          window._editPageHistory = history;

          window._editPageTextBeforeInput = () => {
            if (!document.body.isContentEditable) return;
            const selection = window.getSelection();
            let element = selection?.anchorNode;
            if (element?.nodeType === Node.TEXT_NODE)
              element = element.parentElement;
            if (
              !(element instanceof Element) ||
              element.closest(`#${toolbarId}`)
            )
              return;
            element =
              element.closest(
                "p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,figcaption,button,a,label,span,div",
              ) || element;
            history.pendingText = { element, before: element.innerHTML };
          };

          window._editPageTextInput = () => {
            const pending = history.pendingText;
            history.pendingText = null;
            if (!pending?.element?.isConnected) return;
            const after = pending.element.innerHTML;
            if (pending.before !== after) {
              history.push({
                type: "text",
                element: pending.element,
                before: pending.before,
                after,
                time: Date.now(),
              });
            }
          };

          window._editPageHistoryKeyHandler = (event) => {
            if (!document.getElementById(toolbarId)) return;
            if (
              !(event.ctrlKey || event.metaKey) ||
              event.key.toLowerCase() !== "z"
            )
              return;
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) history.redo();
            else history.undo();
          };

          document.addEventListener(
            "beforeinput",
            window._editPageTextBeforeInput,
            true,
          );
          document.addEventListener("input", window._editPageTextInput, true);
          document.addEventListener(
            "keydown",
            window._editPageHistoryKeyHandler,
            true,
          );
        }

        window._editPageFinishEditingSession = () => {
          document.body.contentEditable = "false";
          document.body.classList.remove(
            "edit-page-editing",
            "edit-page-replace-mode",
            "edit-page-remove-mode",
          );
          if (window._editPageReplaceHandler)
            document.removeEventListener(
              "click",
              window._editPageReplaceHandler,
              true,
            );
          if (window._editPageReplaceMouseDownHandler)
            document.removeEventListener(
              "mousedown",
              window._editPageReplaceMouseDownHandler,
              true,
            );
          if (window._editPageRemoveClickHandler)
            document.removeEventListener(
              "click",
              window._editPageRemoveClickHandler,
              true,
            );
          if (window._editPageRemoveOverHandler)
            document.removeEventListener(
              "mouseover",
              window._editPageRemoveOverHandler,
              true,
            );
          if (window._editPageRemoveOutHandler)
            document.removeEventListener(
              "mouseout",
              window._editPageRemoveOutHandler,
              true,
            );
          if (window._editPageTextBeforeInput)
            document.removeEventListener(
              "beforeinput",
              window._editPageTextBeforeInput,
              true,
            );
          if (window._editPageTextInput)
            document.removeEventListener(
              "input",
              window._editPageTextInput,
              true,
            );
          if (window._editPageHistoryKeyHandler)
            document.removeEventListener(
              "keydown",
              window._editPageHistoryKeyHandler,
              true,
            );
          window._editPageReplaceHandler = null;
          window._editPageReplaceMouseDownHandler = null;
          window._editPageRemoveClickHandler = null;
          window._editPageRemoveOverHandler = null;
          window._editPageRemoveOutHandler = null;
          window._editPageTextBeforeInput = null;
          window._editPageTextInput = null;
          window._editPageHistoryKeyHandler = null;
          window._editPageHistory = null;
          document
            .querySelectorAll(".edit-page-remove-target")
            .forEach((element) =>
              element.classList.remove("edit-page-remove-target"),
            );
          document.getElementById(toolbarId)?.remove();
        };

        window._editPageHistory.labels = labels;
        window._editPageHistory.update();
      },
      args: [
        {
          undo: t("undo"),
          redo: t("redo"),
          done: t("done"),
          count: t("changeCount"),
          warning: t("editWarning"),
        },
      ],
    });
  };

  const stopEditMode = async () => {
    if (await getIsEditing()) {
      await toggleEdit();
    }
    updateButton(false);
  };

  const finishEditingSession = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: () => window._editPageFinishEditingSession?.(),
      })
      .catch(() => {});
  };

  const copyScreenshotToClipboard = async (dataUrl) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  };

  const screenshotFilename = (kind) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `edit-page-${kind}-${timestamp}.png`;
  };

  const saveScreenshot = async (dataUrl, kind) => {
    if (screenshotDestination === "download") {
      await chrome.downloads.download({
        url: dataUrl,
        filename: screenshotFilename(kind),
        saveAs: false,
      });
      return t("statusScreenshotDownloaded");
    }
    await copyScreenshotToClipboard(dataUrl);
    return t("statusScreenshotSuccess");
  };

  const takeVisibleScreenshot = async () => {
    try {
      visibleScreenshotBtn.disabled = true;
      visibleScreenshotLabel.textContent = t("screenshotting");
      showStatus(t("statusScreenshotting"), true);

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });

      const successMessage = await saveScreenshot(dataUrl, "viewport");
      showStatus(successMessage, true);
    } catch (e) {
      console.error("Screenshot failed:", e);
      showStatus(t("statusScreenshotFailed") + e.message, false);
    } finally {
      visibleScreenshotBtn.disabled = false;
      visibleScreenshotLabel.textContent = t("visibleScreenshot");
    }
  };

  const setCaptureProgress = (progress) => {
    if (!progress) {
      captureProgress.classList.add("hidden");
      captureProgressBar.style.width = "0%";
      captureProgressText.textContent = "";
      return;
    }

    captureProgress.classList.remove("hidden");
    let percent = 8;
    let message = t("preparingFullPage");
    if (progress.status === "capturing") {
      const current = progress.current || 0;
      const total = progress.total || 1;
      percent = Math.max(10, Math.round((current / total) * 88));
      message = t("capturingFullPage")
        .replace("{current}", String(current))
        .replace("{total}", String(total));
    } else if (progress.status === "stitching") {
      percent = 94;
      message = t("stitchingFullPage");
    } else if (progress.status === "done") {
      percent = 100;
      message = t("savingScreenshot");
    } else if (progress.status === "error") {
      percent = 100;
      message = t("statusScreenshotFailed") + (progress.error || "");
    }
    captureProgressBar.style.width = `${percent}%`;
    captureProgressText.textContent = message;
  };

  const takeFullPageScreenshot = async () => {
    fullPageScreenshotBtn.disabled = true;
    visibleScreenshotBtn.disabled = true;
    fullPageScreenshotLabel.textContent = t("screenshotting");
    setCaptureProgress({ status: "preparing" });

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const result = await Promise.race([
        chrome.runtime.sendMessage({
          action: "captureFullPage",
          tabId: tab.id,
          windowId: tab.windowId,
        }),
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Full-page capture timed out")),
            180000,
          );
        }),
      ]);

      if (!result?.ok || !result.dataUrl) {
        throw new Error(result?.error || "Full-page capture failed");
      }

      const successMessage = await saveScreenshot(result.dataUrl, "full-page");
      captureProgressBar.style.width = "100%";
      captureProgressText.textContent = successMessage;
      showStatus(successMessage, true);
    } catch (error) {
      console.error("Full-page screenshot failed:", error);
      showStatus(t("statusScreenshotFailed") + error.message, false);
    } finally {
      fullPageScreenshotBtn.disabled = false;
      visibleScreenshotBtn.disabled = false;
      fullPageScreenshotLabel.textContent = t("fullPageScreenshot");
      setTimeout(() => setCaptureProgress(null), 1800);
    }
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.fullPageCaptureProgress?.newValue) {
      setCaptureProgress(changes.fullPageCaptureProgress.newValue);
    }
  });

  const saveImageData = async (data) => {
    try {
      if (data) {
        await chrome.storage.local.set({ replaceImageData: data });
      } else {
        await chrome.storage.local.remove("replaceImageData");
      }
    } catch (e) {}
  };

  const loadImageData = async () => {
    try {
      const result = await chrome.storage.local.get(["replaceImageData"]);
      return result.replaceImageData || null;
    } catch (e) {
      return null;
    }
  };

  const checkReplaceModeActive = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () =>
          !!document.body.classList.contains("edit-page-replace-mode"),
      });
      return results[0].result;
    } catch (e) {
      return false;
    }
  };

  const checkRemoveModeActive = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!document.body.classList.contains("edit-page-remove-mode"),
      });
      return results[0].result;
    } catch (e) {
      return false;
    }
  };

  const updateRemoveButton = () => {
    removeBtnLabel.textContent = isRemoveMode
      ? t("exitRemoveMode")
      : t("removeElement");
    removeBtn.classList.toggle("active", isRemoveMode);
    removeBtn.setAttribute("aria-pressed", String(isRemoveMode));
  };

  const stopRemoveMode = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._editPageRemoveClickHandler) {
          document.removeEventListener(
            "click",
            window._editPageRemoveClickHandler,
            true,
          );
          document.removeEventListener(
            "mouseover",
            window._editPageRemoveOverHandler,
            true,
          );
          document.removeEventListener(
            "mouseout",
            window._editPageRemoveOutHandler,
            true,
          );
        }
        window._editPageRemoveClickHandler = null;
        window._editPageRemoveOverHandler = null;
        window._editPageRemoveOutHandler = null;
        document
          .querySelectorAll(".edit-page-remove-target")
          .forEach((element) => {
            element.classList.remove("edit-page-remove-target");
          });
        document.body.classList.remove("edit-page-remove-mode");
      },
    });
  };

  const startRemoveMode = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._editPageRemoveClickHandler) return;

        const canRemove = (element) =>
          element instanceof Element &&
          element !== document.documentElement &&
          element !== document.body &&
          !element.closest("#edit-page-history-toolbar");

        window._editPageRemoveOverHandler = (event) => {
          if (!canRemove(event.target)) return;
          document
            .querySelectorAll(".edit-page-remove-target")
            .forEach((element) => {
              if (element !== event.target)
                element.classList.remove("edit-page-remove-target");
            });
          event.target.classList.add("edit-page-remove-target");
        };

        window._editPageRemoveOutHandler = (event) => {
          if (canRemove(event.target))
            event.target.classList.remove("edit-page-remove-target");
        };

        window._editPageRemoveClickHandler = (event) => {
          if (!canRemove(event.target)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          const parent = event.target.parentNode;
          const nextSibling = event.target.nextSibling;
          window._editPageHistory?.push({
            type: "remove",
            element: event.target,
            parent,
            nextSibling,
            before: null,
            after: null,
            time: Date.now(),
          });
          event.target.remove();
        };

        document.addEventListener(
          "mouseover",
          window._editPageRemoveOverHandler,
          true,
        );
        document.addEventListener(
          "mouseout",
          window._editPageRemoveOutHandler,
          true,
        );
        document.addEventListener(
          "click",
          window._editPageRemoveClickHandler,
          true,
        );
        document.body.classList.add("edit-page-remove-mode");
      },
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
      `,
    });
  };

  const updateReplaceButton = () => {
    replaceImageBtnLabel.textContent = isReplaceMode
      ? t("exitReplaceMode")
      : t("replaceMode");
    replaceImageBtn.classList.toggle("active", isReplaceMode);
    replaceImageBtn.setAttribute("aria-pressed", String(isReplaceMode));
  };

  const clearImage = async () => {
    selectedImageData = null;
    imageUrlInput.value = "";
    imageUrlInput.removeAttribute("aria-invalid");
    imagePreview.classList.add("hidden");
    previewImg.src = "";
    replaceImageBtn.classList.add("hidden");
    await saveImageData(null);
    if (isReplaceMode) {
      isReplaceMode = false;
      updateReplaceButton();
      await stopReplaceMode();
    }
  };

  previewImg.addEventListener("error", async () => {
    if (!selectedImageData) return;
    selectedImageData = null;
    imagePreview.classList.add("hidden");
    previewImg.removeAttribute("src");
    replaceImageBtn.classList.add("hidden");
    await saveImageData(null);
    showStatus(t("imageReadFailed"), false);
  });

  const startReplaceMode = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (imageData) => {
        if (window._editPageReplaceHandler) {
          window._editPageReplaceImage = imageData;
          document.body.classList.add("edit-page-replace-mode");
          return;
        }

        window._editPageReplaceImage = imageData;

        const findImageElement = (element) => {
          if (!element) return null;

          if (element.tagName === "IMG") {
            return element;
          }

          const img = element.querySelector("img");
          if (img) return img;

          const bgImg = window.getComputedStyle(element).backgroundImage;
          if (bgImg && bgImg !== "none") {
            return element;
          }

          return null;
        };

        window._editPageReplaceHandler = (e) => {
          if (!window._editPageReplaceImage) return;
          if (
            e.target instanceof Element &&
            e.target.closest("#edit-page-history-toolbar")
          )
            return;

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
            if (img.tagName === "IMG") {
              const picture = img.closest("picture");
              const sources = picture
                ? Array.from(picture.querySelectorAll("source"))
                : [];
              const snapshot = () => ({
                src: img.getAttribute("src"),
                srcset: img.getAttribute("srcset"),
                sources: sources.map((source) => ({
                  srcset: source.getAttribute("srcset"),
                  media: source.getAttribute("media"),
                  type: source.getAttribute("type"),
                })),
              });
              const before = snapshot();
              img.src = window._editPageReplaceImage;
              if (img.srcset) {
                img.srcset = "";
              }

              if (picture) {
                sources.forEach((source) => {
                  source.removeAttribute("srcset");
                  source.removeAttribute("media");
                  source.removeAttribute("type");
                });
              }
              window._editPageHistory?.push({
                type: "image",
                imageKind: "img",
                element: img,
                sources,
                before,
                after: snapshot(),
                time: Date.now(),
              });
            } else {
              const before = { backgroundImage: img.style.backgroundImage };
              img.style.backgroundImage = `url(${window._editPageReplaceImage})`;
              window._editPageHistory?.push({
                type: "image",
                imageKind: "background",
                element: img,
                sources: [],
                before,
                after: { backgroundImage: img.style.backgroundImage },
                time: Date.now(),
              });
            }
          }
        };

        window._editPageReplaceMouseDownHandler = (event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("#edit-page-history-toolbar")
          )
            return;
          event.preventDefault();
        };

        document.addEventListener(
          "click",
          window._editPageReplaceHandler,
          true,
        );
        document.addEventListener(
          "mousedown",
          window._editPageReplaceMouseDownHandler,
          true,
        );
        document.body.classList.add("edit-page-replace-mode");
      },
      args: [selectedImageData],
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
      `,
    });
  };

  const stopReplaceMode = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window._editPageReplaceHandler) {
          document.removeEventListener(
            "click",
            window._editPageReplaceHandler,
            true,
          );
        }
        if (window._editPageReplaceMouseDownHandler) {
          document.removeEventListener(
            "mousedown",
            window._editPageReplaceMouseDownHandler,
            true,
          );
        }
        window._editPageReplaceHandler = null;
        window._editPageReplaceMouseDownHandler = null;
        window._editPageReplaceImage = null;
        document.body.classList.remove("edit-page-replace-mode");
      },
    });
  };

  currentLang = await resolveLanguage().catch(() => "en");
  applyLanguage();

  settingsBtn.addEventListener("click", (event) => {
    event.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });

  let startupStatusTimer = setTimeout(() => {
    showStatus(t("connecting"), true);
  }, 350);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageEditable = isEditablePage(tab.url);

  if (!pageEditable) {
    unsupportedPage.classList.remove("hidden");
    mainContent.classList.add("hidden");
    return;
  }

  await refreshLicenseStatus();
  document.body.classList.toggle("is-premium", isPremium());

  const initialStoredState = await getStoredTrialState();
  if (!isPremium() && initialStoredState.trialClicksUsed == null) {
    await restoreTrialExhaustedState();
  }

  trialInfo = await getTrialInfo();

  clearTimeout(startupStatusTimer);

  updateTrialUI(trialInfo);
  statusDiv.classList.remove("visible");

  if (!trialInfo.isExpired || trialInfo.isUnlocked) {
    const isEditing = await getIsEditing();
    updateButton(isEditing);

    const savedImage = await loadImageData();
    if (savedImage) {
      selectedImageData = savedImage;
      previewImg.src = selectedImageData;
      imagePreview.classList.remove("hidden");
      replaceImageBtn.classList.remove("hidden");
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

    editBtn.addEventListener("click", async () => {
      if (isEditModeTransitioning) return;
      isEditModeTransitioning = true;
      editBtn.disabled = true;
      editBtn.setAttribute("aria-busy", "true");
      try {
        const currentTrialInfo = await getTrialInfo();
        if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
          showTrialExpiredToast(currentTrialInfo);
          return;
        }
        trialInfo = await incrementTrialClick();
        const willEnableEdit = !(await getIsEditing());
        if (willEnableEdit) {
          await ensureHistoryManager();
          if (isReplaceMode) {
            await stopReplaceMode();
            isReplaceMode = false;
            updateReplaceButton();
          }
          if (isRemoveMode) {
            await stopRemoveMode();
            isRemoveMode = false;
            updateRemoveButton();
          }
        }
        await toggleEdit();
        const newIsEditing = await getIsEditing();
        updateButton(newIsEditing);
        if (!newIsEditing) {
          await finishEditingSession();
        }
        updateTrialUI(trialInfo);
      } catch (error) {
        console.error("Failed to toggle text editing mode", error);
        showStatus(t("editModeFailed"), false);
      } finally {
        isEditModeTransitioning = false;
        editBtn.disabled = false;
        editBtn.removeAttribute("aria-busy");
      }
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

    screenshotBtn.addEventListener("click", () => {
      const expanded = screenshotBtn.getAttribute("aria-expanded") === "true";
      screenshotBtn.setAttribute("aria-expanded", String(!expanded));
      screenshotOptions.classList.toggle("hidden", expanded);
    });

    visibleScreenshotBtn.addEventListener("click", async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        showTrialExpiredToast(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      await prepareForScreenshot();
      await takeVisibleScreenshot();
      updateTrialUI(trialInfo);
    });

    fullPageScreenshotBtn.addEventListener("click", async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        showTrialExpiredToast(currentTrialInfo);
        return;
      }
      trialInfo = await incrementTrialClick();
      await prepareForScreenshot();
      await takeFullPageScreenshot();
      updateTrialUI(trialInfo);
    });

    const setSelectedImage = async (imageSource) => {
      selectedImageData = imageSource;
      previewImg.src = imageSource;
      imagePreview.classList.remove("hidden");
      replaceImageBtn.classList.remove("hidden");
      imageSourceOptions.classList.add("hidden");
      selectImageBtn.setAttribute("aria-expanded", "false");
      await saveImageData(imageSource);
      showStatus(t("imageSelected"), true);
    };

    const getValidImageUrl = (value) => {
      try {
        const url = new URL(value.trim());
        return ["http:", "https:"].includes(url.protocol) ? url.href : null;
      } catch {
        return null;
      }
    };

    const testImageLoad = (source, timeoutMs = 10000) =>
      new Promise((resolve) => {
        const image = new Image();
        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          image.onload = null;
          image.onerror = null;
          resolve(result);
        };
        const timer = setTimeout(
          () => finish({ ok: false, reason: "timeout" }),
          timeoutMs,
        );
        image.onload = () =>
          finish({
            ok: image.naturalWidth > 0 && image.naturalHeight > 0,
            reason: "decode",
          });
        image.onerror = () => finish({ ok: false, reason: "load" });
        image.src = source;
      });

    const inspectImageResponse = async (url, signal) => {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          cache: "no-store",
          signal,
        });
        return {
          kind: "response",
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get("content-type") || "",
        };
      } catch (error) {
        return {
          kind: error.name === "AbortError" ? "timeout" : "network",
        };
      }
    };

    const validateRemoteImage = async (url) => {
      const controller = new AbortController();
      const responseTimer = setTimeout(() => controller.abort(), 6000);
      const responsePromise = inspectImageResponse(url, controller.signal);
      const loadResult = await testImageLoad(url);

      if (loadResult.ok) {
        clearTimeout(responseTimer);
        controller.abort();
        return null;
      }

      const responseInfo = await responsePromise;
      clearTimeout(responseTimer);

      if (loadResult.reason === "timeout") return t("imageLoadTimeout");
      if (responseInfo.kind === "network")
        return t("imageUrlAccessRestricted");
      if (responseInfo.kind === "timeout") return t("imageLoadTimeout");
      if (responseInfo.status === 401 || responseInfo.status === 403)
        return t("imageUrlDenied");
      if (responseInfo.status === 404) return t("imageUrlNotFound");
      if (!responseInfo.ok) {
        if (responseInfo.status === 405) return t("imageReadFailed");
        return t("imageUrlHttpError").replace(
          "{status}",
          String(responseInfo.status),
        );
      }
      if (
        responseInfo.contentType &&
        !responseInfo.contentType.toLowerCase().startsWith("image/") &&
        !responseInfo.contentType.toLowerCase().includes("octet-stream")
      ) {
        return t("imageUrlNotImage");
      }
      return t("imageReadFailed");
    };

    selectImageBtn.addEventListener("click", async () => {
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        showTrialExpiredToast(currentTrialInfo);
        return;
      }
      const isExpanded =
        selectImageBtn.getAttribute("aria-expanded") === "true";
      selectImageBtn.setAttribute("aria-expanded", String(!isExpanded));
      imageSourceOptions.classList.toggle("hidden", isExpanded);
    });

    uploadImageBtn.addEventListener("click", () => {
      imageInput.click();
    });

    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageSource = event.target.result;
          const loadResult = await testImageLoad(imageSource);
          if (!loadResult.ok) {
            showStatus(t("imageReadFailed"), false);
            imageInput.value = "";
            return;
          }
          await setSelectedImage(imageSource);
        };
        reader.onerror = () => {
          showStatus(t("imageReadFailed"), false);
          imageInput.value = "";
        };
        reader.readAsDataURL(file);
      }
    });

    useImageUrlBtn.addEventListener("click", async () => {
      const imageUrl = getValidImageUrl(imageUrlInput.value);
      if (!imageUrl) {
        imageUrlInput.setAttribute("aria-invalid", "true");
        showStatus(t("invalidImageUrl"), false);
        imageUrlInput.focus();
        return;
      }
      useImageUrlBtn.disabled = true;
      useImageUrlBtn.setAttribute("aria-busy", "true");
      useImageUrlBtn.textContent = t("checkingImageUrl");
      try {
        const validationError = await validateRemoteImage(imageUrl);
        if (validationError) {
          imageUrlInput.setAttribute("aria-invalid", "true");
          showStatus(validationError, false);
          return;
        }
        imageUrlInput.removeAttribute("aria-invalid");
        await setSelectedImage(imageUrl);
      } catch (error) {
        console.error("Failed to validate image URL", error);
        showStatus(t("imageReadFailed"), false);
      } finally {
        useImageUrlBtn.disabled = false;
        useImageUrlBtn.removeAttribute("aria-busy");
        useImageUrlBtn.textContent = t("useImageUrl");
      }
    });

    imageUrlInput.addEventListener("input", () => {
      imageUrlInput.removeAttribute("aria-invalid");
    });

    imageUrlInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        useImageUrlBtn.click();
      }
    });

    clearImageBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await clearImage();
      imageInput.value = "";
    });

    replaceImageBtn.addEventListener("click", async () => {
      if (isReplaceModeTransitioning) return;
      const currentTrialInfo = await getTrialInfo();
      if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
        showTrialExpiredToast(currentTrialInfo);
        return;
      }
      if (!selectedImageData) {
        showStatus(t("pleaseSelectImageFirst"), false);
        return;
      }
      isReplaceModeTransitioning = true;
      replaceImageBtn.disabled = true;
      replaceImageBtn.setAttribute("aria-busy", "true");
      const nextReplaceMode = !isReplaceMode;
      try {
        trialInfo = await incrementTrialClick();
        if (nextReplaceMode) {
          await ensureHistoryManager();
          await stopEditMode();
          if (isRemoveMode) {
            await stopRemoveMode();
            isRemoveMode = false;
            updateRemoveButton();
          }
          await startReplaceMode();
        } else {
          await stopReplaceMode();
          await finishEditingSession();
        }
        isReplaceMode = nextReplaceMode;
        updateReplaceButton();
        updateTrialUI(trialInfo);
      } catch (error) {
        console.error("Failed to toggle replacement mode", error);
        showStatus(t("replaceModeFailed"), false);
      } finally {
        isReplaceModeTransitioning = false;
        replaceImageBtn.disabled = false;
        replaceImageBtn.removeAttribute("aria-busy");
      }
    });

    removeBtn.addEventListener("click", async () => {
      if (isRemoveModeTransitioning) return;
      isRemoveModeTransitioning = true;
      removeBtn.disabled = true;
      removeBtn.setAttribute("aria-busy", "true");
      try {
        const currentTrialInfo = await getTrialInfo();
        if (currentTrialInfo.isExpired && !currentTrialInfo.isUnlocked) {
          showTrialExpiredToast(currentTrialInfo);
          return;
        }

        trialInfo = await incrementTrialClick();
        const nextRemoveMode = !isRemoveMode;
        if (nextRemoveMode) {
          await ensureHistoryManager();
          await stopEditMode();
          if (isReplaceMode) {
            await stopReplaceMode();
            isReplaceMode = false;
            updateReplaceButton();
          }
          await startRemoveMode();
        } else {
          await stopRemoveMode();
          await finishEditingSession();
        }
        isRemoveMode = nextRemoveMode;
        updateRemoveButton();
        updateTrialUI(trialInfo);
      } catch (error) {
        console.error("Failed to toggle remove mode", error);
        showStatus(t("removeModeFailed"), false);
      } finally {
        isRemoveModeTransitioning = false;
        removeBtn.disabled = false;
        removeBtn.removeAttribute("aria-busy");
      }
    });
  } else {
    mainContent.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        showTrialExpiredToast(trialInfo);
      }
    });
  }
});
