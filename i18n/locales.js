import { GENERATED_OPTIONS_MESSAGES } from "./options-generated.js";

export const LANGUAGE_OPTIONS = [
  ["en", "English", "en", "ltr"],
  ["ar", "العربية", "ar", "rtl"],
  ["zh-CN", "简体中文", "zh-CN", "ltr"],
  ["zh-TW", "繁體中文", "zh-TW", "ltr"],
  ["cs", "Čeština", "cs", "ltr"],
  ["da", "Dansk", "da", "ltr"],
  ["nl", "Nederlands", "nl", "ltr"],
  ["fi", "Suomi", "fi", "ltr"],
  ["fr", "Français", "fr", "ltr"],
  ["de", "Deutsch", "de", "ltr"],
  ["el", "Ελληνικά", "el", "ltr"],
  ["he", "עברית", "he", "rtl"],
  ["hi", "हिन्दी", "hi", "ltr"],
  ["hu", "Magyar", "hu", "ltr"],
  ["id", "Bahasa Indonesia", "id", "ltr"],
  ["it", "Italiano", "it", "ltr"],
  ["ja", "日本語", "ja", "ltr"],
  ["ko", "한국어", "ko", "ltr"],
  ["ms", "Bahasa Melayu", "ms", "ltr"],
  ["no", "Norsk", "no", "ltr"],
  ["pl", "Polski", "pl", "ltr"],
  ["pt-BR", "Português (Brasil)", "pt-BR", "ltr"],
  ["ro", "Română", "ro", "ltr"],
  ["ru", "Русский", "ru", "ltr"],
  ["es", "Español", "es", "ltr"],
  ["sv", "Svenska", "sv", "ltr"],
  ["th", "ไทย", "th", "ltr"],
  ["tr", "Türkçe", "tr", "ltr"],
  ["uk", "Українська", "uk", "ltr"],
  ["vi", "Tiếng Việt", "vi", "ltr"],
].map(([code, name, lang, dir]) => ({ code, name, lang, dir }));

export const LANGUAGE_ALIASES = {
  zh: "zh-CN",
  zh_CN: "zh-CN",
  zh_TW: "zh-TW",
  pt: "pt-BR",
  pt_BR: "pt-BR",
};

export const normalizeLanguageCode = (value = "") => {
  const raw = String(value).trim();
  if (!raw) return "";
  if (LANGUAGE_ALIASES[raw]) return LANGUAGE_ALIASES[raw];
  const normalized = raw.replace("_", "-");
  const exact = LANGUAGE_OPTIONS.find(
    ({ code }) => code.toLowerCase() === normalized.toLowerCase(),
  );
  if (exact) return exact.code;
  const prefix = normalized.toLowerCase().split("-")[0];
  const match = LANGUAGE_OPTIONS.find(
    ({ code }) => code.toLowerCase().split("-")[0] === prefix,
  );
  return match?.code || "";
};

export const getLanguageMetadata = (code) =>
  LANGUAGE_OPTIONS.find((option) => option.code === normalizeLanguageCode(code)) ||
  LANGUAGE_OPTIONS[0];

const P = [
  "settings", "chooseTool", "editText", "editTextDesc", "changeImage",
  "changeImageDesc", "uploadLocalImage", "imageUrlPlaceholder", "useImageUrl",
  "removeElement", "removeElementDesc", "screenshot", "screenshotDesc",
  "visibleScreenshot", "fullPageScreenshot", "freePlan", "undo", "redo", "done",
  "cannotEditThisPage", "pageNotSupported", "statusScreenshotSuccess",
  "statusScreenshotDownloaded",
];

const O = [
  "documentTitle", "title", "subtitle", "language", "languageHelp", "followBrowser",
  "screenshotSettings", "saveMethod", "screenshotDestinationHelp", "saveToClipboard",
  "saveAsDownload", "whenCapturingFullPage", "hideRepeatedElements",
  "hideRepeatedElementsHelp", "premiumIntro", "premiumLearn", "premiumActivateLabel",
  "premiumCodePlaceholder", "premiumActivate", "premiumActivateEmpty",
  "premiumActivating", "premiumActivateSuccess", "premiumActivateInvalid",
  "quotaReplaceImage", "quotaFullPage", "quotaRemoveElement", "quotaLimitReached",
  "supportSection", "supportReviewPrompt", "supportFeedbackPrompt", "leaveReview",
  "sendFeedback",
];

const rowsToMessages = (keys, rows) => Object.fromEntries(
  Object.entries(rows).map(([locale, values]) => [
    locale,
    Object.fromEntries(keys.map((key, index) => [key, values[index]])),
  ]),
);

