# Chrome Web Store Listing — Edit Page

> Last Updated: 2026-10-08

## Localized Store Listing

Copy-ready descriptions for all 30 supported languages are maintained in `docs/CHROMEWEBSTORE-DESCRIPTIONS.md`. Localized names and summaries are packaged with the extension in `_locales`.

Product names always use the English name `Edit Page`. Functional wording is localized for each store language.

### English

**Extension Name**

Edit Page - Webpage Editor & Full Page Screenshot

**Summary**

Edit text, replace and resize images, format text, remove elements, and capture the current view or a full-page screenshot.

### 简体中文

**扩展程序名称**

Edit Page - 网页编辑与整页截图

**摘要**

直接编辑网页文字、设置文本格式、替换图片并调整大小、移除元素，并截取当前视窗或整张网页。

### Español

**Nombre de la extensión**

Edit Page - Editor de páginas web y captura completa

**Resumen**

Edita y formatea textos, cambia y redimensiona imágenes, elimina elementos y captura la vista actual o una página completa.

### Português (Brasil)

**Nome da extensão**

Edit Page - Editor de páginas e captura completa

**Resumo**

Edite e formate textos, altere e redimensione imagens, remova elementos, capture a visualização ou a página inteira.

### 日本語

**拡張機能名**

Edit Page - ウェブページ編集とページ全体撮影

**概要**

テキストの編集と書式設定、画像の置換とサイズ変更、要素の削除、現在の表示領域またはページ全体の撮影ができます。

## Copy Rules

- Product name: always `Edit Page` in every language.
- English feature terms: Edit text, Text formatting, Change image, Resize, Remove element, Screenshot, Current view, Full page.
- Chinese feature terms: 编辑文字、文本格式、更改图片、调整大小、移除元素、截图、当前视窗、整张网页。
- Supported interface and store languages: 30 total. English is the default; the remaining languages are Arabic, Simplified Chinese, Traditional Chinese, Czech, Danish, Dutch, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Malay, Norwegian, Polish, Brazilian Portuguese, Romanian, Russian, Spanish, Swedish, Thai, Turkish, Ukrainian, and Vietnamese.
- Keep the extension name within 75 characters and the Summary within 132 characters.
- Keep keywords natural. Do not add unsupported claims, superlatives, or repetitive keyword variants.

## Dashboard Sync

- [ ] Copy all 30 localized descriptions from `docs/CHROMEWEBSTORE-DESCRIPTIONS.md` into the Chrome Web Store dashboard.
- [ ] Copy the 30 localized names and summaries from `_locales` into the Chrome Web Store dashboard.
- [x] Generate the packaged names and summaries in `_locales`, plus the separate description document, by running `node scripts/generate-store-locales.mjs`.

## Current Screenshot Behavior

- Full-page capture automatically de-duplicates fixed headers and footers.
- When “Hide repeated elements” is enabled, small floating controls, supported developer overlays such as Vercel Toolbar, and scrollbars are temporarily hidden during capture and restored afterward.
- Screenshot cleanup does not permanently modify the webpage.

## Permissions Justification

### Extension permissions

- `activeTab`: Grants temporary access to the current tab only after the user clicks the Edit Page action. This is what lets Edit Page read the current tab URL (to detect unsupported browser-internal pages), run the editing behavior, and capture the visible tab. The extension does not hold permanent access to any website, and the grant ends when the tab navigates or closes.
- `scripting`: Runs the user-selected editing, image replacement, element removal, and full-page screenshot behavior in the current webpage.
- `storage`: Saves interface language, screenshot preferences, free-feature usage, selected replacement-image data, and locally verified Premium activation state. Preferences and free-feature usage use Chrome sync storage; activation and temporary image data use local storage; the full-page screenshot task lock uses session storage.
- `alarms`: Periodically checks an existing Premium activation so revoked, refunded, expired, or moved activations are reflected without requiring the user to open the extension.
- `offscreen`: Required only for the user-initiated full-page screenshot feature. Edit Page captures the webpage in viewport-sized segments and uses a hidden offscreen document with a canvas to combine those segments into one PNG image. The offscreen document is not used for browsing, tracking, advertising, or background data collection, and screenshot data is not uploaded.

### Optional permissions (requested only when the matching feature is used)

- `clipboardWrite`: Not requested at install time. Requested the first time the user starts a screenshot while Clipboard is the selected save method. Used only to copy the resulting PNG image and never to read clipboard contents.
- `downloads`: Not requested at install time. Requested the first time the user starts a screenshot while Download is the selected save method. Files are created only in response to that explicit user action; the extension does not inspect, modify, or manage existing downloads.

