// Premium state uses the shared Licentra client. Activation lives on the
// settings page; the popup only refreshes license state for feature gating.
import { isConfirmedCheckIn, maybeCheckIn } from "../license.js";
import {
  ADDITIONAL_POPUP_MESSAGES,
  getLanguageMetadata,
} from "../i18n/locales.js";
import {
  OPTIONAL_PERMISSIONS,
  clearPendingScreenshot,
  consumeFeatureUse,
  getPendingScreenshot,
  getPendingQuotaNotice,
  clearPendingQuotaNotice,
  getQuotaState,
  getAutoEnterMode,
  getReplaceImageFit,
  getScreenshotDestination,
  getSelectionToolbarEnabled,
  hasOptionalPermission,
  isPremium,
  refreshPremiumState,
  requestOptionalPermission,
  resolveLanguage,
  setPendingScreenshot,
  setScreenshotBadge,
} from "../shared.js";
import { trackTelemetryEvent } from "../telemetry.js";

const i18n = {
  en: {
    title: "Edit Page",
    settings: "Dashboard",
    chooseTool: "Select a tool to start",
    editText: "Edit text",
    editTextDesc: "Change any text on this page",
    screenshot: "Screenshot",
    screenshotDesc: "Capture the viewport or full page",
    visibleScreenshot: "Current viewport",
    fullPageScreenshot: "Full page",
    preparingFullPage: "Preparing full-page capture...",
    capturingFullPage: "Capturing {current} of {total}...",
    stitchingFullPage: "Stitching the final image...",
    fullPageCaptureInProgress: "A full-page screenshot is already in progress.",
    fullPageTabChanged:
      "The screenshot stopped because you switched tabs. Keep this page active and try again.",
    screenshotting: "Screenshotting...",
    statusScreenshotting: "Taking screenshot...",
    statusScreenshotSuccess: "Screenshot copied to clipboard!",
    statusScreenshotDownloaded: "Screenshot downloaded!",
    savingScreenshot: "Saving screenshot...",
    statusScreenshotFailed: "Screenshot failed: ",
    clipboardPermissionDenied:
      "The screenshot could not be completed because clipboard access was denied. Click the screenshot button again and choose Allow.",
    downloadPermissionDenied:
      "The screenshot could not be completed because download access was denied. Click the screenshot button again and choose Allow.",
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
    freePlan: "Free version",
    quotaExhaustedBadge: "Features limited",
    editModeFailed: "Text editing could not start on this page.",
    replaceModeFailed: "Replacement mode could not start on this page.",
    removeModeFailed: "Remove mode could not start on this page.",
    clearImage: "Clear selected image",
    replaceMode: "Replace Image Mode",
    imageSelected: 'Image selected, click "Replace Image Mode"',
    pleaseSelectImageFirst: "Please select an image first",
    removeElement: "Remove element",
    removeElementDesc: "Click anything to remove it",
    undo: "↶ Undo",
    redo: "↷ Redo",
    done: "Done",
    changeCount: "{count} changes",
    editWarning: "Editing may affect page behavior. Refresh to fully restore.",
    connecting: "Connecting to server...",
    cannotEditThisPage: "Cannot edit this page",
    pageNotSupported: "This page type is not supported",
    // Text-formatting toolbar (injected into the page).
    textColor: "Text color",
    backgroundColor: "Background color",
    customColor: "Custom",
    customTextColor: "Custom text color",
    customBackgroundColor: "Custom background color",
    reset: "Reset",
    restoreOriginalFormatting: "Restore original formatting",
    mixed: "Mixed",
    quotaExhaustedToast:
      "Advanced feature limit reached. Unlocks in {reset}. Upgrade to Premium for unlimited use.",
  },
  es: {
    title: "Edit Page",
    settings: "Panel",
    chooseTool: "Selecciona una herramienta para empezar",
    editText: "Editar texto",
    editTextDesc: "Cambia cualquier texto de esta página",
    screenshot: "Captura de pantalla",
    screenshotDesc: "Captura la vista actual o la página completa",
    visibleScreenshot: "Vista actual",
    fullPageScreenshot: "Página completa",
    preparingFullPage: "Preparando la captura de página completa...",
    capturingFullPage: "Capturando {current} de {total}...",
    stitchingFullPage: "Uniendo la imagen final...",
    fullPageCaptureInProgress: "Ya hay una captura de página completa en curso.",
    fullPageTabChanged:
      "La captura se detuvo porque cambiaste de pestaña. Mantén esta página activa e inténtalo de nuevo.",
    screenshotting: "Capturando...",
    statusScreenshotting: "Tomando la captura...",
    statusScreenshotSuccess: "¡Captura copiada al portapapeles!",
    statusScreenshotDownloaded: "¡Captura descargada!",
    savingScreenshot: "Guardando la captura...",
    statusScreenshotFailed: "Error al capturar: ",
    clipboardPermissionDenied:
      "La captura no se pudo completar porque se denegó el permiso de portapapeles. Vuelve a pulsar el botón de captura y elige Permitir.",
    downloadPermissionDenied:
      "La captura no se pudo completar porque se denegó el permiso de descargas. Vuelve a pulsar el botón de captura y elige Permitir.",
    changeImage: "Cambiar imagen",
    changeImageDesc: "Sube una imagen o pega su URL",
    uploadLocalImage: "Subir desde el dispositivo",
    imageUrlPlaceholder: "Pega la URL de la imagen",
    useImageUrl: "Usar URL",
    invalidImageUrl: "Introduce una URL de imagen http o https válida.",
    checkingImageUrl: "Comprobando...",
    imageUrlNotImage: "Esta URL no apunta a una imagen legible.",
    imageUrlDenied: "El sitio de origen rechazó el acceso a la imagen. Puede requerir inicio de sesión o impedir el uso externo.",
    imageUrlNotFound: "No se encontró la imagen. Es posible que la URL haya caducado o cambiado.",
    imageUrlHttpError: "El sitio de origen devolvió HTTP {status}, por lo que no se pudo leer la imagen.",
    imageUrlAccessRestricted: "El navegador no pudo acceder a la imagen. El sitio de origen puede restringir el acceso externo.",
    imageLoadTimeout: "La imagen tardó demasiado en responder. Comprueba la URL o la conexión.",
    imageReadFailed: "No se pudo leer la imagen. El archivo puede estar dañado, la URL puede ser incorrecta o el sitio puede bloquear el acceso.",
    freePlan: "Versión gratuita",
    quotaExhaustedBadge: "Funciones limitadas",
    editModeFailed: "No se pudo iniciar la edición de texto en esta página.",
    replaceModeFailed: "No se pudo iniciar el modo de reemplazo en esta página.",
    removeModeFailed: "No se pudo iniciar el modo de eliminación en esta página.",
    clearImage: "Quitar la imagen seleccionada",
    replaceMode: "Modo de reemplazo",
    imageSelected: 'Imagen seleccionada. Haz clic en "Modo de reemplazo"',
    pleaseSelectImageFirst: "Selecciona primero una imagen",
    removeElement: "Eliminar elemento",
    removeElementDesc: "Haz clic en cualquier elemento para eliminarlo",
    undo: "↶ Deshacer",
    redo: "↷ Rehacer",
    done: "Listo",
    changeCount: "{count} cambios",
    editWarning: "La edición puede afectar al funcionamiento de la página. Actualízala para restaurarla por completo.",
    connecting: "Conectando con el servidor...",
    cannotEditThisPage: "No se puede editar esta página",
    pageNotSupported: "Este tipo de página no es compatible",
    // Text-formatting toolbar (injected into the page).
    textColor: "Color del texto",
    backgroundColor: "Color de fondo",
    customColor: "Personalizado",
    customTextColor: "Color de texto personalizado",
    customBackgroundColor: "Color de fondo personalizado",
    reset: "Restablecer",
    restoreOriginalFormatting: "Restaurar el formato original",
    mixed: "Mixto",
    quotaExhaustedToast: "Se alcanzó el límite de funciones avanzadas. Se desbloquea en {reset}. Actualiza a Premium para usarlas sin límites.",
  },
  pt: {
    title: "Edit Page",
    settings: "Painel",
    chooseTool: "Selecione uma ferramenta para começar",
    editText: "Editar texto",
    editTextDesc: "Altere qualquer texto desta página",
    screenshot: "Captura de tela",
    screenshotDesc: "Capture a visualização atual ou a página inteira",
    visibleScreenshot: "Visualização atual",
    fullPageScreenshot: "Página inteira",
    preparingFullPage: "Preparando a captura da página inteira...",
    capturingFullPage: "Capturando {current} de {total}...",
    stitchingFullPage: "Montando a imagem final...",
    fullPageCaptureInProgress: "Já existe uma captura de página inteira em andamento.",
    fullPageTabChanged: "A captura foi interrompida porque você mudou de guia. Mantenha esta página ativa e tente novamente.",
    screenshotting: "Capturando...",
    statusScreenshotting: "Fazendo a captura...",
    statusScreenshotSuccess: "Captura copiada para a área de transferência!",
    statusScreenshotDownloaded: "Captura baixada!",
    savingScreenshot: "Salvando a captura...",
    statusScreenshotFailed: "Falha na captura: ",
    clipboardPermissionDenied:
      "A captura não pôde ser concluída porque a permissão da área de transferência foi negada. Clique novamente no botão de captura e escolha Permitir.",
    downloadPermissionDenied:
      "A captura não pôde ser concluída porque a permissão de download foi negada. Clique novamente no botão de captura e escolha Permitir.",
    changeImage: "Alterar imagem",
    changeImageDesc: "Envie uma imagem ou cole a URL",
    uploadLocalImage: "Enviar do dispositivo",
    imageUrlPlaceholder: "Cole a URL da imagem",
    useImageUrl: "Usar URL",
    invalidImageUrl: "Insira uma URL de imagem http ou https válida.",
    checkingImageUrl: "Verificando...",
    imageUrlNotImage: "Esta URL não aponta para uma imagem legível.",
    imageUrlDenied: "O site de origem recusou o acesso à imagem. Ele pode exigir login ou bloquear o uso externo.",
    imageUrlNotFound: "A imagem não foi encontrada. A URL pode ter expirado ou mudado.",
    imageUrlHttpError: "O site de origem retornou HTTP {status}, portanto a imagem não pôde ser lida.",
    imageUrlAccessRestricted: "O navegador não pôde acessar a imagem. O site de origem pode restringir o acesso externo.",
    imageLoadTimeout: "A imagem demorou demais para responder. Verifique a URL ou sua conexão.",
    imageReadFailed: "Não foi possível ler a imagem. O arquivo pode estar danificado, a URL pode ser inválida ou o site pode bloquear o acesso.",
    freePlan: "Versão gratuita",
    quotaExhaustedBadge: "Recursos limitados",
    editModeFailed: "Não foi possível iniciar a edição de texto nesta página.",
    replaceModeFailed: "Não foi possível iniciar o modo de substituição nesta página.",
    removeModeFailed: "Não foi possível iniciar o modo de remoção nesta página.",
    clearImage: "Limpar imagem selecionada",
    replaceMode: "Modo de substituição",
    imageSelected: 'Imagem selecionada. Clique em "Modo de substituição"',
    pleaseSelectImageFirst: "Selecione uma imagem primeiro",
    removeElement: "Remover elemento",
    removeElementDesc: "Clique em qualquer elemento para removê-lo",
    undo: "↶ Desfazer",
    redo: "↷ Refazer",
    done: "Concluir",
    changeCount: "{count} alterações",
    editWarning: "A edição pode afetar o funcionamento da página. Atualize-a para restaurar tudo.",
    connecting: "Conectando ao servidor...",
    cannotEditThisPage: "Não é possível editar esta página",
    pageNotSupported: "Este tipo de página não é compatível",
    // Text-formatting toolbar (injected into the page).
    textColor: "Cor do texto",
    backgroundColor: "Cor de fundo",
    customColor: "Personalizado",
    customTextColor: "Cor de texto personalizada",
    customBackgroundColor: "Cor de fundo personalizada",
    reset: "Redefinir",
    restoreOriginalFormatting: "Restaurar a formatação original",
    mixed: "Misto",
    quotaExhaustedToast: "O limite de recursos avançados foi atingido. Desbloqueia em {reset}. Assine o Premium para uso ilimitado.",
  },
  ja: {
    title: "Edit Page",
    settings: "ダッシュボード",
    chooseTool: "ツールを選んで開始",
    editText: "テキストを編集",
    editTextDesc: "ページ上のテキストを変更します",
    screenshot: "スクリーンショット",
    screenshotDesc: "現在の表示領域またはページ全体を撮影します",
    visibleScreenshot: "現在の表示領域",
    fullPageScreenshot: "ページ全体",
    preparingFullPage: "ページ全体の撮影を準備中...",
    capturingFullPage: "{total} 枚中 {current} 枚目を撮影中...",
    stitchingFullPage: "最終画像を合成中...",
    fullPageCaptureInProgress: "ページ全体の撮影がすでに実行中です。",
    fullPageTabChanged: "タブが切り替えられたため撮影を停止しました。このページを表示したまま再試行してください。",
    screenshotting: "撮影中...",
    statusScreenshotting: "スクリーンショットを撮影中...",
    statusScreenshotSuccess: "クリップボードにコピーしました！",
    statusScreenshotDownloaded: "スクリーンショットをダウンロードしました！",
    savingScreenshot: "スクリーンショットを保存中...",
    statusScreenshotFailed: "撮影に失敗しました: ",
    clipboardPermissionDenied:
      "クリップボードの権限が拒否されたため、スクリーンショットを完了できませんでした。もう一度スクリーンショットボタンを押し、「許可」を選択してください。",
    downloadPermissionDenied:
      "ダウンロードの権限が拒否されたため、スクリーンショットを完了できませんでした。もう一度スクリーンショットボタンを押し、「許可」を選択してください。",
    changeImage: "画像を変更",
    changeImageDesc: "画像をアップロードまたは URL を貼り付けます",
    uploadLocalImage: "デバイスからアップロード",
    imageUrlPlaceholder: "画像 URL を貼り付け",
    useImageUrl: "URL を使用",
    invalidImageUrl: "有効な http または https の画像 URL を入力してください。",
    checkingImageUrl: "確認中...",
    imageUrlNotImage: "この URL は読み込み可能な画像ではありません。",
    imageUrlDenied: "画像の提供元がアクセスを拒否しました。ログインが必要か、外部利用が制限されている可能性があります。",
    imageUrlNotFound: "画像が見つかりません。URL が無効になったか変更された可能性があります。",
    imageUrlHttpError: "提供元が HTTP {status} を返したため、画像を読み込めませんでした。",
    imageUrlAccessRestricted: "ブラウザーが画像にアクセスできませんでした。提供元が外部アクセスを制限している可能性があります。",
    imageLoadTimeout: "画像の応答に時間がかかりすぎました。URL またはネットワークを確認してください。",
    imageReadFailed: "画像を読み込めませんでした。ファイルの破損、URL の誤り、または提供元のアクセス制限が考えられます。",
    freePlan: "無料版",
    quotaExhaustedBadge: "機能制限中",
    editModeFailed: "このページでテキスト編集を開始できませんでした。",
    replaceModeFailed: "このページで画像置換モードを開始できませんでした。",
    removeModeFailed: "このページで要素削除モードを開始できませんでした。",
    clearImage: "選択した画像をクリア",
    replaceMode: "画像置換モード",
    imageSelected: "画像を選択しました。「画像置換モード」をクリックしてください",
    pleaseSelectImageFirst: "先に画像を選択してください",
    removeElement: "要素を削除",
    removeElementDesc: "ページ上の要素をクリックして削除します",
    undo: "↶ 元に戻す",
    redo: "↷ やり直す",
    done: "完了",
    changeCount: "{count} 件の変更",
    editWarning: "編集によりページの動作に影響する場合があります。完全に元に戻すにはページを再読み込みしてください。",
    connecting: "サーバーに接続中...",
    cannotEditThisPage: "このページは編集できません",
    pageNotSupported: "この種類のページには対応していません",
    // Text-formatting toolbar (injected into the page).
    textColor: "文字色",
    backgroundColor: "背景色",
    customColor: "カスタム",
    customTextColor: "カスタム文字色",
    customBackgroundColor: "カスタム背景色",
    reset: "リセット",
    restoreOriginalFormatting: "元の書式に戻す",
    mixed: "混在",
    quotaExhaustedToast: "高度な機能の上限に達しました。{reset}後に解除されます。Premium では無制限に利用できます。",
  },
  zh: {
    title: "Edit Page",
    settings: "控制面板",
    chooseTool: "选择工具即可开始",
    editText: "编辑文字",
    editTextDesc: "直接修改当前页面的文字",
    screenshot: "截图",
    screenshotDesc: "截取当前视窗或完整网页",
    visibleScreenshot: "当前视窗",
    fullPageScreenshot: "整张网页",
    preparingFullPage: "正在准备整页截图...",
    capturingFullPage: "正在截取第 {current}/{total} 段...",
    stitchingFullPage: "正在拼接完整图片...",
    fullPageCaptureInProgress: "已有一个整页截图任务正在进行。",
    fullPageTabChanged: "因切换了标签页，截图已停止。请保持当前页面激活后重试。",
    screenshotting: "截图中...",
    statusScreenshotting: "正在截图...",
    statusScreenshotSuccess: "截图已保存到剪贴板！",
    statusScreenshotDownloaded: "截图已下载！",
    savingScreenshot: "正在保存截图…",
    statusScreenshotFailed: "截图失败: ",
    clipboardPermissionDenied:
      '由于剪贴板权限被拒绝，无法完成截图。请再次点击截图按钮并选择"允许"。',
    downloadPermissionDenied:
      '由于下载权限被拒绝，无法完成截图。请再次点击截图按钮并选择"允许"。',
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
    freePlan: "免费版",
    quotaExhaustedBadge: "部分功能限制",
    editModeFailed: "无法在当前页面启动编辑文字模式。",
    replaceModeFailed: "无法在当前页面启动替换图片模式。",
    removeModeFailed: "无法在当前页面启动移除元素模式。",
    clearImage: "清除已选图片",
    replaceMode: "替换图片模式",
    imageSelected: '已选择图片，点击"替换图片模式"',
    pleaseSelectImageFirst: "请先选择图片",
    removeElement: "移除元素",
    removeElementDesc: "点击页面上的任意元素进行移除",
    undo: "↶ 撤回",
    redo: "↷ 重做",
    done: "完成",
    changeCount: "已修改 {count} 项",
    editWarning: "编辑可能影响页面功能，刷新网页可完全恢复。",
    connecting: "正在连接服务器...",
    cannotEditThisPage: "无法编辑此页面",
    pageNotSupported: "此类页面不支持编辑",
    // Text-formatting toolbar (injected into the page).
    textColor: "文字颜色",
    backgroundColor: "背景色",
    customColor: "自定义",
    customTextColor: "自定义文字颜色",
    customBackgroundColor: "自定义背景色",
    reset: "重置",
    restoreOriginalFormatting: "恢复原始格式",
    mixed: "混合",
    quotaExhaustedToast:
      "高级功能额度已用尽，{reset}后恢复。升级 Premium 可无限使用。",
    cannotEditThisPage: "无法编辑此页面",
    pageNotSupported: "此类页面不支持编辑",
  },
};