const popupRows = {
  ar: ["لوحة التحكم","اختر أداة","تحرير النص","غيّر أي نص في هذه الصفحة","تغيير الصورة","ارفع صورة أو ألصق رابطها","رفع من الجهاز","ألصق رابط الصورة","استخدام الرابط","إزالة عنصر","انقر على أي عنصر لإزالته","لقطة شاشة","التقط العرض الحالي أو الصفحة كاملة","العرض الحالي","الصفحة كاملة","الإصدار المجاني","↶ تراجع","↷ إعادة","تم","لا يمكن تحرير هذه الصفحة","هذا النوع من الصفحات غير مدعوم","نُسخت اللقطة إلى الحافظة!","تم تنزيل اللقطة!"],
  "zh-TW": ["控制面板","選擇工具","編輯文字","直接修改目前頁面的文字","更改圖片","上傳圖片或貼上圖片網址","從裝置上傳","貼上圖片網址","使用網址","移除元素","點擊任意元素即可移除","截圖","擷取目前視窗或完整網頁","目前視窗","整張網頁","免費版","↶ 復原","↷ 重做","完成","無法編輯此頁面","不支援此類型的頁面","截圖已複製到剪貼簿！","截圖已下載！"],
  cs: ["Nastavení","Vyberte nástroj","Upravit text","Změňte libovolný text na stránce","Změnit obrázek","Nahrajte obrázek nebo vložte jeho URL","Nahrát ze zařízení","Vložte URL obrázku","Použít URL","Odstranit prvek","Kliknutím prvek odstraníte","Snímek obrazovky","Zachyťte zobrazení nebo celou stránku","Aktuální zobrazení","Celá stránka","Bezplatná verze","↶ Zpět","↷ Znovu","Hotovo","Tuto stránku nelze upravit","Tento typ stránky není podporován","Snímek byl zkopírován!","Snímek byl stažen!"],
  da: ["Indstillinger","Vælg et værktøj","Rediger tekst","Skift tekst på denne side","Skift billede","Upload et billede eller indsæt en URL","Upload fra enhed","Indsæt billed-URL","Brug URL","Fjern element","Klik på et element for at fjerne det","Skærmbillede","Tag billede af visningen eller hele siden","Aktuel visning","Hele siden","Gratis version","↶ Fortryd","↷ Annuller fortryd","Færdig","Siden kan ikke redigeres","Denne sidetype understøttes ikke","Skærmbilledet er kopieret!","Skærmbilledet er downloadet!"],
  nl: ["Instellingen","Kies een hulpmiddel","Tekst bewerken","Wijzig tekst op deze pagina","Afbeelding wijzigen","Upload een afbeelding of plak een URL","Uploaden vanaf apparaat","Plak afbeeldings-URL","URL gebruiken","Element verwijderen","Klik op een element om het te verwijderen","Schermafbeelding","Leg de weergave of volledige pagina vast","Huidige weergave","Volledige pagina","Gratis versie","↶ Ongedaan maken","↷ Opnieuw","Klaar","Deze pagina kan niet worden bewerkt","Dit paginatype wordt niet ondersteund","Schermafbeelding gekopieerd!","Schermafbeelding gedownload!"],
  fi: ["Asetukset","Valitse työkalu","Muokkaa tekstiä","Muuta sivun tekstiä","Vaihda kuva","Lataa kuva tai liitä kuvan URL","Lataa laitteelta","Liitä kuvan URL","Käytä URL-osoitetta","Poista elementti","Poista elementti napsauttamalla","Kuvakaappaus","Kaappaa näkymä tai koko sivu","Nykyinen näkymä","Koko sivu","Ilmaisversio","↶ Kumoa","↷ Tee uudelleen","Valmis","Sivua ei voi muokata","Tätä sivutyyppiä ei tueta","Kuvakaappaus kopioitu!","Kuvakaappaus ladattu!"],
  fr: ["Paramètres","Choisir un outil","Modifier le texte","Modifiez le texte de cette page","Changer l’image","Importez une image ou collez son URL","Importer depuis l’appareil","Collez l’URL de l’image","Utiliser l’URL","Supprimer un élément","Cliquez sur un élément pour le supprimer","Capture d’écran","Capturez la vue ou la page entière","Vue actuelle","Page entière","Version gratuite","↶ Annuler","↷ Rétablir","Terminé","Impossible de modifier cette page","Ce type de page n’est pas pris en charge","Capture copiée !","Capture téléchargée !"],
  de: ["Einstellungen","Werkzeug auswählen","Text bearbeiten","Text auf dieser Seite ändern","Bild ändern","Bild hochladen oder Bild-URL einfügen","Vom Gerät hochladen","Bild-URL einfügen","URL verwenden","Element entfernen","Zum Entfernen auf ein Element klicken","Screenshot","Ansicht oder ganze Seite aufnehmen","Aktuelle Ansicht","Ganze Seite","Kostenlose Version","↶ Rückgängig","↷ Wiederholen","Fertig","Diese Seite kann nicht bearbeitet werden","Dieser Seitentyp wird nicht unterstützt","Screenshot kopiert!","Screenshot heruntergeladen!"],
  el: ["Ρυθμίσεις","Επιλέξτε εργαλείο","Επεξεργασία κειμένου","Αλλάξτε κείμενο στη σελίδα","Αλλαγή εικόνας","Ανεβάστε εικόνα ή επικολλήστε URL","Μεταφόρτωση από συσκευή","Επικολλήστε URL εικόνας","Χρήση URL","Αφαίρεση στοιχείου","Κάντε κλικ σε στοιχείο για αφαίρεση","Στιγμιότυπο","Λήψη προβολής ή ολόκληρης σελίδας","Τρέχουσα προβολή","Ολόκληρη σελίδα","Δωρεάν έκδοση","↶ Αναίρεση","↷ Επανάληψη","Τέλος","Δεν είναι δυνατή η επεξεργασία","Αυτός ο τύπος σελίδας δεν υποστηρίζεται","Το στιγμιότυπο αντιγράφηκε!","Το στιγμιότυπο λήφθηκε!"],
  he: ["הגדרות","בחירת כלי","עריכת טקסט","שינוי טקסט בדף הזה","החלפת תמונה","העלאת תמונה או הדבקת כתובת URL","העלאה מהמכשיר","הדבקת כתובת תמונה","שימוש בכתובת","הסרת רכיב","לחצו על רכיב כדי להסירו","צילום מסך","צילום התצוגה או הדף המלא","התצוגה הנוכחית","דף מלא","גרסה חינמית","↶ ביטול","↷ ביצוע מחדש","סיום","לא ניתן לערוך דף זה","סוג דף זה אינו נתמך","צילום המסך הועתק!","צילום המסך הורד!"],
  hi: ["सेटिंग्स","कोई टूल चुनें","टेक्स्ट संपादित करें","इस पेज का कोई भी टेक्स्ट बदलें","इमेज बदलें","इमेज अपलोड करें या URL पेस्ट करें","डिवाइस से अपलोड करें","इमेज URL पेस्ट करें","URL इस्तेमाल करें","एलिमेंट हटाएँ","हटाने के लिए किसी एलिमेंट पर क्लिक करें","स्क्रीनशॉट","मौजूदा दृश्य या पूरा पेज कैप्चर करें","मौजूदा दृश्य","पूरा पेज","मुफ़्त संस्करण","↶ पूर्ववत","↷ फिर करें","पूर्ण","इस पेज को संपादित नहीं किया जा सकता","यह पेज प्रकार समर्थित नहीं है","स्क्रीनशॉट क्लिपबोर्ड पर कॉपी हुआ!","स्क्रीनशॉट डाउनलोड हुआ!"],
  hu: ["Beállítások","Válasszon eszközt","Szöveg szerkesztése","Módosítsa az oldal szövegét","Kép cseréje","Töltsön fel képet vagy illesszen be URL-t","Feltöltés eszközről","Kép URL-jének beillesztése","URL használata","Elem eltávolítása","Kattintson egy elemre az eltávolításhoz","Képernyőkép","Nézet vagy teljes oldal rögzítése","Aktuális nézet","Teljes oldal","Ingyenes verzió","↶ Visszavonás","↷ Újra","Kész","Ez az oldal nem szerkeszthető","Ez az oldaltípus nem támogatott","Képernyőkép másolva!","Képernyőkép letöltve!"],
  id: ["Pengaturan","Pilih alat","Edit teks","Ubah teks apa pun di halaman ini","Ganti gambar","Unggah gambar atau tempel URL","Unggah dari perangkat","Tempel URL gambar","Gunakan URL","Hapus elemen","Klik elemen untuk menghapusnya","Tangkapan layar","Ambil tampilan atau seluruh halaman","Tampilan saat ini","Seluruh halaman","Versi gratis","↶ Urungkan","↷ Ulangi","Selesai","Halaman ini tidak dapat diedit","Jenis halaman ini tidak didukung","Tangkapan layar disalin!","Tangkapan layar diunduh!"],
  it: ["Impostazioni","Scegli uno strumento","Modifica testo","Modifica il testo della pagina","Cambia immagine","Carica un’immagine o incolla l’URL","Carica dal dispositivo","Incolla URL immagine","Usa URL","Rimuovi elemento","Fai clic su un elemento per rimuoverlo","Screenshot","Cattura la vista o l’intera pagina","Vista corrente","Pagina intera","Versione gratuita","↶ Annulla","↷ Ripeti","Fatto","Impossibile modificare questa pagina","Questo tipo di pagina non è supportato","Screenshot copiato!","Screenshot scaricato!"],
  ko: ["설정","도구 선택","텍스트 편집","페이지의 텍스트를 변경합니다","이미지 변경","이미지를 업로드하거나 URL을 붙여넣으세요","기기에서 업로드","이미지 URL 붙여넣기","URL 사용","요소 제거","제거할 요소를 클릭하세요","스크린샷","현재 화면 또는 전체 페이지 캡처","현재 화면","전체 페이지","무료 버전","↶ 실행 취소","↷ 다시 실행","완료","이 페이지를 편집할 수 없습니다","지원되지 않는 페이지 유형입니다","스크린샷을 클립보드에 복사했습니다!","스크린샷을 다운로드했습니다!"],
  ms: ["Tetapan","Pilih alat","Edit teks","Ubah teks pada halaman ini","Tukar imej","Muat naik imej atau tampal URL","Muat naik dari peranti","Tampal URL imej","Guna URL","Alih keluar elemen","Klik elemen untuk mengalih keluarnya","Tangkap skrin","Tangkap paparan atau seluruh halaman","Paparan semasa","Seluruh halaman","Versi percuma","↶ Buat asal","↷ Buat semula","Selesai","Halaman ini tidak boleh diedit","Jenis halaman ini tidak disokong","Tangkapan disalin!","Tangkapan dimuat turun!"],
  no: ["Innstillinger","Velg et verktøy","Rediger tekst","Endre tekst på denne siden","Bytt bilde","Last opp et bilde eller lim inn en URL","Last opp fra enheten","Lim inn bilde-URL","Bruk URL","Fjern element","Klikk på et element for å fjerne det","Skjermbilde","Ta bilde av visningen eller hele siden","Gjeldende visning","Hele siden","Gratisversjon","↶ Angre","↷ Gjør om","Ferdig","Denne siden kan ikke redigeres","Denne sidetypen støttes ikke","Skjermbildet er kopiert!","Skjermbildet er lastet ned!"],
  pl: ["Ustawienia","Wybierz narzędzie","Edytuj tekst","Zmień tekst na tej stronie","Zmień obraz","Prześlij obraz lub wklej adres URL","Prześlij z urządzenia","Wklej adres URL obrazu","Użyj URL","Usuń element","Kliknij element, aby go usunąć","Zrzut ekranu","Zapisz widok lub całą stronę","Bieżący widok","Cała strona","Wersja bezpłatna","↶ Cofnij","↷ Ponów","Gotowe","Nie można edytować tej strony","Ten typ strony nie jest obsługiwany","Zrzut skopiowany!","Zrzut pobrany!"],
  ro: ["Setări","Alege un instrument","Editează textul","Modifică textul de pe această pagină","Schimbă imaginea","Încarcă o imagine sau lipește URL-ul","Încarcă de pe dispozitiv","Lipește URL-ul imaginii","Folosește URL-ul","Elimină elementul","Apasă pe un element pentru a-l elimina","Captură de ecran","Capturează vizualizarea sau pagina completă","Vizualizarea curentă","Pagina completă","Versiune gratuită","↶ Anulează","↷ Refă","Gata","Această pagină nu poate fi editată","Acest tip de pagină nu este acceptat","Captura a fost copiată!","Captura a fost descărcată!"],
  ru: ["Настройки","Выберите инструмент","Редактировать текст","Измените текст на этой странице","Заменить изображение","Загрузите изображение или вставьте URL","Загрузить с устройства","Вставьте URL изображения","Использовать URL","Удалить элемент","Нажмите элемент, чтобы удалить его","Скриншот","Снимок текущего вида или всей страницы","Текущий вид","Вся страница","Бесплатная версия","↶ Отменить","↷ Повторить","Готово","Эту страницу нельзя редактировать","Этот тип страницы не поддерживается","Скриншот скопирован!","Скриншот загружен!"],
  sv: ["Inställningar","Välj ett verktyg","Redigera text","Ändra text på sidan","Byt bild","Ladda upp en bild eller klistra in en URL","Ladda upp från enhet","Klistra in bild-URL","Använd URL","Ta bort element","Klicka på ett element för att ta bort det","Skärmbild","Fånga vyn eller hela sidan","Aktuell vy","Hela sidan","Gratisversion","↶ Ångra","↷ Gör om","Klar","Sidan kan inte redigeras","Den här sidtypen stöds inte","Skärmbilden kopierades!","Skärmbilden laddades ned!"],
  th: ["การตั้งค่า","เลือกเครื่องมือ","แก้ไขข้อความ","เปลี่ยนข้อความบนหน้านี้","เปลี่ยนรูปภาพ","อัปโหลดรูปหรือวาง URL","อัปโหลดจากอุปกรณ์","วาง URL รูปภาพ","ใช้ URL","ลบองค์ประกอบ","คลิกองค์ประกอบเพื่อลบ","ภาพหน้าจอ","จับภาพมุมมองหรือทั้งหน้า","มุมมองปัจจุบัน","ทั้งหน้า","เวอร์ชันฟรี","↶ เลิกทำ","↷ ทำซ้ำ","เสร็จสิ้น","แก้ไขหน้านี้ไม่ได้","ไม่รองรับหน้าประเภทนี้","คัดลอกภาพหน้าจอแล้ว!","ดาวน์โหลดภาพหน้าจอแล้ว!"],
  tr: ["Ayarlar","Bir araç seçin","Metni düzenle","Bu sayfadaki metni değiştirin","Görseli değiştir","Görsel yükleyin veya URL yapıştırın","Cihazdan yükle","Görsel URL’sini yapıştırın","URL’yi kullan","Öğeyi kaldır","Kaldırmak için bir öğeye tıklayın","Ekran görüntüsü","Görünümü veya tam sayfayı yakalayın","Geçerli görünüm","Tam sayfa","Ücretsiz sürüm","↶ Geri al","↷ Yinele","Bitti","Bu sayfa düzenlenemiyor","Bu sayfa türü desteklenmiyor","Ekran görüntüsü kopyalandı!","Ekran görüntüsü indirildi!"],
  uk: ["Налаштування","Виберіть інструмент","Редагувати текст","Змініть текст на цій сторінці","Замінити зображення","Завантажте зображення або вставте URL","Завантажити з пристрою","Вставте URL зображення","Використати URL","Видалити елемент","Натисніть елемент, щоб видалити","Знімок екрана","Захопіть поточний вигляд або всю сторінку","Поточний вигляд","Уся сторінка","Безкоштовна версія","↶ Скасувати","↷ Повторити","Готово","Цю сторінку не можна редагувати","Цей тип сторінки не підтримується","Знімок скопійовано!","Знімок завантажено!"],
  vi: ["Cài đặt","Chọn công cụ","Sửa văn bản","Thay đổi văn bản trên trang này","Đổi hình ảnh","Tải ảnh lên hoặc dán URL","Tải lên từ thiết bị","Dán URL hình ảnh","Dùng URL","Xóa phần tử","Nhấp vào phần tử để xóa","Ảnh chụp màn hình","Chụp khung nhìn hoặc toàn bộ trang","Khung nhìn hiện tại","Toàn bộ trang","Phiên bản miễn phí","↶ Hoàn tác","↷ Làm lại","Xong","Không thể chỉnh sửa trang này","Loại trang này không được hỗ trợ","Đã sao chép ảnh chụp!","Đã tải ảnh chụp!"],
};

