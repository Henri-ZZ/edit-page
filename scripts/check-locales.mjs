import { readFileSync } from "node:fs";
import {
  ADDITIONAL_OPTIONS_MESSAGES,
  ADDITIONAL_POPUP_MESSAGES,
  LANGUAGE_OPTIONS,
} from "../i18n/locales.js";
import { EDIT_TEXT_SETTINGS_MESSAGES } from "../i18n/edit-text-settings.js";
import { DASHBOARD_TIPS_MESSAGES } from "../i18n/dashboard-tips.js";

const builtInLocales = new Set(["en", "es", "pt-BR", "ja", "zh-CN"]);
const popupKeys = [
  "settings", "chooseTool", "editText", "editTextDesc", "changeImage",
  "changeImageDesc", "uploadLocalImage", "imageUrlPlaceholder", "useImageUrl",
  "removeElement", "removeElementDesc", "screenshot", "screenshotDesc",
  "visibleScreenshot", "fullPageScreenshot", "freePlan", "undo", "redo", "done",
  "cannotEditThisPage", "pageNotSupported", "statusScreenshotSuccess",
  "statusScreenshotDownloaded",
  // Image-replacement flow. These were built-in-only for a long time, so every
  // other language fell back to English without this check noticing.
  "title", "replaceMode", "clearImage", "imageSelected",
  "pleaseSelectImageFirst", "checkingImageUrl", "invalidImageUrl",
  "imageReadFailed", "replaceModeFailed",
  "changeCount", "editWarning", "connecting",
  "editModeFailed", "removeModeFailed", "quotaExhaustedBadge",
  "quotaExhaustedToast", "imageUrlNotImage", "imageUrlDenied", "imageUrlNotFound",
  "imageUrlHttpError", "imageUrlAccessRestricted", "imageLoadTimeout",
  "screenshotting", "preparingFullPage", "capturingFullPage", "stitchingFullPage",
  "savingScreenshot", "statusScreenshotting", "statusScreenshotFailed",
  // Built per locale but never listed, so 25 languages silently showed English.
  "clipboardPermissionDenied", "downloadPermissionDenied",
  "fullPageCaptureInProgress", "fullPageTabChanged",
  // The page-side text-formatting toolbar, fed through
  // `_editPageSelectionToolbarInit(labels)`. English-only until now.
  "textColor", "backgroundColor", "customColor", "customTextColor",
  "customBackgroundColor", "reset", "restoreOriginalFormatting", "mixed",
];
const optionsKeys = [
  "documentTitle", "title", "subtitle", "language", "languageHelp", "followBrowser",
  "changeImageSettings", "replaceImageFitHeading", "replaceImageFitHelp",
  "replaceImageFitCover", "replaceImageFitNatural",
  "screenshotSettings", "saveMethod", "screenshotDestinationHelp", "saveToClipboard",
  "saveAsDownload", "whenCapturingFullPage", "hideRepeatedElements",
  "hideRepeatedElementsHelp", "premiumIntro", "premiumLearn", "premiumActivateLabel",
  "premiumCodePlaceholder", "premiumActivate", "premiumActivateEmpty",
  "premiumActivating", "premiumActivateSuccess", "premiumActivateInvalid",
  "premiumActivateRevoked", "premiumActivateRefunded", "premiumActivateError",
  "quotaReplaceImage", "quotaFullPage", "quotaRemoveElement", "quotaOfLeft",
  "quotaLimitReached", "quotaWindow", "quotaResumesIn",   "supportSection",
  "supportReviewPrompt", "supportFeedbackPrompt", "leaveReview", "sendFeedback",
  // Auto-enter card. English-only for a long time: never listed here, so every
  // language but English fell back to English without the check noticing.
  "autoEnterHeading", "autoEnterHelp", "autoEnterEdit", "autoEnterRemove",
  // Rendered by the settings page from the two extra modules merged below.
  "quotaTextFormatting", "editTextSettings", "showSelectionToolbar",
  "tipsTitle", "tipNavigateText", "tipImageUrl",
];
const englishFallbacks = new Set([
  "Customize Edit Page to work the way you prefer.",
  "Choose the interface language, or follow your browser.",
  "Choose where screenshots are saved.",
  "When capturing a full page",
  "Hide floating elements, scrollbars, and other content that may repeat.",
  "Premium provides unlimited access to all features and future enhancements.",
  "Learn about Premium", "Already have an activation code?", "Enter activation code",
  "Enter your activation code.", "Activating...", "Premium activated successfully.",
  "This activation code is invalid or expired.", "This activation code has been revoked.",
  "This activation code has been refunded.",
  "Activation failed. Check your connection and try again.", "Image replacements",
  "Full-page screenshot", "Remove element", "{remaining} of {limit} left",
  "Limit reached",
  "When any quota runs out, all advanced features pause for 12 hours. Upgrade to Premium for unlimited use.",
  "Unlocks in {reset}", "Enjoying Edit Page?", "Found a bug or have a suggestion?",
]);

const errors = [];
for (const { code } of LANGUAGE_OPTIONS) {
  if (builtInLocales.has(code)) continue;
  const popup = ADDITIONAL_POPUP_MESSAGES[code] || {};
  // The settings page assembles its strings from three modules, so validating
  // only the first one left the other two unchecked.
  const options = {
    ...(ADDITIONAL_OPTIONS_MESSAGES[code] || {}),
    ...(EDIT_TEXT_SETTINGS_MESSAGES[code] || {}),
    ...(DASHBOARD_TIPS_MESSAGES[code] || {}),
  };
  const missingPopup = popupKeys.filter((key) => !popup[key]);
  const missingOptions = optionsKeys.filter((key) => !options[key]);
  const fallbacks = Object.entries(options)
    .filter(([, value]) => englishFallbacks.has(value))
    .map(([key]) => key);
  if (missingPopup.length) errors.push(`${code}: missing popup keys: ${missingPopup.join(", ")}`);
  if (missingOptions.length) errors.push(`${code}: missing settings keys: ${missingOptions.join(", ")}`);
  if (fallbacks.length) errors.push(`${code}: English settings fallbacks: ${fallbacks.join(", ")}`);
}

// The lists above are hand-maintained, so a key that a page renders but nobody
// listed stays English in every other language while this script reports
// success — which is exactly how the `autoEnter*` strings and the two
// screenshot-permission strings went missing. Any `data-i18n` key the shipped
// HTML renders must be listed here.
const htmlKeys = new Set();
for (const file of ["popup/popup.html", "options/options.html"]) {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  for (const match of html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="([^"]+)"/g)) {
    htmlKeys.add(match[1]);
  }
}
const listed = new Set([...popupKeys, ...optionsKeys]);
const unlisted = [...htmlKeys].filter((key) => !listed.has(key));
if (unlisted.length) {
  errors.push(`HTML renders keys that are not listed: ${unlisted.join(", ")}`);
}

if (errors.length) throw new Error(`Locale validation failed:\n${errors.join("\n")}`);
console.log(`Validated ${LANGUAGE_OPTIONS.length} UI languages without missing added-locale keys or known English fallbacks.`);
