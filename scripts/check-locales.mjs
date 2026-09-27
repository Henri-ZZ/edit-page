import {
  ADDITIONAL_OPTIONS_MESSAGES,
  ADDITIONAL_POPUP_MESSAGES,
  LANGUAGE_OPTIONS,
} from "../i18n/locales.js";

const builtInLocales = new Set(["en", "es", "pt-BR", "ja", "zh-CN"]);
const popupKeys = [
  "settings", "chooseTool", "editText", "editTextDesc", "changeImage",
  "changeImageDesc", "uploadLocalImage", "imageUrlPlaceholder", "useImageUrl",
  "removeElement", "removeElementDesc", "screenshot", "screenshotDesc",
  "visibleScreenshot", "fullPageScreenshot", "freePlan", "undo", "redo", "done",
  "cannotEditThisPage", "pageNotSupported", "statusScreenshotSuccess",
  "statusScreenshotDownloaded",
];
const optionsKeys = [
  "documentTitle", "title", "subtitle", "language", "languageHelp", "followBrowser",
  "screenshotSettings", "saveMethod", "screenshotDestinationHelp", "saveToClipboard",
  "saveAsDownload", "whenCapturingFullPage", "hideRepeatedElements",
  "hideRepeatedElementsHelp", "premiumIntro", "premiumLearn", "premiumActivateLabel",
  "premiumCodePlaceholder", "premiumActivate", "premiumActivateEmpty",
  "premiumActivating", "premiumActivateSuccess", "premiumActivateInvalid",
  "premiumActivateRevoked", "premiumActivateRefunded", "premiumActivateError",
  "quotaReplaceImage", "quotaFullPage", "quotaRemoveElement", "quotaOfLeft",
  "quotaLimitReached", "quotaWindow", "quotaResumesIn", "supportSection",
  "supportReviewPrompt", "supportFeedbackPrompt", "leaveReview", "sendFeedback",
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
  "Activation failed. Check your connection and try again.", "Image imports",
  "Full-page screenshot", "Remove element", "{remaining} of {limit} left",
  "Limit reached",
  "When any quota runs out, all advanced features pause for 12 hours. Upgrade to Premium for unlimited use.",
  "Unlocks in {reset}", "Enjoying Edit Page?", "Found a bug or have a suggestion?",
]);

const errors = [];
for (const { code } of LANGUAGE_OPTIONS) {
  if (builtInLocales.has(code)) continue;
  const popup = ADDITIONAL_POPUP_MESSAGES[code] || {};
  const options = ADDITIONAL_OPTIONS_MESSAGES[code] || {};
  const missingPopup = popupKeys.filter((key) => !popup[key]);
  const missingOptions = optionsKeys.filter((key) => !options[key]);
  const fallbacks = Object.entries(options)
    .filter(([, value]) => englishFallbacks.has(value))
    .map(([key]) => key);
  if (missingPopup.length) errors.push(`${code}: missing popup keys: ${missingPopup.join(", ")}`);
  if (missingOptions.length) errors.push(`${code}: missing settings keys: ${missingOptions.join(", ")}`);
  if (fallbacks.length) errors.push(`${code}: English settings fallbacks: ${fallbacks.join(", ")}`);
}

if (errors.length) throw new Error(`Locale validation failed:\n${errors.join("\n")}`);
console.log(`Validated ${LANGUAGE_OPTIONS.length} UI languages without missing added-locale keys or known English fallbacks.`);