export const ADDITIONAL_POPUP_MESSAGES = rowsToMessages(P, popupRows);

const genericOptions = {
  ar: ["لوحة التحكم · Edit Page","لوحة التحكم","خصص طريقة عمل Edit Page.","اللغة","اختر لغة الواجهة أو اتبع المتصفح.","اتباع المتصفح","لقطة الشاشة","طريقة الحفظ","اختر مكان حفظ اللقطات.","الحافظة","تنزيل","عند التقاط صفحة كاملة","إخفاء العناصر المتكررة","إخفاء العناصر العائمة وأشرطة التمرير التي قد تتكرر.","Premium يتيح استخدامًا غير محدود لجميع الميزات.","تعرف على Premium","لديك رمز تفعيل؟","أدخل رمز التفعيل","تفعيل","أدخل رمز التفعيل.","جارٍ التفعيل...","تم تفعيل Premium.","رمز التفعيل غير صالح أو منتهي.","استيراد الصور","لقطة صفحة كاملة","إزالة عنصر","تم بلوغ الحد","الدعم","هل تستمتع باستخدام Edit Page؟","وجدت خطأ أو لديك اقتراح؟","اترك تقييمًا","إرسال ملاحظات"],
  "zh-TW": ["控制面板 · Edit Page","控制面板","依你的習慣設定 Edit Page。","語言","選擇介面語言，或跟隨瀏覽器。","跟隨瀏覽器","截圖","儲存方式","選擇截圖的儲存位置。","剪貼簿","下載","整頁截圖時","隱藏重複元素","隱藏懸浮元素、捲動條等可能重複的內容。","Premium 可無限使用所有功能及後續增強。","了解 Premium","已有啟用碼？","輸入啟用碼","啟用","請輸入啟用碼。","正在啟用…","Premium 啟用成功。","啟用碼無效或已過期。","圖片匯入","整頁截圖","移除元素","已達上限","支援","喜歡 Edit Page 嗎？","發現錯誤或有建議？","留下評論","傳送意見"],
};

