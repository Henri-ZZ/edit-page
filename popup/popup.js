// Premium state uses the shared Licentra client. Activation lives on the
// settings page; the popup only refreshes license state for feature gating.
import { maybeCheckIn } from "../license.js";
import {
  ADDITIONAL_POPUP_MESSAGES,
  getLanguageMetadata,
} from "../i18n/locales.js";
import {
  consumeFeatureUse,
  getQuotaState,
  getScreenshotDestination,
  isPremium,
  refreshPremiumState,
  resolveLanguage,
} from "../shared.js";

const i18n = {
  en: {
    title: "Edit Page",
    settings: "Dashboard",
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
    fullPageCaptureInProgress: "A full-page screenshot is already in progress.",
    fullPageTabChanged:
      "The screenshot stopped because you switched tabs. Keep this page active and try again.",
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
    freePlan: "Free version",
    quotaExhaustedBadge: "Features limited",
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
    unlockNow: "Unlock Now",
    unlockLicense: "Unlock with License",
    licensePlaceholder: "Enter License Key",
    licenseFormatHint: "Format: ABCD-2345-EFGH-6789",
    licenseFormatError:
      "License Key format should look like ABCD-2345-EFGH-6789.",
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
    quotaExhaustedToast:
      "Advanced feature limit reached. Unlocks in {reset}. Upgrade to Premium for unlimited use.",
  },
  es: {
    title: "Edit Page",
    settings: "Panel",
    chooseTool: "Elige una herramienta",
    editText: "Editar texto",
    editTextDesc: "Cambia cualquier texto de esta página",
    exitEdit: "Salir de la edición",
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
    exitReplaceMode: "Salir del modo de reemplazo",
    imageSelected: 'Imagen seleccionada. Haz clic en "Modo de reemplazo"',
    pleaseSelectImageFirst: "Selecciona primero una imagen",
    removeElement: "Eliminar elemento",
    removeElementDesc: "Haz clic en cualquier elemento para eliminarlo",
    exitRemoveMode: "Salir del modo de eliminación",
    undo: "↶ Deshacer",
    redo: "↷ Rehacer",
    done: "Listo",
    changeCount: "{count} cambios",
    editWarning: "La edición puede afectar al funcionamiento de la página. Actualízala para restaurarla por completo.",
    connecting: "Conectando con el servidor...",
    cannotEditThisPage: "No se puede editar esta página",
    pageNotSupported: "Este tipo de página no es compatible",
    quotaExhaustedToast: "Se alcanzó el límite de funciones avanzadas. Se desbloquea en {reset}. Actualiza a Premium para usarlas sin límites.",
  },
  pt: {
    title: "Edit Page",
    settings: "Painel",
    chooseTool: "Escolha uma ferramenta",
    editText: "Editar texto",
    editTextDesc: "Altere qualquer texto desta página",
    exitEdit: "Sair da edição",
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
    exitReplaceMode: "Sair do modo de substituição",
    imageSelected: 'Imagem selecionada. Clique em "Modo de substituição"',
    pleaseSelectImageFirst: "Selecione uma imagem primeiro",
    removeElement: "Remover elemento",
    removeElementDesc: "Clique em qualquer elemento para removê-lo",
    exitRemoveMode: "Sair do modo de remoção",
    undo: "↶ Desfazer",
    redo: "↷ Refazer",
    done: "Concluir",
    changeCount: "{count} alterações",
    editWarning: "A edição pode afetar o funcionamento da página. Atualize-a para restaurar tudo.",
    connecting: "Conectando ao servidor...",
    cannotEditThisPage: "Não é possível editar esta página",
    pageNotSupported: "Este tipo de página não é compatível",
    quotaExhaustedToast: "O limite de recursos avançados foi atingido. Desbloqueia em {reset}. Assine o Premium para uso ilimitado.",
  },
  ja: {
    title: "Edit Page",
    settings: "ダッシュボード",
    chooseTool: "ツールを選択",
    editText: "テキストを編集",
    editTextDesc: "ページ上のテキストを変更します",
    exitEdit: "編集を終了",
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
    exitReplaceMode: "画像置換モードを終了",
    imageSelected: "画像を選択しました。「画像置換モード」をクリックしてください",
    pleaseSelectImageFirst: "先に画像を選択してください",
    removeElement: "要素を削除",
    removeElementDesc: "ページ上の要素をクリックして削除します",
    exitRemoveMode: "削除モードを終了",
    undo: "↶ 元に戻す",
    redo: "↷ やり直す",
    done: "完了",
    changeCount: "{count} 件の変更",
    editWarning: "編集によりページの動作に影響する場合があります。完全に元に戻すにはページを再読み込みしてください。",
    connecting: "サーバーに接続中...",
    cannotEditThisPage: "このページは編集できません",
    pageNotSupported: "この種類のページには対応していません",
    quotaExhaustedToast: "高度な機能の上限に達しました。{reset}後に解除されます。Premium では無制限に利用できます。",
  },
  zh: {
    title: "Edit Page",
    settings: "控制面板",
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
    fullPageCaptureInProgress: "已有一个整页截图任务正在进行。",
    fullPageTabChanged: "因切换了标签页，截图已停止。请保持当前页面激活后重试。",
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
    freePlan: "免费版",
    quotaExhaustedBadge: "部分功能限制",
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
    unlockNow: "立即解锁",
    unlockLicense: "使用激活码解锁",
    licensePlaceholder: "请输入激活码",
    licenseFormatHint: "格式：ABCD-2345-EFGH-6789",
    licenseFormatError: "激活码格式不正确，应类似 ABCD-2345-EFGH-6789。",
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
    await refreshPremiumState();
    return isPremium() || result.ok === true;
  };

  // Header badge: premium hides it; free shows "Free version", or
  // "Advanced feature limit reached" (click opens Options) when any quota is out.
  const updatePlanUI = async () => {
    document.body.classList.toggle("is-premium", isPremium());

    if (isPremium()) {
      planBadge.style.display = "none";
      planBadge.onclick = null;
      planBadge.classList.remove("is-exhausted");
      return;
    }

    mainContent.classList.remove("hidden");

    const state = await getQuotaState();

    planBadge.textContent = state.limited
      ? t("quotaExhaustedBadge")
      : t("freePlan");
    planBadge.classList.toggle("is-exhausted", state.limited);
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
        const localizedError = {
          capture_in_progress: t("fullPageCaptureInProgress"),
          tab_changed: t("fullPageTabChanged"),
        }[result?.errorCode];
        throw new Error(
          localizedError || result?.error || "Full-page capture failed",
        );
      }

      const successMessage = await saveScreenshot(result.dataUrl, "full-page");
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

  editBtn.addEventListener("click", async () => {
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

  screenshotBtn.addEventListener("click", () => {
    const expanded = screenshotBtn.getAttribute("aria-expanded") === "true";
    screenshotBtn.setAttribute("aria-expanded", String(!expanded));
    screenshotOptions.classList.toggle("hidden", expanded);
  });

  visibleScreenshotBtn.addEventListener("click", async () => {
    await prepareForScreenshot();
    await takeVisibleScreenshot();
  });

  fullPageScreenshotBtn.addEventListener("click", async () => {
    let billUse = false;
    if (!isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        showStatus(quotaExhaustedMessage(state), false);
        return;
      }
      billUse = true;
    }
    await prepareForScreenshot();
    const captured = await takeFullPageScreenshot();
    // Only bill the free allowance for completed captures.
    if (captured && billUse) await consumeFeatureUse("fullPageScreenshot");
    await updatePlanUI();
  });

  const setSelectedImage = async (imageSource) => {
    // Advanced-feature quota: each successful image import (upload or URL)
    // counts once; replacing multiple page elements with that import does not.
    let billUse = false;
    if (!isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        showStatus(quotaExhaustedMessage(state), false);
        return;
      }
      billUse = true;
    }
    selectedImageData = imageSource;
    previewImg.src = imageSource;
    imagePreview.classList.remove("hidden");
    replaceImageBtn.classList.remove("hidden");
    imageSourceOptions.classList.add("hidden");
    selectImageBtn.setAttribute("aria-expanded", "false");
    await saveImageData(imageSource);
    if (billUse) await consumeFeatureUse("replaceImage");
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
    if (!selectedImageData) {
      showStatus(t("pleaseSelectImageFirst"), false);
      return;
    }
    isReplaceModeTransitioning = true;
    replaceImageBtn.disabled = true;
    replaceImageBtn.setAttribute("aria-busy", "true");
    const nextReplaceMode = !isReplaceMode;
    try {
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
    const nextRemoveMode = !isRemoveMode;
    // Advanced-feature quota: entering remove mode consumes one use.
    let billUse = false;
    if (nextRemoveMode && !isPremium()) {
      const state = await getQuotaState();
      if (state.limited) {
        showStatus(quotaExhaustedMessage(state), false);
        return;
      }
      billUse = true;
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
      if (billUse) await consumeFeatureUse("removeElement");
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
});