Each permission is requested separately, matching the user's current action, and is remembered once granted.

### Host permissions

- None. Edit Page requests no permanent access to any website. Access to the page being edited or captured is granted per tab through `activeTab` when the user clicks the extension action, and the Premium activation / periodic check-in endpoints (`https://licentra.henriz.dev`) accept browser-extension origins through CORS.

## Privacy & Data Use

### Data processed locally

- Webpage text, images, DOM elements, and screenshot pixels are processed locally in the browser.
- Screenshots are written only to the destination selected by the user: Clipboard or Download.
- A locally uploaded replacement image is temporarily stored in Chrome local extension storage so the selection survives reopening the popup. It is not sent to Edit Page or Licentra.
- Screenshot preferences, language preference, and free-feature counters are stored through Chrome extension storage.

### Network requests

- When a user pastes an image URL, Edit Page contacts that URL directly to confirm that the resource can be read as an image. The extension does not send the URL to Edit Page or Licentra.
- When a user activates Premium, Edit Page sends the License Key, a hashed device fingerprint, and the installed extension version to `https://licentra.henriz.dev`.
- Periodic Premium validation sends the stored License Key, hashed device fingerprint, and installed extension version to `https://licentra.henriz.dev`.
- The device fingerprint is derived from operating-system type, CPU architecture, logical processor count, and reported device memory. Screen dimensions, browsing history, webpage content, and screenshot content are not included.
- Approximately every 12–24 hours, Edit Page sends aggregate feature-use counters, a random installation identifier, the normalized extension/browser environment, an explicit allowlist of current preferences, and whether its two optional screenshot-output permissions (`clipboardWrite` and `downloads`) are currently granted to `https://editpage.henriz.dev`. The preference allowlist contains only interface language choice, screenshot destination, whether repeated elements are hidden in full-page screenshots, and whether the text-selection toolbar is enabled. It never includes the complete extension storage, granted website origins, webpage data, replacement images, screenshots, License Keys, device fingerprints, or free-feature counter values.
- Clicking website, review, or feedback links opens the relevant external page. `utm_source=dashboard` may be included in the opened URL for source attribution.
- On first installation, Edit Page opens `https://editpage.henriz.dev/getting-started?installed=1&browser=chrome` (or `browser=edge` in Microsoft Edge). After uninstalling, Chrome opens `https://editpage.henriz.dev/api/telemetry/v1/uninstall?i=<random analytics installation identifier>`, which records that the installation was removed and then redirects to `https://editpage.henriz.dev/goodbye`. That lifecycle request carries only the random identifier; it never includes webpage content, license information, edited text, images, screenshots, or the extension's full stored data.

### Data not collected by the extension

- No browsing history, webpage content, replacement images, or screenshots are uploaded to Edit Page or Licentra.
- The extension contains no advertising SDK or third-party behavioral analytics SDK. Its first-party telemetry is limited to the aggregate product-use and allowlisted preference data described above.
- License information is used only to activate and validate Premium access; it is not sold or used for advertising.

## Version History

### 2.3.0 — 2026-10-07

- Added an optional selection formatting toolbar for font size, emphasis, decoration, text color, background color, and restoring original formatting.
- Added a free allowance of 30 text-formatting actions per 12-hour usage window; Premium use remains unlimited.
- Added resize handles to an image that was just replaced: corners keep the aspect ratio, edges stretch one axis, and holding Alt inverts the default.
- Added undo and redo for image resizing, one step per drag.

### 2.0 — 2026-08-31

- Added text, image, and element editing with shared undo and redo controls.
- Added local image upload and Image URL import.
- Added current-viewport and full-page screenshot capture with Clipboard and Download destinations.
- Added optional cleanup of repeated floating elements and scrollbars in full-page screenshots.
- Added language, screenshot, Premium activation, usage, and support settings.
- Added Spanish, Brazilian Portuguese, and Japanese interface and store localization.
- Added first-install Getting Started and post-uninstall Goodbye links.
- Regenerated all extension icon sizes from the shared SVG artwork.
- Expanded the interface and Chrome Web Store localization coverage to 30 languages, including RTL layout support for Arabic and Hebrew.

## Publishing Readiness

- [ ] Confirm the public privacy policy contains the same data and permission disclosures as this document.
- [ ] Complete the Chrome Web Store data-use questionnaire using the disclosures above.
- [ ] Provide at least one current 1280×800 or 640×400 store screenshot.
- [ ] Confirm every requested permission in the uploaded ZIP matches this document.
- [ ] Verify that the release ZIP excludes repository files, development files, and this document.