const optionLocaleNames = {
  cs:["Ovládací panel","Jazyk","Podle prohlížeče","Snímek obrazovky","Způsob uložení","Schránka","Stáhnout","Skrýt opakované prvky","Aktivovat","Podpora","Napsat recenzi","Poslat zpětnou vazbu"],
  da:["Kontrolpanel","Sprog","Følg browser","Skærmbillede","Gemmemetode","Udklipsholder","Download","Skjul gentagne elementer","Aktivér","Support","Skriv anmeldelse","Send feedback"],
  nl:["Dashboard","Taal","Browser volgen","Schermafbeelding","Opslagmethode","Klembord","Download","Herhaalde elementen verbergen","Activeren","Ondersteuning","Beoordeling plaatsen","Feedback sturen"],
  fi:["Hallintapaneeli","Kieli","Seuraa selainta","Kuvakaappaus","Tallennustapa","Leikepöytä","Lataa","Piilota toistuvat elementit","Aktivoi","Tuki","Jätä arvostelu","Lähetä palautetta"],
  fr:["Tableau de bord","Langue","Suivre le navigateur","Capture d’écran","Méthode d’enregistrement","Presse-papiers","Téléchargement","Masquer les éléments répétés","Activer","Assistance","Laisser un avis","Envoyer un commentaire"],
  de:["Dashboard","Sprache","Browsersprache verwenden","Screenshot","Speichermethode","Zwischenablage","Download","Wiederholte Elemente ausblenden","Aktivieren","Support","Bewertung abgeben","Feedback senden"],
  el:["Πίνακας ελέγχου","Γλώσσα","Ακολούθηση προγράμματος περιήγησης","Στιγμιότυπο","Μέθοδος αποθήκευσης","Πρόχειρο","Λήψη","Απόκρυψη επαναλαμβανόμενων στοιχείων","Ενεργοποίηση","Υποστήριξη","Αφήστε κριτική","Αποστολή σχολίων"],
  he:["לוח בקרה","שפה","לפי הדפדפן","צילום מסך","שיטת שמירה","לוח","הורדה","הסתרת רכיבים חוזרים","הפעלה","תמיכה","כתיבת ביקורת","שליחת משוב"],
  hi:["डैशबोर्ड","भाषा","ब्राउज़र के अनुसार","स्क्रीनशॉट","सेव करने का तरीका","क्लिपबोर्ड","डाउनलोड","दोहराए गए एलिमेंट छिपाएँ","सक्रिय करें","सहायता","समीक्षा दें","फ़ीडबैक भेजें"],
  hu:["Vezérlőpult","Nyelv","Böngésző követése","Képernyőkép","Mentési mód","Vágólap","Letöltés","Ismétlődő elemek elrejtése","Aktiválás","Támogatás","Értékelés írása","Visszajelzés küldése"],
  id:["Dasbor","Bahasa","Ikuti browser","Tangkapan layar","Metode penyimpanan","Papan klip","Unduh","Sembunyikan elemen berulang","Aktifkan","Dukungan","Beri ulasan","Kirim masukan"],
  it:["Pannello","Lingua","Segui il browser","Screenshot","Metodo di salvataggio","Appunti","Download","Nascondi elementi ripetuti","Attiva","Supporto","Lascia una recensione","Invia feedback"],
  ko:["대시보드","언어","브라우저 설정 따르기","스크린샷","저장 방식","클립보드","다운로드","반복 요소 숨기기","활성화","지원","리뷰 남기기","피드백 보내기"],
  ms:["Papan pemuka","Bahasa","Ikut pelayar","Tangkap skrin","Kaedah simpan","Papan keratan","Muat turun","Sembunyikan elemen berulang","Aktifkan","Sokongan","Tinggalkan ulasan","Hantar maklum balas"],
  no:["Kontrollpanel","Språk","Følg nettleseren","Skjermbilde","Lagringsmetode","Utklippstavle","Last ned","Skjul gjentatte elementer","Aktiver","Brukerstøtte","Gi en vurdering","Send tilbakemelding"],
  pl:["Panel","Język","Zgodnie z przeglądarką","Zrzut ekranu","Metoda zapisu","Schowek","Pobierz","Ukryj powtarzające się elementy","Aktywuj","Pomoc","Dodaj opinię","Wyślij opinię"],
  ro:["Panou","Limbă","Urmează browserul","Captură de ecran","Metodă de salvare","Clipboard","Descărcare","Ascunde elementele repetate","Activează","Asistență","Lasă o recenzie","Trimite feedback"],
  ru:["Панель управления","Язык","Как в браузере","Скриншот","Способ сохранения","Буфер обмена","Скачать","Скрыть повторяющиеся элементы","Активировать","Поддержка","Оставить отзыв","Отправить отзыв"],
  sv:["Kontrollpanel","Språk","Följ webbläsaren","Skärmbild","Sparmetod","Urklipp","Ladda ned","Dölj upprepade element","Aktivera","Support","Lämna omdöme","Skicka feedback"],
  th:["แดชบอร์ด","ภาษา","ตามเบราว์เซอร์","ภาพหน้าจอ","วิธีบันทึก","คลิปบอร์ด","ดาวน์โหลด","ซ่อนองค์ประกอบที่ซ้ำ","เปิดใช้งาน","การสนับสนุน","เขียนรีวิว","ส่งความคิดเห็น"],
  tr:["Kontrol paneli","Dil","Tarayıcıyı izle","Ekran görüntüsü","Kaydetme yöntemi","Pano","İndir","Tekrarlanan öğeleri gizle","Etkinleştir","Destek","Yorum bırak","Geri bildirim gönder"],
  uk:["Панель керування","Мова","Як у браузері","Знімок екрана","Спосіб збереження","Буфер обміну","Завантажити","Приховати повторювані елементи","Активувати","Підтримка","Залишити відгук","Надіслати відгук"],
  vi:["Bảng điều khiển","Ngôn ngữ","Theo trình duyệt","Ảnh chụp màn hình","Cách lưu","Bảng nhớ tạm","Tải xuống","Ẩn phần tử lặp lại","Kích hoạt","Hỗ trợ","Viết đánh giá","Gửi phản hồi"],
};