i18n["zh-CN"] = i18n.zh;
i18n["pt-BR"] = i18n.pt;
Object.assign(i18n, ADDITIONAL_POPUP_MESSAGES);
for (const locale of Object.keys(i18n)) {
  if (locale !== "en") i18n[locale] = { ...i18n.en, ...i18n[locale] };
}

let currentLang = "en";

const t = (key) => i18n[currentLang]?.[key] || i18n.en[key] || key;

// Free-tier quota feedback: humanize the time until the 12h lock lifts.
const formatResetIn = (resetsAt) => {
  const totalMinutes = Math.max(0, Math.ceil((resetsAt - Date.now()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (currentLang === "zh-CN") return `${hours} 小时 ${minutes} 分钟`;
  if (currentLang === "zh-TW") return `${hours} 小時 ${minutes} 分鐘`;
  if (currentLang === "ja") return `${hours} 時間 ${minutes} 分`;
  return `${hours} h ${minutes} min`;
};

const quotaExhaustedMessage = (state) =>
  t("quotaExhaustedToast").replace("{reset}", formatResetIn(state.lockedUntil));

document.addEventListener("DOMContentLoaded", async () => {
  // Counted before any early return: the popup surface itself is the
  // denominator for every tool, including pages that cannot be edited.
  trackTelemetryEvent("popup.open");
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
  const planBadge = document.getElementById("planBadge");
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
  // Guards the upgrade-presentation counter so it fires once per popup session.
  let upgradeShownTracked = false;
  let isEditModeTransitioning = false;
  let isReplaceMode = false;
  let isReplaceModeTransitioning = false;
  let isRemoveMode = false;
  let isRemoveModeTransitioning = false;
  const screenshotDestination = await getScreenshotDestination().catch(
    () => "clipboard",
  );

  const refreshLicenseStatus = async () => {
    await refreshPremiumState();
    if (isPremium()) {
      return true;
    }

    // A license row exists but its signature is stale (or the offline grace
    // window has lapsed) — hit Licentra to re-verify / check in.
    const result = await maybeCheckIn();
    // Only a real round-trip counts: a skipped check-in (signature still
    // fresh) and an offline-grace fallback never reached Licentra.
    if (isConfirmedCheckIn(result)) {
      trackTelemetryEvent("monetization.checkin_succeeded");
    }
    await refreshPremiumState();
    return isPremium() || result.ok === true;
  };

  // Header badge: premium hides it; free shows "Free version", or
  // "Advanced feature limit reached" (click opens Options) when any quota is out.
  const updatePlanUI = async () => {
    document.body.classList.toggle("is-premium", isPremium());

    const state = await getQuotaState();
    // A locked free tier greys out the entry points that would be refused. They
    // stay clickable on purpose: the click is what explains the limit. Premium
    // has to clear the grey too, even though it returns early below.
    // "Current viewport" screenshot is free and deliberately not in this list.
    const locked = state.limited && !isPremium();
    for (const button of [
      selectImageBtn,
      removeBtn,
      fullPageScreenshotBtn,
    ]) {
      button.classList.toggle("is-locked", locked);
    }

    if (isPremium()) {
      planBadge.style.display = "none";
      planBadge.onclick = null;
      planBadge.classList.remove("is-exhausted");
      return;
    }

    mainContent.classList.remove("hidden");

    planBadge.textContent = state.limited
      ? t("quotaExhaustedBadge")
      : t("freePlan");
    planBadge.classList.toggle("is-exhausted", state.limited);
    if (state.limited && !upgradeShownTracked) {
      // Once per popup session: the upgrade path became visible.
      upgradeShownTracked = true;
      trackTelemetryEvent("monetization.upgrade_shown");
    }
    planBadge.onclick = state.limited
      ? () => chrome.runtime.openOptionsPage()
      : null;
    planBadge.style.display = "inline-block";
  };

  const applyLanguage = () => {
    const metadata = getLanguageMetadata(currentLang);
    document.documentElement.lang = metadata.lang;
    document.documentElement.dir = metadata.dir;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t(key) !== key) {
        el.textContent = t(key);
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t(key) !== key) {
        el.setAttribute("placeholder", t(key));
      }
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (t(key) !== key) {
        el.setAttribute("aria-label", t(key));
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

  // A product action that the free-tier limit blocked. Counted once per blocked
  // action (not per render), alongside the existing explanation.
  const reportQuotaExhausted = (state) => {
    trackTelemetryEvent("monetization.free_limit_reached");
    showStatus(quotaExhaustedMessage(state), false);
  };

  const updateButton = (isEditing) => {
    // The label stays the tool's name; the switch is what shows the mode.
    editBtnLabel.textContent = t("editText");
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
        .edit-page-editing #edit-page-history-toolbar *:hover,
        .edit-page-editing #edit-page-selection-toolbar:hover {
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

        // Telemetry from the page context: only an approved event constant ever
        // leaves here — never page content, selectors or text.
        const reportTelemetry = (event) => {
          try {
            chrome.runtime
              .sendMessage({ type: "telemetry-event", event })
              ?.catch?.(() => {});
          } catch {}
        };

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

        // Shared by the operations that rewrite inline styles: a `null` value
        // means "the page had no inline value here", so the property is removed
        // and the page's own CSS applies again.
        const IMAGE_FIT_STYLE_PROPS = [
          "width",
          "height",
          "objectFit",
          "objectPosition",
          "backgroundSize",
        ];
        const RESIZE_STYLE_PROPS = [
          "width",
          "height",
          "maxWidth",
          "maxHeight",
          "backgroundSize",
        ];
        const restoreInlineStyles = (element, snapshot, props) => {
          for (const name of props) {
            const next = snapshot?.[name];
            if (next == null) {
              element.style.removeProperty(
                name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
              );
            } else {
              element.style[name] = next;
            }
          }
          if (snapshot && "marker" in snapshot) {
            if (snapshot.marker == null)
              element.removeAttribute("data-edit-page-fit");
            else element.setAttribute("data-edit-page-fit", snapshot.marker);
          }
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
                // A brand-new undo entry is a committed product action. Text
                // keystrokes that merge into the previous entry are not counted,
                // so `text.edit` stays off the per-keystroke path.
                if (operation.type === "text") reportTelemetry("text.edit");
                else if (operation.type === "image")
                  reportTelemetry("image.replace");
                else if (operation.type === "remove")
                  reportTelemetry("element.remove");
                else if (operation.type === "resize")
                  reportTelemetry("image.resize");
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
                // A replacement may also have pinned the box (see the fit
                // setting); restore that verbatim as well.
                if (value.fit) {
                  restoreInlineStyles(
                    operation.element,
                    value.fit,
                    IMAGE_FIT_STYLE_PROPS,
                  );
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
              } else if (operation.type === "format") {
                for (const record of operation.records) {
                  if (record.element?.isConnected)
                    record.element.innerHTML =
                      record[direction === "undo" ? "before" : "after"];
                }
              } else if (operation.type === "resize") {
                if (!operation.element?.isConnected) return;
                // Mirrors the snapshot the resize overlay takes: `null` means
                // "no inline value", so undo hands the element back to the
                // page's own CSS (including its `max-width`).
                restoreInlineStyles(
                  operation.element,
                  value,
                  RESIZE_STYLE_PROPS,
                );
              }
            },
            undo() {
              const operation = this.undoStack.pop();
              if (!operation) return;
              this.apply(operation, "undo");
              this.redoStack.push(operation);
              this.update();
              // Undo can move the element out from under visible handles.
              window._editPageResizeHandles?.refresh?.();
              reportTelemetry("history.undo");
            },
            redo() {
              const operation = this.redoStack.pop();
              if (!operation) return;
              this.apply(operation, "redo");
              this.undoStack.push(operation);
              this.update();
              window._editPageResizeHandles?.refresh?.();
              reportTelemetry("history.redo");
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
          window._editPageSelectionToolbar?.destroy();
          // Also ends replace mode: its teardown knows what it owns.
          window._editPageReplaceTeardown?.();
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
    if (await getSelectionToolbarEnabled()) {
      // Same labels mechanism as the history toolbar above. `locked` lets the
      // toolbar start greyed when the free tier is already out, and the short
      // badge string is what its tooltip shows — already localized everywhere.
      const quota = await getQuotaState();
      const toolbarLabels = {
        locked: quota.limited && !isPremium(),
        quotaExhausted: t("quotaExhaustedBadge"),
        // The toolbar's own strings, localized here so the page never has to
        // fall back to the English defaults baked into the content script.
        textColor: t("textColor"),
        backgroundColor: t("backgroundColor"),
        customColor: t("customColor"),
        customTextColor: t("customTextColor"),
        customBackgroundColor: t("customBackgroundColor"),
        reset: t("reset"),
        restoreOriginalFormatting: t("restoreOriginalFormatting"),
        mixed: t("mixed"),
      };
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/selection-toolbar.js"],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (labels) => window._editPageSelectionToolbarInit?.(labels),
        args: [toolbarLabels],
      });
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window._editPageSelectionToolbar?.destroy(),
      });
    }
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

  // clipboardWrite / downloads are optional permissions: only the one that
  // matches the user's current screenshot destination is requested, and only
  // from the click that starts the screenshot (never on popup open).
  const requiredScreenshotPermission = () =>
    screenshotDestination === "download"
      ? OPTIONAL_PERMISSIONS.DOWNLOADS
      : OPTIONAL_PERMISSIONS.CLIPBOARD_WRITE;

  const permissionDeniedMessage = (permission) =>
    t(
      permission === OPTIONAL_PERMISSIONS.DOWNLOADS
        ? "downloadPermissionDenied"
        : "clipboardPermissionDenied",
    );

  // Chrome tears the action popup down while an optional-permission dialog is
  // open, so the code waiting on chrome.permissions.request() never resumes.
  // The in-flight screenshot is parked in session storage (see shared.js) and
  // picked back up by resumePendingScreenshot — either because the service
  // worker reopens the popup after a grant, or when the user opens it again.
  const settlePendingScreenshot = async () => {
    await clearPendingScreenshot();
    setScreenshotBadge(false);
  };

  const ensureScreenshotPermission = async (kind) => {
    const permission = requiredScreenshotPermission();
    if (await hasOptionalPermission(permission)) return true;

    await setPendingScreenshot({ kind, permission, at: Date.now() });
    // Badge now: if the dialog closes the popup, this is the only cue the user
    // gets until they open the popup again and read the full reason.
    setScreenshotBadge(true);

    if (await requestOptionalPermission(permission)) {
      await settlePendingScreenshot();
      return true;
    }

    // Denied (or the prompt was dismissed). Drop the parked request so it can
    // never fire later, and tell the user the screenshot was skipped.
    await settlePendingScreenshot();
    showStatus(permissionDeniedMessage(permission), false);
    return false;
  };

  /** Saves the screenshot. Returns a status message, or null when the optional
   *  permission needed for the current destination was not granted. */
  const saveScreenshot = async (dataUrl, kind) => {
    if (screenshotDestination === "download") {
      if (!(await ensureScreenshotPermission(kind))) return null;
      await chrome.downloads.download({
        url: dataUrl,
        filename: screenshotFilename(kind),
        saveAs: false,
      });
      trackTelemetryEvent("screenshot.download");
      return t("statusScreenshotDownloaded");
    }
    if (!(await ensureScreenshotPermission(kind))) return null;
    await copyScreenshotToClipboard(dataUrl);
    trackTelemetryEvent("screenshot.copy");
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
      // Counts the completed capture; where it is saved is a separate event.
      trackTelemetryEvent("screenshot.viewport");

      const successMessage = await saveScreenshot(dataUrl, "viewport");
      if (successMessage) showStatus(successMessage, true);
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
        const localizedError = {
          capture_in_progress: t("fullPageCaptureInProgress"),
          tab_changed: t("fullPageTabChanged"),
        }[result?.errorCode];
        throw new Error(
          localizedError || result?.error || "Full-page capture failed",
        );
      }

      // Counts the completed capture; where it is saved is a separate event.
      trackTelemetryEvent("screenshot.fullpage");
      const successMessage = await saveScreenshot(result.dataUrl, "full-page");
      // Permission denied: one attempt was already started; keep the error
      // message shown by saveScreenshot and report the capture as not saved.
      if (!successMessage) return false;
      captureProgressBar.style.width = "100%";
      captureProgressText.textContent = successMessage;
      showStatus(successMessage, true);
      return true;
    } catch (error) {
      console.error("Full-page screenshot failed:", error);
      showStatus(t("statusScreenshotFailed") + error.message, false);
      return false;
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

  // The page keeps its own copies of the picture and the fit mode
  // (`window._editPageReplaceImage` / `_editPageReplaceFit`) and only refreshed
  // them when replace mode started. Changing either while the mode was already
  // running therefore left every replacement pasting the previous picture, or
  // using the previous fit. Push the current selection over whenever it
  // changes; the guard inside the injected function keeps this to pages that
  // really are in replace mode, so no stray globals are created anywhere else.
  const syncReplaceSelectionToPage = async (imageData, fitMode) => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (data, fit) => {
          if (!window._editPageReplaceHandler) return;
          if (window._editPageReplaceImage !== data) {
            window._editPageReplaceImage = data;
          }
          if (fit && window._editPageReplaceFit !== fit) {
            window._editPageReplaceFit = fit;
          }
        },
        args: [imageData, fitMode ?? null],
      });
    } catch (e) {}
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
    // The label stays the tool's name; the switch is what shows the mode.
    removeBtnLabel.textContent = t("removeElement");
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

        // One free use per element actually removed. The quota must never break
        // the feature: an unavailable, stale, or unresponsive service worker —
        // a stale worker after an update, for example — lets the removal
        // through uncharged instead of silently doing nothing.
        const claimRemoveUse = async () => {
          try {
            const response = await Promise.race([
              chrome.runtime.sendMessage({
                type: "claim-feature-use",
                feature: "removeElement",
              }),
              new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
            ]);
            return response?.allowed !== false;
          } catch {
            return true;
          }
        };

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

        window._editPageRemoveClickHandler = async (event) => {
          if (!canRemove(event.target)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          // Charged only when the element is actually removed.
          if (!(await claimRemoveUse())) {
            console.warn("Edit Page: the free remove allowance is used up.");
            return;
          }
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
    // The label stays the tool's name; the switch is what shows the mode.
    replaceImageBtnLabel.textContent = t("replaceMode");
    // No `active` class here on purpose: popup.css still carries legacy global
    // `button.active` rules (a red fill) that would leak onto this row. The
    // mode is expressed through aria-pressed and the card's `is-replacing`.
    replaceImageBtn.setAttribute("aria-pressed", String(isReplaceMode));
    replaceImageBtn
      .closest(".image-section")
      ?.classList.toggle("is-replacing", isReplaceMode);
  };

  const clearImage = async () => {
    selectedImageData = null;
    imageUrlInput.value = "";
    imageUrlInput.removeAttribute("aria-invalid");
    imagePreview.classList.add("hidden");
    previewImg.src = "";
    replaceImageBtn.classList.add("hidden");
    await saveImageData(null);
    // Defensive: if the page is still in replace mode without this popup
    // knowing, it must not keep pasting the picture that was just cleared.
    void syncReplaceSelectionToPage(null);
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

    // Read once per entry; it is applied when a replacement actually happens.
    const fit = await getReplaceImageFit();

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (imageData, fitMode) => {
        if (window._editPageReplaceHandler) {
          window._editPageReplaceImage = imageData;
          window._editPageReplaceFit = fitMode;
          document.body.classList.add("edit-page-replace-mode");
          return;
        }

        window._editPageReplaceImage = imageData;
        window._editPageReplaceFit = fitMode;

        // Resolve the target strictly by geometry: only something actually under
        // the pointer may be replaced. Resolving from `e.target` and
        // `querySelector('img')` picked, for a click on empty space inside a
        // layout container, whichever image happened to be that container's
        // first descendant — an image the user never pointed at.
        const resolveReplaceTarget = (x, y) => {
          const stack = document
            .elementsFromPoint(x, y)
            .filter(
              (element) =>
                !element.closest(
                  `#edit-page-history-toolbar, #${resizeOverlayId}`,
                ),
            );
          for (const element of stack) {
            if (element.tagName === "IMG") return element;
          }
          for (const element of stack) {
            // Computed, not inline: a picture set from a stylesheet is just as
            // much a picture to the user, and telling the two apart is not their
            // job. A layer mix such as `url(a.png), linear-gradient(...)` still
            // counts; a pure gradient does not, because it is not a picture.
            const background = window.getComputedStyle(element).backgroundImage;
            if (/url\(/i.test(background || "")) return element;
          }
          return null;
        };

        // ── how a replacement is fitted ──────────────────────────────────────
        // `cover` pins the element to the box the previous picture occupied and
        // crops the new one into it, so a layout the user liked keeps its shape.
        // `natural` hands sizing back to the page, which is what the extension
        // did before the setting existed. Whatever we pin is marked on the
        // element, so a later `natural` replacement clears our own pin and never
        // touches inline styles the page itself set.
        const FIT_MARKER = "data-edit-page-fit";
        const FIT_STYLE_PROPS = [
          "width",
          "height",
          "objectFit",
          "objectPosition",
          "backgroundSize",
        ];

        const readFitStyles = (element) => ({
          ...Object.fromEntries(
            FIT_STYLE_PROPS.map((name) => [name, element.style[name] || null]),
          ),
          marker: element.getAttribute(FIT_MARKER),
        });

        const forEachFitProp = (element, apply) => {
          for (const name of FIT_STYLE_PROPS) {
            apply(name, name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
          }
        };

        const writeFitStyles = (element, snapshot) => {
          forEachFitProp(element, (name, property) => {
            const value = snapshot?.[name];
            if (value == null) element.style.removeProperty(property);
            else element.style[name] = value;
          });
          if (snapshot?.marker == null) element.removeAttribute(FIT_MARKER);
          else element.setAttribute(FIT_MARKER, snapshot.marker);
        };

        // `box` is measured before the source changes, so it is the box the old
        // picture occupied rather than whatever the new one is about to claim.
        const applyReplaceFit = (element, box) => {
          const isImage = element.tagName === "IMG";
          if (window._editPageReplaceFit === "cover") {
            if (isImage) {
              if (!box || box.width <= 0 || box.height <= 0) return;
              element.style.width = `${Math.round(box.width * 100) / 100}px`;
              element.style.height = `${Math.round(box.height * 100) / 100}px`;
              element.style.objectFit = "cover";
              element.style.objectPosition = "center";
            } else {
              // The element's box is already the one the old picture occupied;
              // only the picture inside it has to be told to fill that box.
              element.style.backgroundSize = "cover";
            }
            element.setAttribute(FIT_MARKER, "cover");
            return;
          }
          if (element.getAttribute(FIT_MARKER) !== "cover") return;
          forEachFitProp(element, (name, property) =>
            element.style.removeProperty(property),
          );
          element.removeAttribute(FIT_MARKER);
        };

        // The injected stylesheet outlines everything it can match, so all
        // replaceable images are marked up front. This handler adds the one case
        // a stylesheet selector cannot reach — a background image set from a
        // class — using the same resolver the click uses, so the outline always
        // shows exactly what a click would replace.
        let highlightedElement = null;
        const clearReplaceHighlight = () => {
          if (!highlightedElement) return;
          highlightedElement.style.removeProperty("outline");
          highlightedElement.style.removeProperty("outline-offset");
          highlightedElement.style.removeProperty("cursor");
          highlightedElement = null;
        };

        window._editPageReplaceHoverHandler = (event) => {
          const target = resolveReplaceTarget(event.clientX, event.clientY);
          if (target === highlightedElement) return;
          clearReplaceHighlight();
          if (!target) return;
          highlightedElement = target;
          target.style.setProperty("cursor", "crosshair", "important");
          // `img` and inline-url elements are already outlined by the injected
          // stylesheet, which also owns their hover colour; an inline outline
          // would pin them to a single colour. Only a target that a stylesheet
          // selector cannot reach is outlined here, in the hover colour.
          const outlinedByCss =
            target.tagName === "IMG" ||
            /url\(/i.test(target.style.backgroundImage || "");
          if (!outlinedByCss) {
            target.style.setProperty("outline", "2px dashed #e74c3c", "important");
            target.style.setProperty("outline-offset", "2px", "important");
          }
        };

        // Leaving the window must not leave an outline behind.
        window._editPageReplaceLeaveHandler = (event) => {
          if (!event.relatedTarget) clearReplaceHighlight();
        };

        // ── resize handles ───────────────────────────────────────────────────
        // Only an element the user just replaced gets handles; the page's own
        // images are left alone. The overlay hangs off documentElement so page
        // styles cannot clip it, and it carries no text, so no new locale
        // strings are involved.

        const resizeStylesId = "edit-page-resize-styles";
        const resizeOverlayId = "edit-page-resize-overlay";
        const MIN_RESIZE_PX = 16;
        // A drag can end with the pointer off the handle — the picture grows
        // away from it — and the browser then fires a click on whatever ancestor
        // sits under the pointer. That click belongs to the drag, not to a new
        // replacement request, so it is swallowed exactly once.
        let replaceClickGuardUntil = 0;
        // Snapshotted and restored verbatim: `null` means "no inline value",
        // which is what makes undo hand the element back to the page's own CSS.
        const RESIZE_STYLE_PROPS = [
          "width",
          "height",
          "maxWidth",
          "maxHeight",
          "backgroundSize",
        ];
        const HANDLE_SPOTS = {
          nw: [0, 0],
          n: [50, 0],
          ne: [100, 0],
          e: [100, 50],
          se: [100, 100],
          s: [50, 100],
          sw: [0, 100],
          w: [0, 50],
        };
        const HANDLE_CURSORS = {
          nw: "nwse-resize",
          n: "ns-resize",
          ne: "nesw-resize",
          e: "ew-resize",
          se: "nwse-resize",
          s: "ns-resize",
          sw: "nesw-resize",
          w: "ew-resize",
        };

        const kebabCase = (name) =>
          name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

        const readResizeStyles = (element) =>
          Object.fromEntries(
            RESIZE_STYLE_PROPS.map((name) => [name, element.style[name] || null]),
          );

        const writeResizeStyles = (element, snapshot) => {
          for (const name of RESIZE_STYLE_PROPS) {
            const value = snapshot?.[name];
            if (value == null) element.style.removeProperty(kebabCase(name));
            else element.style[name] = value;
          }
        };

        const ensureResizeStyles = () => {
          let style = document.getElementById(resizeStylesId);
          if (!style) {
            style = document.createElement("style");
            style.id = resizeStylesId;
            document.head.appendChild(style);
          }
          style.textContent = `
            #${resizeOverlayId} {
              position: fixed !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 1px solid #4f46e5 !important;
              box-sizing: border-box !important;
              box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.65) !important;
              pointer-events: none !important;
              z-index: 2147483647 !important;
            }
            #${resizeOverlayId} .edit-page-resize-handle {
              position: absolute !important;
              width: 11px !important;
              height: 11px !important;
              margin: -6px 0 0 -6px !important;
              background: #fff !important;
              border: 2px solid #4f46e5 !important;
              border-radius: 3px !important;
              box-sizing: border-box !important;
              box-shadow: 0 1px 3px rgba(15, 23, 42, 0.35) !important;
              pointer-events: auto !important;
            }
            ${Object.entries(HANDLE_CURSORS)
              .map(
                ([direction, cursor]) =>
                  `#${resizeOverlayId} [data-direction="${direction}"] { cursor: ${cursor} !important; }`,
              )
              .join("\n            ")}
          `;
        };

        const createResizeHandles = (element) => {
          ensureResizeStyles();
          document.getElementById(resizeOverlayId)?.remove();

          let drag = null;
          let observedSize = null;

          const overlay = document.createElement("div");
          overlay.id = resizeOverlayId;
          overlay.contentEditable = "false";
          for (const [direction, spot] of Object.entries(HANDLE_SPOTS)) {
            const handle = document.createElement("div");
            handle.className = "edit-page-resize-handle";
            handle.dataset.direction = direction;
            handle.style.left = `${spot[0]}%`;
            handle.style.top = `${spot[1]}%`;
            overlay.appendChild(handle);
          }
          document.documentElement.appendChild(overlay);

          const refresh = () => {
            if (!element.isConnected) {
              destroy();
              return;
            }
            const rect = element.getBoundingClientRect();
            overlay.style.left = `${rect.left}px`;
            overlay.style.top = `${rect.top}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
          };

          const applySize = (width, height) => {
            // Never collapse an axis, but never grow one either: an element
            // smaller than the minimum must still be able to shrink on its own.
            const floorFor = (baseline) => Math.min(MIN_RESIZE_PX, baseline);
            // Sub-pixel precision: rounding to whole pixels would let repeated
            // corner drags chip away at the aspect ratio.
            const round = (value) => Math.round(value * 100) / 100;
            element.style.width = `${round(Math.max(width, floorFor(drag.width)))}px`;
            element.style.height = `${round(Math.max(height, floorFor(drag.height)))}px`;
            // Sites commonly cap images with `max-width: 100%`, which would
            // silently swallow every drag that grows the element.
            element.style.maxWidth = "none";
            element.style.maxHeight = "none";
            refresh();
          };

          const onDragMove = (event) => {
            if (!drag) return;
            const dx = event.clientX - drag.startX;
            const dy = event.clientY - drag.startY;
            const horizontal = drag.direction.includes("e")
              ? 1
              : drag.direction.includes("w")
                ? -1
                : 0;
            const vertical = drag.direction.includes("s")
              ? 1
              : drag.direction.includes("n")
                ? -1
                : 0;

            // A corner keeps the aspect ratio, an edge stretches one axis only;
            // Alt inverts whichever default applies to the handle being dragged.
            const isCorner = drag.direction.length === 2;
            const keepRatio = isCorner ? !event.altKey : event.altKey;

            if (!keepRatio) {
              applySize(
                horizontal ? drag.width + horizontal * dx : drag.width,
                vertical ? drag.height + vertical * dy : drag.height,
              );
              return;
            }

            // Proportional: a corner follows the dominant axis, an edge scales
            // both dimensions off the single axis the user is dragging.
            const byWidth = horizontal
              ? (drag.width + horizontal * dx) / drag.width
              : 0;
            const byHeight = vertical
              ? (drag.height + vertical * dy) / drag.height
              : 0;
            const smallest = Math.min(drag.width, drag.height);
            const floor = Math.min(MIN_RESIZE_PX, smallest) / smallest;
            const scale = Math.max(byWidth, byHeight, floor);
            applySize(drag.width * scale, drag.height * scale);
          };

          const finishDrag = (commit) => {
            if (!drag) return;
            const started = drag;
            drag = null;
            document.removeEventListener("mousemove", onDragMove, true);
            document.removeEventListener("mouseup", onDragEnd, true);
            document.removeEventListener("keydown", onDragKey, true);

            const after = readResizeStyles(element);
            const changed = RESIZE_STYLE_PROPS.some(
              (name) => started.before[name] !== after[name],
            );
            // A resize pulled the picture out from under the pointer, so the
            // browser fires a click on whatever ancestor ends up beneath it.
            // That click belongs to the drag and is swallowed exactly once —
            // only when the pointer actually left the handle, so an ordinary
            // click on a handle never eats the next genuine one.
            if (changed) replaceClickGuardUntil = Date.now() + 400;
            if (!commit || !changed) {
              writeResizeStyles(element, started.before);
              refresh();
              return;
            }
            // One drag is one undo step; intermediate frames are never pushed.
            window._editPageHistory?.push({
              type: "resize",
              element,
              before: started.before,
              after,
              time: Date.now(),
            });
            refresh();
          };

          const onDragEnd = () => finishDrag(true);

          const onDragKey = (event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            finishDrag(false);
          };

          const onHandleMouseDown = (event) => {
            const handle =
              event.target instanceof Element
                ? event.target.closest(".edit-page-resize-handle")
                : null;
            if (!handle) return;
            const rect = element.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            drag = {
              direction: handle.dataset.direction,
              startX: event.clientX,
              startY: event.clientY,
              width: rect.width,
              height: rect.height,
              before: readResizeStyles(element),
            };
            // A background picture only follows its box when told to; without
            // this, dragging the box just reveals more of the original tiling.
            if (element.tagName !== "IMG")
              element.style.backgroundSize = "100% 100%";

            document.addEventListener("mousemove", onDragMove, true);
            document.addEventListener("mouseup", onDragEnd, true);
            document.addEventListener("keydown", onDragKey, true);
          };

          // Clicking elsewhere drops the handles; clicking the element itself
          // keeps them, so the picture can be resized again straight away.
          const onOutsideMouseDown = (event) => {
            if (!(event.target instanceof Node)) return;
            if (overlay.contains(event.target)) return;
            if (element === event.target || element.contains(event.target))
              return;
            destroy();
          };

          function destroy() {
            finishDrag(false);
            observedSize?.disconnect();
            observedSize = null;
            overlay.removeEventListener("mousedown", onHandleMouseDown, true);
            document.removeEventListener("mousedown", onOutsideMouseDown, true);
            window.removeEventListener("scroll", refresh, true);
            window.removeEventListener("resize", refresh);
            overlay.remove();
            if (window._editPageResizeHandles?.destroy === destroy)
              window._editPageResizeHandles = null;
          }

          overlay.addEventListener("mousedown", onHandleMouseDown, true);
          document.addEventListener("mousedown", onOutsideMouseDown, true);
          window.addEventListener("scroll", refresh, true);
          window.addEventListener("resize", refresh);
          // The picture's box changes the moment its new source finishes
          // loading, which happens after the handles are first placed. Watching
          // the element keeps the frame on the picture instead of leaving it on
          // the box the pre-replacement image occupied.
          if (typeof ResizeObserver === "function") {
            observedSize = new ResizeObserver(() => refresh());
            observedSize.observe(element);
          }
          refresh();

          return { element, refresh, destroy };
        };

        const showResizeHandles = (element) => {
          if (window._editPageResizeHandles?.element === element) {
            window._editPageResizeHandles.refresh();
            return;
          }
          window._editPageResizeHandles?.destroy?.();
          window._editPageResizeHandles = createResizeHandles(element);
        };

        // One free use per replacement that actually lands. Same contract as the
        // remove flow: the quota must never break the feature, so a missing or
        // unresponsive service worker lets the replacement through uncharged.
        const claimReplaceUse = async () => {
          try {
            const response = await Promise.race([
              chrome.runtime.sendMessage({
                type: "claim-feature-use",
                feature: "replaceImage",
              }),
              new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
            ]);
            return response?.allowed !== false;
          } catch {
            return true;
          }
        };

        window._editPageReplaceHandler = async (e) => {
          if (!window._editPageReplaceImage) return;
          // The click a resize drag leaves behind must not replace anything.
          if (Date.now() < replaceClickGuardUntil) {
            replaceClickGuardUntil = 0;
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
          if (
            e.target instanceof Element &&
            // A drag on a handle sits right on top of the picture, so it must
            // not be read as "replace this element" a second time.
            e.target.closest(
              `#edit-page-history-toolbar, #${resizeOverlayId}`,
            )
          )
            return;

          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const img = resolveReplaceTarget(e.clientX, e.clientY);

          if (img) {
            // Charged per replacement that actually lands. Resizing stays free.
            if (!(await claimReplaceUse())) {
              console.warn(
                "Edit Page: the free image replacement allowance is used up.",
              );
              return;
            }
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
              // Measured before the source changes: this is the box the old
              // picture occupied, and `cover` pins the element to it.
              const box = img.getBoundingClientRect();
              const beforeFit = readFitStyles(img);
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
              applyReplaceFit(img, box);
              window._editPageHistory?.push({
                type: "image",
                imageKind: "img",
                element: img,
                sources,
                before: { ...before, fit: beforeFit },
                after: { ...snapshot(), fit: readFitStyles(img) },
                time: Date.now(),
              });
            } else {
              const before = { backgroundImage: img.style.backgroundImage };
              const beforeFit = readFitStyles(img);
              img.style.backgroundImage = `url(${window._editPageReplaceImage})`;
              applyReplaceFit(img);
              window._editPageHistory?.push({
                type: "image",
                imageKind: "background",
                element: img,
                sources: [],
                before: { ...before, fit: beforeFit },
                after: {
                  backgroundImage: img.style.backgroundImage,
                  fit: readFitStyles(img),
                },
                time: Date.now(),
              });
            }
            // The picture is now resizable: the handles appear on the element
            // that was just replaced, immediately, with no extra click.
            showResizeHandles(img);
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
        document.addEventListener(
          "mouseover",
          window._editPageReplaceHoverHandler,
          true,
        );
        document.addEventListener(
          "mouseout",
          window._editPageReplaceLeaveHandler,
          true,
        );
        document.body.classList.add("edit-page-replace-mode");

        // One teardown for everything this mode owns — listeners, highlight and
        // resize handles — so no caller has to know which parts belong to it.
        window._editPageReplaceTeardown = () => {
          clearReplaceHighlight();
          for (const [type, handler] of [
            ["click", window._editPageReplaceHandler],
            ["mousedown", window._editPageReplaceMouseDownHandler],
            ["mouseover", window._editPageReplaceHoverHandler],
            ["mouseout", window._editPageReplaceLeaveHandler],
          ]) {
            if (handler) document.removeEventListener(type, handler, true);
          }
          window._editPageReplaceHandler = null;
          window._editPageReplaceMouseDownHandler = null;
          window._editPageReplaceHoverHandler = null;
          window._editPageReplaceLeaveHandler = null;
          window._editPageReplaceImage = null;
          window._editPageReplaceTeardown = null;
          window._editPageResizeHandles?.destroy?.();
          document.body.classList.remove("edit-page-replace-mode");
        };
      },
      args: [selectedImageData, fit],
    });

    // CSS outlines everything it can match, so every replaceable image is
    // visible at a glance; the JS highlighter adds the one case a stylesheet
    // selector cannot reach (a background image set from a class).
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .edit-page-replace-mode * {
          pointer-events: auto !important;
        }
        .edit-page-replace-mode img,
        .edit-page-replace-mode [style*='url('] {
          cursor: crosshair !important;
          outline: 2px dashed #e67e22 !important;
          outline-offset: 2px !important;
        }
        .edit-page-replace-mode img:hover,
        .edit-page-replace-mode [style*='url(']:hover {
          outline-color: #e74c3c !important;
        }
      `,
    });
  };

  // The one way into replace mode. Shared by the switch and by the automatic
  // entry that follows a successful import, so both behave identically: quota
  // gate, history manager, other modes stopped, telemetry counted once.
  // `countTelemetry` is the caller's "this was a real user click" answer: the
  // automatic entry after an import must not count as a tool entry.
  // Returns true when replace mode is running (including "already was").
  const enterReplaceMode = async (countTelemetry) => {
    if (isReplaceMode) return true;
    if (!selectedImageData) return false;
    // Entering the mode is free, but a locked free tier cannot act on the page:
    // say so here instead of letting each replacement be refused later on.
    if (!isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        reportQuotaExhausted(state);
        return false;
      }
    }
    await ensureHistoryManager();
    await stopEditMode();
    if (isRemoveMode) {
      await stopRemoveMode();
      isRemoveMode = false;
      updateRemoveButton();
    }
    await startReplaceMode();
    isReplaceMode = true;
    updateReplaceButton();
    // Only an inactive -> active transition the user asked for counts, and only
    // once the mode actually started.
    if (countTelemetry) trackTelemetryEvent("image.replace.start");
    return true;
  };

  const stopReplaceMode = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window._editPageReplaceTeardown?.();
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

  clearTimeout(startupStatusTimer);

  await updatePlanUI();
  statusDiv.classList.remove("visible");

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

  // The service worker parks a notice when the free tier locks (or refuses a
  // page-side action) and tries to open this popup. Leave whatever mode the page
  // is in, explain the limit, and remember the notice so auto-start does not
  // walk straight back into a mode.
  const quotaNotice = await getPendingQuotaNotice();
  if (quotaNotice) {
    await clearPendingQuotaNotice();
    if (isEditing) await stopEditMode();
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
    const state = await getQuotaState();
    // Only a genuinely refused action counts as "limit reached"; the action that
    // merely used up the last allowance is announced without that count.
    if (quotaNotice.blocked) reportQuotaExhausted(state);
    else showStatus(quotaExhaustedMessage(state), false);
  }

  // Replace mode is running on the page: open the panel so the picture and the
  // switch that is currently on are both in view, instead of a collapsed card
  // whose only affordance is a chevron.
  if (isReplaceMode) {
    selectImageBtn.setAttribute("aria-expanded", "true");
    imageSourceOptions.classList.remove("hidden");
  }

  editBtn.addEventListener("click", async (event) => {
    if (isEditModeTransitioning) return;
    isEditModeTransitioning = true;
    editBtn.disabled = true;
    editBtn.setAttribute("aria-busy", "true");
    try {
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
      if (newIsEditing && willEnableEdit && event.isTrusted) {
        // Only an inactive -> active transition the user asked for counts;
        // re-clicking while already editing does not, and neither does the
        // Dashboard's automatic entry — `editBtn.click()` is untrusted.
        trackTelemetryEvent("edit.start");
      }
      if (!newIsEditing) {
        await finishEditingSession();
      }
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

  const runVisibleScreenshot = async () => {
    // Ask for clipboardWrite / downloads first: the permission prompt needs
    // the click's user gesture, which later awaits would consume.
    if (!(await ensureScreenshotPermission("viewport"))) return;
    await prepareForScreenshot();
    await takeVisibleScreenshot();
  };

  const runFullPageScreenshot = async () => {
    let billUse = false;
    if (!isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        reportQuotaExhausted(state);
        return;
      }
      billUse = true;
    }
    if (!(await ensureScreenshotPermission("full-page"))) return;
    await prepareForScreenshot();
    const captured = await takeFullPageScreenshot();
    // Only bill the free allowance for completed captures.
    if (captured && billUse) {
      const state = await consumeFeatureUse("fullPageScreenshot");
      // This capture used up the allowance: say so while the popup is still
      // open. It was allowed, so it is not a "limit reached" event.
      if (state?.limited) showStatus(quotaExhaustedMessage(state), false);
    }
    await updatePlanUI();
  };

  /**
   * Finishes a screenshot whose permission prompt closed the popup: granted →
   * run the action the user had started, denied → explain that it was skipped.
   * Called once, right after the popup has finished initializing.
   */
  const resumePendingScreenshot = async () => {
    // getPendingScreenshot() drops entries past their TTL, so a stale request
    // from an earlier session is ignored instead of firing out of nowhere.
    const pending = await getPendingScreenshot();

    // The popup is open and readable now, so the badge has done its job —
    // whether the pending request is resolved here or was denied.
    await settlePendingScreenshot();
    if (!pending) return;

    const permission = pending.permission || requiredScreenshotPermission();
    if (!(await hasOptionalPermission(permission))) {
      showStatus(permissionDeniedMessage(permission), false);
      return;
    }

    if (pending.kind === "viewport") {
      await runVisibleScreenshot();
    } else if (pending.kind === "full-page") {
      await runFullPageScreenshot();
    }
  };

  screenshotBtn.addEventListener("click", () => {
    const expanded = screenshotBtn.getAttribute("aria-expanded") === "true";
    screenshotBtn.setAttribute("aria-expanded", String(!expanded));
    screenshotOptions.classList.toggle("hidden", expanded);
  });

  visibleScreenshotBtn.addEventListener("click", () => {
    void runVisibleScreenshot();
  });

  fullPageScreenshotBtn.addEventListener("click", () => {
    void runFullPageScreenshot();
  });

  const setSelectedImage = async (imageSource, source) => {
    // Advanced-feature quota: importing is free, but a locked free tier cannot
    // import at all — each replacement that actually lands is what spends an
    // allowance, and the injected page code charges it at that moment.
    if (!isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        reportQuotaExhausted(state);
        return;
      }
    }
    selectedImageData = imageSource;
    previewImg.src = imageSource;
    imagePreview.classList.remove("hidden");
    replaceImageBtn.classList.remove("hidden");
    // The preview is one of the expanded panel's contents now, so the panel has
    // to stay open — collapsing here would hide the image just imported.
    await saveImageData(imageSource);
    // Replace mode may already be running on this page: hand it the new picture
    // (and the current fit) now, or the next click would still paste the
    // previous one.
    void syncReplaceSelectionToPage(imageSource, await getReplaceImageFit());
    // An imported picture is only ever wanted for one thing: go straight into
    // replace mode, through the same path the switch uses. If that is not
    // possible (a transition is already running, or the tier is used up), the
    // old instruction to press the switch is still the right thing to show.
    if (!isReplaceModeTransitioning) {
      // Automatic entry: no user click on a tool entry, so it is not counted.
      if (await enterReplaceMode(false)) return;
    }
    showStatus(t("imageSelected"), true);
    // Counted after the quota gate: an import blocked by the free-tier limit is
    // not an accepted import (`monetization.free_limit_reached` covers that),
    // and one accepted import counts once however many elements it later
    // replaces.
    trackTelemetryEvent(
      source === "local" ? "image.import_local" : "image.import_url",
    );
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
    const isExpanded =
      selectImageBtn.getAttribute("aria-expanded") === "true";
    // Explain the limit right here instead of after the user has picked a file: a
    // locked free tier cannot import at all, so there is nothing to expand into.
    if (!isExpanded && !isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        reportQuotaExhausted(state);
        return;
      }
    }
    selectImageBtn.setAttribute("aria-expanded", String(!isExpanded));
    imageSourceOptions.classList.toggle("hidden", isExpanded);
  });

  uploadImageBtn.addEventListener("click", () => {
    imageInput.click();
  });

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    // Reset right away: a file input keeps its value, so picking the same file
    // again fires no change event at all and the previous image would silently
    // stay selected.
    e.target.value = "";
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageSource = event.target.result;
        const loadResult = await testImageLoad(imageSource);
        if (!loadResult.ok) {
          showStatus(t("imageReadFailed"), false);
          imageInput.value = "";
          trackTelemetryEvent("image.import_local_failed");
          return;
        }
        await setSelectedImage(imageSource, "local");
      };
      reader.onerror = () => {
        showStatus(t("imageReadFailed"), false);
        imageInput.value = "";
        trackTelemetryEvent("image.import_local_failed");
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
      // An empty input is a dead end, not a failed import; a non-empty value
      // that is not a usable http(s) URL is one.
      if (imageUrlInput.value.trim()) {
        trackTelemetryEvent("image.import_url_failed");
      }
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
        trackTelemetryEvent("image.import_url_failed");
        return;
      }
      imageUrlInput.removeAttribute("aria-invalid");
      await setSelectedImage(imageUrl, "url");
    } catch (error) {
      console.error("Failed to validate image URL", error);
      showStatus(t("imageReadFailed"), false);
      trackTelemetryEvent("image.import_url_failed");
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

  replaceImageBtn.addEventListener("click", async (event) => {
    if (isReplaceModeTransitioning) return;
    if (!selectedImageData) {
      showStatus(t("pleaseSelectImageFirst"), false);
      return;
    }
    isReplaceModeTransitioning = true;
    replaceImageBtn.disabled = true;
    replaceImageBtn.setAttribute("aria-busy", "true");
    try {
      if (isReplaceMode) {
        await stopReplaceMode();
        await finishEditingSession();
        isReplaceMode = false;
        updateReplaceButton();
      } else {
        // A programmatic click (there is none today) would carry isTrusted
        // false and correctly not count.
        await enterReplaceMode(event.isTrusted);
      }
    } catch (error) {
      console.error("Failed to toggle replacement mode", error);
      showStatus(t("replaceModeFailed"), false);
    } finally {
      isReplaceModeTransitioning = false;
      replaceImageBtn.disabled = false;
      replaceImageBtn.removeAttribute("aria-busy");
    }
  });

  removeBtn.addEventListener("click", async (event) => {
    if (isRemoveModeTransitioning) return;
    const nextRemoveMode = !isRemoveMode;
    // Advanced-feature quota: entering remove mode is free, but a locked free
    // tier cannot enter at all — each element actually removed spends an
    // allowance, charged by the injected page code at that moment.
    if (nextRemoveMode && !isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        reportQuotaExhausted(state);
        return;
      }
    }
    isRemoveModeTransitioning = true;
    removeBtn.disabled = true;
    removeBtn.setAttribute("aria-busy", "true");
    try {
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
      // Only an inactive -> active transition that actually started and that
      // the user asked for counts; `removeBtn.click()` from the Dashboard's
      // automatic entry is untrusted and must not count.
      if (nextRemoveMode && event.isTrusted) {
        trackTelemetryEvent("remove.start");
      }
      await updatePlanUI();
    } catch (error) {
      console.error("Failed to toggle remove mode", error);
      showStatus(t("removeModeFailed"), false);
    } finally {
      isRemoveModeTransitioning = false;
      removeBtn.disabled = false;
      removeBtn.removeAttribute("aria-busy");
    }
  });

  // Auto-start the tool chosen in the Dashboard — but only on an editable page,
  // only when no mode is already active, and never while a screenshot is
  // waiting to be resumed (prepareForScreenshot() would undo it immediately).
  // Remove mode spends a free allowance, so a locked free tier is skipped
  // silently instead of toasting on every popup open.
  const pendingScreenshot = await getPendingScreenshot();
  const autoEnterMode = await getAutoEnterMode();
  if (
    !quotaNotice &&
    !pendingScreenshot &&
    !isEditing &&
    !isReplaceMode &&
    !isRemoveMode
  ) {
    if (autoEnterMode === "edit") {
      editBtn.click();
    } else if (autoEnterMode === "remove") {
      const quota = await getQuotaState();
      if (isPremium() || !quota.limited) removeBtn.click();
    }
  }

  // Runs last so every control above is already wired up: if the permission
  // dialog closed the popup during a previous attempt, finish that screenshot
  // now (or report that it was denied).
  resumePendingScreenshot().catch(() => {});
});
