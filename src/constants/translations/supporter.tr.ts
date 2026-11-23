import { GiftId } from "@/constants/supporter";
import { Language } from "@/types/language.types";

export type SupporterTranslations = {
  // Screen
  title: string;
  whyTitle: string;
  whyBody: string;

  // Unlock card
  unlockTitle: string;
  unlockSubtitle: string;
  unlockPendingStatus: string;
  playUnavailable: string;
  supporterThanks: string;
  benefits: [string, string, string];
  unlockButton: string;
  paymentPending: string;
  tryAgain: string;
  supporterSince: string; // {date} = month + year

  // Gift card
  giftDivider: string;
  giftTitle: string;
  giftSubtitle: string;
  giftLastKnown: string;
  giftPending: string;
  giftReceived: string; // {date} = full date
  giftAlreadyAdFree: string;
  gifts: Record<GiftId, string>;

  // Restore + fine print
  restore: string;
  restoreDone: string;
  restoreNothing: string;
  restoreFailed: string;
  finePrint: string;
};

export const SUPPORTER_TR: Record<Language, SupporterTranslations> = {
  // ------------------------------------------------------------
  // English
  // ------------------------------------------------------------
  en: {
    title: "Support the app",
    whyTitle: "Why support?",
    whyBody: "Everything in Nejon Prayer is free, and nothing is locked behind a payment. Keeping it up to date takes time and money every month, so if the app helps you, any support helps.",
    unlockTitle: "Forever supporter",
    unlockSubtitle: "One payment, no subscription",
    unlockPendingStatus: "Waiting for Google Play to confirm the payment",
    playUnavailable: "Can't reach Google Play right now",
    supporterThanks: "Thank you for supporting Nejon Prayer",
    benefits: ["No ads, on any screen", "A supporter mark in the app", "Keeps an independent app going"],
    unlockButton: "Unlock",
    paymentPending: "Payment pending",
    tryAgain: "Try again",
    supporterSince: "Supporter since {date}",
    giftDivider: "or just give something",
    giftTitle: "One-time gift",
    giftSubtitle: "Doesn't remove ads — just a thank you",
    giftLastKnown: "Last known prices — reconnect to give",
    giftPending: "Gift payment pending — waiting for Google Play",
    giftReceived: "Gift received on {date} — thank you",
    giftAlreadyAdFree: "You're already ad-free — a gift is just extra support",
    gifts: { gift_small: "Small", gift_medium: "Medium", gift_large: "Large" },
    restore: "Restore purchases",
    restoreDone: "Supporter restored",
    restoreNothing: "No purchases to restore",
    restoreFailed: "Can't reach Google Play",
    finePrint: "One-time payments, handled by Google Play. The unlock returns on any device signed in to the same Google account.",
  },

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: {
    title: "App unterstützen",
    whyTitle: "Warum unterstützen?",
    whyBody: "Alles in Nejon Prayer ist kostenlos, und nichts ist hinter einer Zahlung versteckt. Die App aktuell zu halten kostet jeden Monat Zeit und Geld – wenn sie dir hilft, hilft jede Unterstützung.",
    unlockTitle: "Unterstützer für immer",
    unlockSubtitle: "Einmalige Zahlung, kein Abo",
    unlockPendingStatus: "Warte auf die Bestätigung von Google Play",
    playUnavailable: "Google Play ist gerade nicht erreichbar",
    supporterThanks: "Danke, dass du Nejon Prayer unterstützt",
    benefits: ["Keine Werbung, auf keinem Bildschirm", "Ein Unterstützer-Abzeichen in der App", "Hilft einer unabhängigen App weiter"],
    unlockButton: "Freischalten",
    paymentPending: "Zahlung ausstehend",
    tryAgain: "Erneut versuchen",
    supporterSince: "Unterstützer seit {date}",
    giftDivider: "oder einfach etwas schenken",
    giftTitle: "Einmaliges Geschenk",
    giftSubtitle: "Entfernt keine Werbung – nur ein Dankeschön",
    giftLastKnown: "Zuletzt bekannte Preise – zum Schenken verbinden",
    giftPending: "Zahlung für das Geschenk ausstehend – warte auf Google Play",
    giftReceived: "Geschenk am {date} erhalten – danke",
    giftAlreadyAdFree: "Du bist schon werbefrei – ein Geschenk ist zusätzliche Unterstützung",
    gifts: { gift_small: "Klein", gift_medium: "Mittel", gift_large: "Groß" },
    restore: "Käufe wiederherstellen",
    restoreDone: "Unterstützer wiederhergestellt",
    restoreNothing: "Keine Käufe zum Wiederherstellen",
    restoreFailed: "Google Play nicht erreichbar",
    finePrint: "Einmalige Zahlungen über Google Play. Die Freischaltung kehrt auf jedem Gerät zurück, das mit demselben Google-Konto angemeldet ist.",
  },

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: {
    title: "Soutenir l'app",
    whyTitle: "Pourquoi soutenir ?",
    whyBody: "Tout dans Nejon Prayer est gratuit, et rien n'est réservé à un paiement. Garder l'app à jour demande du temps et de l'argent chaque mois : si elle t'aide, chaque soutien compte.",
    unlockTitle: "Soutien pour toujours",
    unlockSubtitle: "Un seul paiement, sans abonnement",
    unlockPendingStatus: "En attente de la confirmation de Google Play",
    playUnavailable: "Google Play est injoignable pour le moment",
    supporterThanks: "Merci de soutenir Nejon Prayer",
    benefits: ["Aucune publicité, sur aucun écran", "Un badge de soutien dans l'app", "Aide une app indépendante à continuer"],
    unlockButton: "Débloquer",
    paymentPending: "Paiement en attente",
    tryAgain: "Réessayer",
    supporterSince: "Soutien depuis {date}",
    giftDivider: "ou simplement offrir quelque chose",
    giftTitle: "Cadeau ponctuel",
    giftSubtitle: "Ne retire pas les publicités — juste un merci",
    giftLastKnown: "Derniers prix connus — reconnecte-toi pour offrir",
    giftPending: "Paiement du cadeau en attente — Google Play doit confirmer",
    giftReceived: "Cadeau reçu le {date} — merci",
    giftAlreadyAdFree: "Tu es déjà sans publicité — un cadeau est un soutien en plus",
    gifts: { gift_small: "Petit", gift_medium: "Moyen", gift_large: "Grand" },
    restore: "Restaurer les achats",
    restoreDone: "Soutien restauré",
    restoreNothing: "Aucun achat à restaurer",
    restoreFailed: "Google Play injoignable",
    finePrint: "Paiements uniques, gérés par Google Play. Le déblocage revient sur tout appareil connecté au même compte Google.",
  },

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: {
    title: "Mbështet aplikacionin",
    whyTitle: "Pse të mbështesësh?",
    whyBody: "Gjithçka në Nejon Prayer është falas dhe asgjë nuk kërkon pagesë. Mirëmbajtja e aplikacionit kërkon kohë dhe para çdo muaj, ndaj nëse të ndihmon, çdo mbështetje vlen.",
    unlockTitle: "Mbështetës përgjithmonë",
    unlockSubtitle: "Një pagesë, pa abonim",
    unlockPendingStatus: "Në pritje të konfirmimit nga Google Play",
    playUnavailable: "Google Play nuk arrihet tani",
    supporterThanks: "Faleminderit që e mbështet Nejon Prayer",
    benefits: ["Pa reklama, në asnjë ekran", "Shenja e mbështetësit në aplikacion", "Mban gjallë një aplikacion të pavarur"],
    unlockButton: "Zhblloko",
    paymentPending: "Pagesa në pritje",
    tryAgain: "Provo sërish",
    supporterSince: "Mbështetës që nga {date}",
    giftDivider: "ose thjesht dhuro diçka",
    giftTitle: "Dhuratë e njëhershme",
    giftSubtitle: "Nuk i heq reklamat — vetëm një falënderim",
    giftLastKnown: "Çmimet e fundit të njohura — lidhu për të dhuruar",
    giftPending: "Pagesa e dhuratës në pritje — pret Google Play",
    giftReceived: "Dhurata u pranua më {date} — faleminderit",
    giftAlreadyAdFree: "Je tashmë pa reklama — dhurata është mbështetje shtesë",
    gifts: { gift_small: "E vogël", gift_medium: "E mesme", gift_large: "E madhe" },
    restore: "Rikthe blerjet",
    restoreDone: "Mbështetja u rikthye",
    restoreNothing: "Nuk ka blerje për t'u rikthyer",
    restoreFailed: "Google Play nuk arrihet",
    finePrint: "Pagesa të njëhershme përmes Google Play. Zhbllokimi rikthehet në çdo pajisje me të njëjtën llogari Google.",
  },

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: {
    title: "Podrži aplikaciju",
    whyTitle: "Zašto podržati?",
    whyBody: "Sve u Nejon Prayer je besplatno i ništa nije zaključano iza plaćanja. Održavanje aplikacije svakog mjeseca traži vrijeme i novac, pa ako ti pomaže, svaka podrška pomaže.",
    unlockTitle: "Zauvijek podržavalac",
    unlockSubtitle: "Jedno plaćanje, bez pretplate",
    unlockPendingStatus: "Čeka se potvrda od Google Playa",
    playUnavailable: "Google Play trenutno nije dostupan",
    supporterThanks: "Hvala što podržavaš Nejon Prayer",
    benefits: ["Bez reklama, ni na jednom ekranu", "Oznaka podržavaoca u aplikaciji", "Pomaže nezavisnoj aplikaciji"],
    unlockButton: "Otključaj",
    paymentPending: "Plaćanje na čekanju",
    tryAgain: "Pokušaj ponovo",
    supporterSince: "Podržavalac od {date}",
    giftDivider: "ili samo pokloni nešto",
    giftTitle: "Jednokratni poklon",
    giftSubtitle: "Ne uklanja reklame — samo hvala",
    giftLastKnown: "Posljednje poznate cijene — poveži se da pokloniš",
    giftPending: "Plaćanje poklona na čekanju — čeka se Google Play",
    giftReceived: "Poklon primljen {date} — hvala",
    giftAlreadyAdFree: "Već si bez reklama — poklon je dodatna podrška",
    gifts: { gift_small: "Mali", gift_medium: "Srednji", gift_large: "Veliki" },
    restore: "Vrati kupovine",
    restoreDone: "Podrška vraćena",
    restoreNothing: "Nema kupovina za vraćanje",
    restoreFailed: "Google Play nije dostupan",
    finePrint: "Jednokratna plaćanja preko Google Playa. Otključavanje se vraća na svakom uređaju prijavljenom na isti Google račun.",
  },

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: {
    title: "Поддржи ја апликацијата",
    whyTitle: "Зошто поддршка?",
    whyBody: "Сè во Nejon Prayer е бесплатно и ништо не е заклучено зад плаќање. Одржувањето на апликацијата бара време и пари секој месец, па ако ти помага, секоја поддршка помага.",
    unlockTitle: "Засекогаш поддржувач",
    unlockSubtitle: "Едно плаќање, без претплата",
    unlockPendingStatus: "Се чека потврда од Google Play",
    playUnavailable: "Google Play моментално не е достапен",
    supporterThanks: "Благодариме што го поддржуваш Nejon Prayer",
    benefits: ["Без реклами, на ниту еден екран", "Ознака за поддржувач во апликацијата", "Помага независна апликација да опстане"],
    unlockButton: "Отклучи",
    paymentPending: "Плаќањето е на чекање",
    tryAgain: "Обиди се повторно",
    supporterSince: "Поддржувач од {date}",
    giftDivider: "или само подари нешто",
    giftTitle: "Еднократен подарок",
    giftSubtitle: "Не ги отстранува рекламите — само благодарност",
    giftLastKnown: "Последни познати цени — поврзи се за да подариш",
    giftPending: "Плаќањето за подарокот е на чекање — се чека Google Play",
    giftReceived: "Подарокот е примен на {date} — благодариме",
    giftAlreadyAdFree: "Веќе си без реклами — подарокот е дополнителна поддршка",
    gifts: { gift_small: "Мал", gift_medium: "Среден", gift_large: "Голем" },
    restore: "Врати ги купувањата",
    restoreDone: "Поддршката е вратена",
    restoreNothing: "Нема купувања за враќање",
    restoreFailed: "Google Play не е достапен",
    finePrint: "Еднократни плаќања преку Google Play. Отклучувањето се враќа на секој уред најавен со истата Google сметка.",
  },

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: {
    title: "Uygulamayı destekle",
    whyTitle: "Neden destek?",
    whyBody: "Nejon Prayer'daki her şey ücretsiz ve hiçbir şey ödemeye bağlı değil. Uygulamayı güncel tutmak her ay zaman ve para gerektiriyor; işine yarıyorsa her destek değerli.",
    unlockTitle: "Kalıcı destekçi",
    unlockSubtitle: "Tek ödeme, abonelik yok",
    unlockPendingStatus: "Google Play onayı bekleniyor",
    playUnavailable: "Google Play'e şu anda ulaşılamıyor",
    supporterThanks: "Nejon Prayer'ı desteklediğin için teşekkürler",
    benefits: ["Hiçbir ekranda reklam yok", "Uygulamada destekçi işareti", "Bağımsız bir uygulamanın devamına katkı"],
    unlockButton: "Kilidi aç",
    paymentPending: "Ödeme bekleniyor",
    tryAgain: "Tekrar dene",
    supporterSince: "{date} tarihinden beri destekçi",
    giftDivider: "ya da sadece bir şey hediye et",
    giftTitle: "Tek seferlik hediye",
    giftSubtitle: "Reklamları kaldırmaz — sadece bir teşekkür",
    giftLastKnown: "Bilinen son fiyatlar — hediye için bağlan",
    giftPending: "Hediye ödemesi bekleniyor — Google Play onayı bekleniyor",
    giftReceived: "Hediye {date} tarihinde alındı — teşekkürler",
    giftAlreadyAdFree: "Zaten reklamsızsın — hediye ek bir destek",
    gifts: { gift_small: "Küçük", gift_medium: "Orta", gift_large: "Büyük" },
    restore: "Satın alımları geri yükle",
    restoreDone: "Destekçilik geri yüklendi",
    restoreNothing: "Geri yüklenecek satın alım yok",
    restoreFailed: "Google Play'e ulaşılamıyor",
    finePrint: "Tek seferlik ödemeler Google Play üzerinden yapılır. Kilit, aynı Google hesabıyla giriş yapılan her cihazda geri gelir.",
  },

  // ------------------------------------------------------------
  // Arabic
  // ------------------------------------------------------------
  ar: {
    title: "ادعم التطبيق",
    whyTitle: "لماذا الدعم؟",
    whyBody: "كل ما في Nejon Prayer مجاني، ولا شيء مقفل خلف الدفع. إبقاء التطبيق محدّثًا يتطلب وقتًا ومالًا كل شهر، فإن كان يفيدك فكل دعم يساعد.",
    unlockTitle: "داعم دائم",
    unlockSubtitle: "دفعة واحدة، بلا اشتراك",
    unlockPendingStatus: "بانتظار تأكيد Google Play",
    playUnavailable: "تعذّر الوصول إلى Google Play الآن",
    supporterThanks: "شكرًا لدعمك Nejon Prayer",
    benefits: ["بلا إعلانات في أي شاشة", "شارة الداعم في التطبيق", "يساعد تطبيقًا مستقلًا على الاستمرار"],
    unlockButton: "فتح",
    paymentPending: "الدفع قيد الانتظار",
    tryAgain: "حاول مجددًا",
    supporterSince: "داعم منذ {date}",
    giftDivider: "أو قدّم شيئًا فحسب",
    giftTitle: "هدية لمرة واحدة",
    giftSubtitle: "لا تزيل الإعلانات — مجرد شكر",
    giftLastKnown: "آخر الأسعار المعروفة — اتصل لتقديم هدية",
    giftPending: "دفع الهدية قيد الانتظار — بانتظار Google Play",
    giftReceived: "استُلمت الهدية في {date} — شكرًا",
    giftAlreadyAdFree: "أنت بلا إعلانات بالفعل — الهدية دعم إضافي",
    gifts: { gift_small: "صغيرة", gift_medium: "متوسطة", gift_large: "كبيرة" },
    restore: "استعادة المشتريات",
    restoreDone: "تمت استعادة الدعم",
    restoreNothing: "لا توجد مشتريات لاستعادتها",
    restoreFailed: "تعذّر الوصول إلى Google Play",
    finePrint: "مدفوعات لمرة واحدة عبر Google Play. يعود الفتح على أي جهاز مسجّل بنفس حساب Google.",
  },
};