for (const [locale, values] of Object.entries(optionLocaleNames)) {
  const [title, language, followBrowser, screenshotSettings, saveMethod, saveToClipboard,
    saveAsDownload, hideRepeatedElements, premiumActivate, supportSection, leaveReview,
    sendFeedback] = values;
  genericOptions[locale] = [
    `${title} · Edit Page`, title, "Customize Edit Page to work the way you prefer.",
    language, "Choose the interface language, or follow your browser.", followBrowser,
    screenshotSettings, saveMethod, "Choose where screenshots are saved.", saveToClipboard,
    saveAsDownload, "When capturing a full page", hideRepeatedElements,
    "Hide floating elements, scrollbars, and other content that may repeat.",
    "Premium provides unlimited access to all features and future enhancements.",
    "Learn about Premium", "Already have an activation code?", "Enter activation code",
    premiumActivate, "Enter your activation code.", "Activating...",
    "Premium activated successfully.", "This activation code is invalid or expired.",
    "Image imports", "Full-page screenshot", "Remove element", "Limit reached",
    supportSection, "Enjoying Edit Page?", "Found a bug or have a suggestion?",
    leaveReview, sendFeedback,
  ];
}

const additionalOptionsMessages = rowsToMessages(O, genericOptions);

for (const [locale, localizedMessages] of Object.entries(GENERATED_OPTIONS_MESSAGES)) {
  Object.assign(additionalOptionsMessages[locale], localizedMessages);
}

Object.assign(additionalOptionsMessages.ar, {
  premiumActivateRevoked: "تم إلغاء رمز التفعيل هذا.",
  premiumActivateRefunded: "تم رد قيمة رمز التفعيل هذا.",
  premiumActivateError: "فشل التفعيل. تحقق من اتصالك وحاول مرة أخرى.",
  quotaOfLeft: "متبقي {remaining} من {limit}",
  quotaWindow: "عند نفاد أي حصة، تتوقف جميع الميزات المتقدمة لمدة 12 ساعة. قم بالترقية إلى Premium للاستخدام غير المحدود.",
  quotaResumesIn: "يُفتح خلال {reset}",
});

Object.assign(additionalOptionsMessages["zh-TW"], {
  premiumActivateRevoked: "此啟用碼已被撤銷。",
  premiumActivateRefunded: "此啟用碼已退款。",
  premiumActivateError: "啟用失敗，請檢查網路連線後再試一次。",
  quotaOfLeft: "剩餘 {remaining} / {limit} 次",
  quotaWindow: "任一額度用盡後，所有進階功能將暫停 12 小時；升級 Premium 即可無限使用。",
  quotaResumesIn: "{reset}後恢復",
});

// Keep every settings-page sentence localized. Short labels alone are not
// enough here because options.js intentionally falls back to English when a
// key is missing.
Object.assign(additionalOptionsMessages.tr, {
  subtitle: "Edit Page'i tercihlerinize göre özelleştirin.",
  languageHelp: "Arayüz dilini seçin veya tarayıcınızın dilini kullanın.",
  screenshotDestinationHelp: "Ekran görüntülerinin nereye kaydedileceğini seçin.",
  whenCapturingFullPage: "Tam sayfa ekran görüntüsü alırken",
  hideRepeatedElementsHelp:
    "Tam sayfa ekran görüntülerinde tekrarlanabilecek sabit öğeleri, kaydırma çubuklarını ve diğer içerikleri gizleyin.",
  premiumIntro:
    "Premium, tüm özelliklere ve gelecekteki geliştirmelere sınırsız erişim sağlar.",
  premiumLearn: "Premium hakkında bilgi edinin",
  premiumActivateLabel: "Zaten bir aktivasyon kodunuz var mı?",
  premiumCodePlaceholder: "Aktivasyon kodunu girin",
  premiumActivateEmpty: "Aktivasyon kodunuzu girin.",
  premiumActivating: "Etkinleştiriliyor...",
  premiumActivateSuccess: "Premium başarıyla etkinleştirildi.",
  premiumActivateInvalid: "Bu aktivasyon kodu geçersiz veya süresi dolmuş.",
  premiumActivateRevoked: "Bu aktivasyon kodu iptal edilmiş.",
  premiumActivateRefunded: "Bu aktivasyon kodu için geri ödeme yapılmış.",
  premiumActivateError:
    "Etkinleştirme başarısız oldu. Bağlantınızı kontrol edip tekrar deneyin.",
  quotaReplaceImage: "Görsel içe aktarma",
  quotaFullPage: "Tam sayfa ekran görüntüsü",
  quotaRemoveElement: "Öğe kaldırma",
  quotaOfLeft: "{limit} haktan {remaining} kaldı",
  quotaLimitReached: "Sınıra ulaşıldı",
  quotaWindow:
    "Herhangi bir kullanım hakkı bittiğinde tüm gelişmiş özellikler 12 saat duraklatılır. Sınırsız kullanım için Premium'a yükseltin.",
  quotaResumesIn: "{reset} sonra açılır",
  supportReviewPrompt: "Edit Page'i beğeniyor musunuz?",
  supportFeedbackPrompt: "Bir hata mı buldunuz veya öneriniz mi var?",
});

Object.assign(additionalOptionsMessages.vi, {
  subtitle: "Tùy chỉnh Edit Page theo cách bạn muốn.",
  languageHelp: "Chọn ngôn ngữ giao diện hoặc dùng ngôn ngữ của trình duyệt.",
  screenshotDestinationHelp: "Chọn nơi lưu ảnh chụp màn hình.",
  whenCapturingFullPage: "Khi chụp toàn bộ trang",
  hideRepeatedElementsHelp:
    "Ẩn các phần tử nổi, thanh cuộn và nội dung khác có thể bị lặp lại trong ảnh chụp toàn trang.",
  premiumIntro:
    "Premium cho phép sử dụng không giới hạn mọi tính năng và các cải tiến trong tương lai.",
  premiumLearn: "Tìm hiểu về Premium",
  premiumActivateLabel: "Bạn đã có mã kích hoạt?",
  premiumCodePlaceholder: "Nhập mã kích hoạt",
  premiumActivateEmpty: "Vui lòng nhập mã kích hoạt.",
  premiumActivating: "Đang kích hoạt...",
  premiumActivateSuccess: "Đã kích hoạt Premium thành công.",
  premiumActivateInvalid: "Mã kích hoạt không hợp lệ hoặc đã hết hạn.",
  premiumActivateRevoked: "Mã kích hoạt này đã bị thu hồi.",
  premiumActivateRefunded: "Mã kích hoạt này đã được hoàn tiền.",
  premiumActivateError:
    "Kích hoạt không thành công. Hãy kiểm tra kết nối rồi thử lại.",
  quotaReplaceImage: "Lượt nhập hình ảnh",
  quotaFullPage: "Ảnh chụp toàn trang",
  quotaRemoveElement: "Xóa phần tử",
  quotaOfLeft: "Còn {remaining} trên {limit} lượt",
  quotaLimitReached: "Đã đạt giới hạn",
  quotaWindow:
    "Khi một hạn mức được dùng hết, tất cả tính năng nâng cao sẽ tạm dừng trong 12 giờ. Nâng cấp lên Premium để sử dụng không giới hạn.",
  quotaResumesIn: "Mở lại sau {reset}",
  supportReviewPrompt: "Bạn có thích Edit Page không?",
  supportFeedbackPrompt: "Bạn phát hiện lỗi hoặc có đề xuất?",
});

export const ADDITIONAL_OPTIONS_MESSAGES = additionalOptionsMessages;
