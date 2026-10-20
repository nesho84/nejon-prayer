import { FeedbackDonationId, FeedbackImproveId, FeedbackMostUsedId, FeedbackQuestionId } from "@/types/feedback.types";
import { Language } from "@/types/language.types";

export type FeedbackTranslations = {
  // Intro step (the automatic prompt)
  promptTitle: string;
  promptMessage: string;
  promptStart: string;
  promptLater: string;
  promptNever: string;
  // Questionnaire
  questions: Record<FeedbackQuestionId, string>;
  multiHint: string;           // under multiple-choice questions
  optionalHint: string;        // under skippable questions
  messagePlaceholder: string;
  back: string;
  next: string;
  submit: string;
  close: string;
  // Result
  thanksTitle: string;
  thanksMessage: string;
  supportApp: string;
  errorOffline: string;
  errorRateLimited: string;
  errorServer: string;
  // Choice labels, keyed by the ids sent to the server
  mostUsed: Record<FeedbackMostUsedId, string>;
  improve: Record<FeedbackImproveId, string>;
  donation: Record<FeedbackDonationId, string>;
};

export const FEEDBACK_TR: Record<Language, FeedbackTranslations> = {
  // ------------------------------------------------------------
  // English
  // ------------------------------------------------------------
  en: {
    promptTitle: "How do you like Nejon Prayer?",
    promptMessage: "Your feedback helps us improve the app. It takes about a minute.",
    promptStart: "Share feedback",
    promptLater: "Maybe later",
    promptNever: "Don't ask again",

    questions: {
      rating: "How do you like the app?",
      most_used: "Which features do you use most?",
      improve: "What needs improving?",
      donation_interest: "Would you support the app with a donation?",
      message: "What should we improve or add?",
    },
    multiHint: "Select all that apply",
    optionalHint: "Optional",
    messagePlaceholder: "Write your ideas here...",
    back: "Back",
    next: "Next",
    submit: "Send",
    close: "Close",

    thanksTitle: "Thank you!",
    thanksMessage: "Your feedback helps us improve the app.",
    supportApp: "Support the app",
    errorOffline: "No internet connection. Check your connection and try again.",
    errorRateLimited: "Too many submissions today. Please try again tomorrow.",
    errorServer: "Something went wrong. Please try again.",

    mostUsed: {
      prayer_times: "Prayer times",
      notifications: "Notifications",
      tracker: "My Progress",
      qibla: "Qibla",
      quran_read: "Reading the Quran",
      quran_audio: "Listening to the Quran",
      guides: "Wudu & Prayer guides",
      tesbih: "Tasbeeh",
      calendar: "Ramadan & Holidays",
      quotes: "Ayahs & Hadiths",
    },
    improve: {
      design: "Design",
      speed: "Speed",
      prayer_times: "Prayer times",
      notifications: "Notifications",
      quran: "Quran",
      translations: "Translations",
      ads: "Ads",
      features: "More features",
      other: "Other",
    },
    donation: {
      yes: "Yes",
      maybe: "Maybe",
      no: "No",
    },
  },

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: {
    promptTitle: "Wie gefällt dir Nejon Prayer?",
    promptMessage: "Dein Feedback hilft uns, die App zu verbessern. Es dauert etwa eine Minute.",
    promptStart: "Feedback geben",
    promptLater: "Vielleicht später",
    promptNever: "Nicht mehr fragen",

    questions: {
      rating: "Wie gefällt dir die App?",
      most_used: "Welche Funktionen nutzt du am meisten?",
      improve: "Was sollten wir verbessern?",
      donation_interest: "Würdest du die App mit einer Spende unterstützen?",
      message: "Was sollen wir verbessern oder ergänzen?",
    },
    multiHint: "Mehrfachauswahl möglich",
    optionalHint: "Optional",
    messagePlaceholder: "Schreib deine Ideen hier...",
    back: "Zurück",
    next: "Weiter",
    submit: "Senden",
    close: "Schließen",

    thanksTitle: "Danke!",
    thanksMessage: "Dein Feedback hilft uns, die App zu verbessern.",
    supportApp: "App unterstützen",
    errorOffline: "Keine Internetverbindung. Prüfe deine Verbindung und versuche es erneut.",
    errorRateLimited: "Heute wurde zu oft gesendet. Bitte versuche es morgen erneut.",
    errorServer: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",

    mostUsed: {
      prayer_times: "Gebetszeiten",
      notifications: "Benachrichtigungen",
      tracker: "Mein Fortschritt",
      qibla: "Qibla",
      quran_read: "Koran lesen",
      quran_audio: "Koran hören",
      guides: "Wudu & Gebet",
      tesbih: "Tasbih",
      calendar: "Ramadan & Feiertage",
      quotes: "Ayahs & Hadithe",
    },
    improve: {
      design: "Design",
      speed: "Geschwindigkeit",
      prayer_times: "Gebetszeiten",
      notifications: "Benachrichtigungen",
      quran: "Koran",
      translations: "Übersetzungen",
      ads: "Werbung",
      features: "Mehr Funktionen",
      other: "Sonstiges",
    },
    donation: {
      yes: "Ja",
      maybe: "Vielleicht",
      no: "Nein",
    },
  },

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: {
    promptTitle: "Que pensez-vous de Nejon Prayer ?",
    promptMessage: "Votre avis nous aide à améliorer l'application. Cela prend environ une minute.",
    promptStart: "Donner mon avis",
    promptLater: "Plus tard",
    promptNever: "Ne plus demander",

    questions: {
      rating: "Que pensez-vous de l'application ?",
      most_used: "Quelles fonctions utilisez-vous le plus ?",
      improve: "Qu'est-ce qui doit être amélioré ?",
      donation_interest: "Soutiendriez-vous l'application par un don ?",
      message: "Que devrions-nous améliorer ou ajouter ?",
    },
    multiHint: "Plusieurs choix possibles",
    optionalHint: "Facultatif",
    messagePlaceholder: "Écrivez vos idées ici...",
    back: "Retour",
    next: "Suivant",
    submit: "Envoyer",
    close: "Fermer",

    thanksTitle: "Merci !",
    thanksMessage: "Votre avis nous aide à améliorer l'application.",
    supportApp: "Soutenir l'application",
    errorOffline: "Pas de connexion Internet. Vérifiez votre connexion et réessayez.",
    errorRateLimited: "Trop d'envois aujourd'hui. Veuillez réessayer demain.",
    errorServer: "Une erreur s'est produite. Veuillez réessayer.",

    mostUsed: {
      prayer_times: "Horaires de prière",
      notifications: "Notifications",
      tracker: "Ma progression",
      qibla: "Qibla",
      quran_read: "Lire le Coran",
      quran_audio: "Écouter le Coran",
      guides: "Wudu & Prière",
      tesbih: "Tasbeeh",
      calendar: "Ramadan & Fêtes",
      quotes: "Ayahs & Hadiths",
    },
    improve: {
      design: "Design",
      speed: "Rapidité",
      prayer_times: "Horaires de prière",
      notifications: "Notifications",
      quran: "Coran",
      translations: "Traductions",
      ads: "Publicités",
      features: "Plus de fonctions",
      other: "Autre",
    },
    donation: {
      yes: "Oui",
      maybe: "Peut-être",
      no: "Non",
    },
  },

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: {
    promptTitle: "Si të duket Nejon Prayer?",
    promptMessage: "Mendimi yt na ndihmon ta përmirësojmë aplikacionin. Zgjat rreth një minutë.",
    promptStart: "Jep mendimin",
    promptLater: "Më vonë",
    promptNever: "Mos më pyet më",

    questions: {
      rating: "Si të duket aplikacioni?",
      most_used: "Çfarë përdor më shumë?",
      improve: "Çfarë duhet përmirësuar?",
      donation_interest: "A do ta mbështesje aplikacionin me një donacion?",
      message: "Çfarë të përmirësojmë ose të shtojmë?",
    },
    multiHint: "Zgjidh një ose më shumë",
    optionalHint: "Opsionale",
    messagePlaceholder: "Shkruaj idetë e tua këtu...",
    back: "Kthehu",
    next: "Vazhdo",
    submit: "Dërgo",
    close: "Mbyll",

    thanksTitle: "Faleminderit!",
    thanksMessage: "Mendimi yt na ndihmon ta përmirësojmë aplikacionin.",
    supportApp: "Mbështet aplikacionin",
    errorOffline: "Nuk ka internet. Kontrollo lidhjen dhe provo përsëri.",
    errorRateLimited: "Ke dërguar shumë herë sot. Provo përsëri nesër.",
    errorServer: "Diçka shkoi keq. Provo përsëri.",

    mostUsed: {
      prayer_times: "Kohët e namazit",
      notifications: "Njoftimet",
      tracker: "Progresi im",
      qibla: "Kibla",
      quran_read: "Leximi i Kur'anit",
      quran_audio: "Dëgjimi i Kur'anit",
      guides: "Abdesi & Namazi",
      tesbih: "Tesbih",
      calendar: "Ramazani & Festat",
      quotes: "Ajete & Hadithe",
    },
    improve: {
      design: "Dizajni",
      speed: "Shpejtësia",
      prayer_times: "Kohët e namazit",
      notifications: "Njoftimet",
      quran: "Kur'ani",
      translations: "Përkthimet",
      ads: "Reklamat",
      features: "Më shumë funksione",
      other: "Tjetër",
    },
    donation: {
      yes: "Po",
      maybe: "Ndoshta",
      no: "Jo",
    },
  },

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: {
    promptTitle: "Kako vam se sviđa Nejon Prayer?",
    promptMessage: "Vaše mišljenje nam pomaže da poboljšamo aplikaciju. Traje oko minutu.",
    promptStart: "Podijeli mišljenje",
    promptLater: "Možda kasnije",
    promptNever: "Ne pitaj više",

    questions: {
      rating: "Kako vam se sviđa aplikacija?",
      most_used: "Koje funkcije najviše koristite?",
      improve: "Šta treba poboljšati?",
      donation_interest: "Biste li podržali aplikaciju donacijom?",
      message: "Šta da poboljšamo ili dodamo?",
    },
    multiHint: "Možete odabrati više",
    optionalHint: "Neobavezno",
    messagePlaceholder: "Napišite svoje ideje ovdje...",
    back: "Nazad",
    next: "Dalje",
    submit: "Pošalji",
    close: "Zatvori",

    thanksTitle: "Hvala!",
    thanksMessage: "Vaše mišljenje nam pomaže da poboljšamo aplikaciju.",
    supportApp: "Podrži aplikaciju",
    errorOffline: "Nema internet veze. Provjerite vezu i pokušajte ponovo.",
    errorRateLimited: "Previše slanja danas. Pokušajte ponovo sutra.",
    errorServer: "Nešto nije u redu. Pokušajte ponovo.",

    mostUsed: {
      prayer_times: "Vremena namaza",
      notifications: "Obavještenja",
      tracker: "Moj napredak",
      qibla: "Kibla",
      quran_read: "Čitanje Kur'ana",
      quran_audio: "Slušanje Kur'ana",
      guides: "Abdest & Namaz",
      tesbih: "Brojanica",
      calendar: "Ramazan & Praznici",
      quotes: "Ajeti & Hadisi",
    },
    improve: {
      design: "Dizajn",
      speed: "Brzina",
      prayer_times: "Vremena namaza",
      notifications: "Obavještenja",
      quran: "Kur'an",
      translations: "Prijevodi",
      ads: "Reklame",
      features: "Više funkcija",
      other: "Ostalo",
    },
    donation: {
      yes: "Da",
      maybe: "Možda",
      no: "Ne",
    },
  },

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: {
    promptTitle: "Како ви се допаѓа Nejon Prayer?",
    promptMessage: "Вашето мислење ни помага да ја подобриме апликацијата. Трае околу една минута.",
    promptStart: "Сподели мислење",
    promptLater: "Можеби подоцна",
    promptNever: "Не прашувај повеќе",

    questions: {
      rating: "Како ви се допаѓа апликацијата?",
      most_used: "Кои функции најмногу ги користите?",
      improve: "Што треба да се подобри?",
      donation_interest: "Дали би ја поддржале апликацијата со донација?",
      message: "Што да подобриме или додадеме?",
    },
    multiHint: "Можете да изберете повеќе",
    optionalHint: "Незадолжително",
    messagePlaceholder: "Напишете ги вашите идеи тука...",
    back: "Назад",
    next: "Понатаму",
    submit: "Испрати",
    close: "Затвори",

    thanksTitle: "Ви благодариме!",
    thanksMessage: "Вашето мислење ни помага да ја подобриме апликацијата.",
    supportApp: "Поддржи ја апликацијата",
    errorOffline: "Нема интернет врска. Проверете ја врската и обидете се повторно.",
    errorRateLimited: "Премногу испраќања денес. Обидете се повторно утре.",
    errorServer: "Нешто тргна наопаку. Обидете се повторно.",

    mostUsed: {
      prayer_times: "Времиња за намаз",
      notifications: "Известувања",
      tracker: "Мој напредок",
      qibla: "Кибла",
      quran_read: "Читање Куран",
      quran_audio: "Слушање Куран",
      guides: "Абдест & Намаз",
      tesbih: "Тесбих",
      calendar: "Рамазан & Празници",
      quotes: "Ајети & Хадиси",
    },
    improve: {
      design: "Дизајн",
      speed: "Брзина",
      prayer_times: "Времиња за намаз",
      notifications: "Известувања",
      quran: "Куран",
      translations: "Преводи",
      ads: "Реклами",
      features: "Повеќе функции",
      other: "Друго",
    },
    donation: {
      yes: "Да",
      maybe: "Можеби",
      no: "Не",
    },
  },

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: {
    promptTitle: "Nejon Prayer'ı nasıl buldunuz?",
    promptMessage: "Görüşleriniz uygulamayı geliştirmemize yardımcı olur. Yaklaşık bir dakika sürer.",
    promptStart: "Görüş paylaş",
    promptLater: "Belki sonra",
    promptNever: "Bir daha sorma",

    questions: {
      rating: "Uygulamayı nasıl buluyorsunuz?",
      most_used: "En çok hangi özellikleri kullanıyorsunuz?",
      improve: "Neler geliştirilmeli?",
      donation_interest: "Uygulamayı bağışla destekler miydiniz?",
      message: "Neyi geliştirmeli veya eklemeliyiz?",
    },
    multiHint: "Birden fazla seçebilirsiniz",
    optionalHint: "İsteğe bağlı",
    messagePlaceholder: "Fikirlerinizi buraya yazın...",
    back: "Geri",
    next: "İleri",
    submit: "Gönder",
    close: "Kapat",

    thanksTitle: "Teşekkürler!",
    thanksMessage: "Görüşleriniz uygulamayı geliştirmemize yardımcı olur.",
    supportApp: "Uygulamayı destekle",
    errorOffline: "İnternet bağlantısı yok. Bağlantınızı kontrol edip tekrar deneyin.",
    errorRateLimited: "Bugün çok fazla gönderim yapıldı. Lütfen yarın tekrar deneyin.",
    errorServer: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",

    mostUsed: {
      prayer_times: "Namaz vakitleri",
      notifications: "Bildirimler",
      tracker: "İlerlemem",
      qibla: "Kıble",
      quran_read: "Kur'an okuma",
      quran_audio: "Kur'an dinleme",
      guides: "Abdest & Namaz",
      tesbih: "Tesbih",
      calendar: "Ramazan & Bayramlar",
      quotes: "Ayetler & Hadisler",
    },
    improve: {
      design: "Tasarım",
      speed: "Hız",
      prayer_times: "Namaz vakitleri",
      notifications: "Bildirimler",
      quran: "Kur'an",
      translations: "Çeviriler",
      ads: "Reklamlar",
      features: "Daha fazla özellik",
      other: "Diğer",
    },
    donation: {
      yes: "Evet",
      maybe: "Belki",
      no: "Hayır",
    },
  },

  // ------------------------------------------------------------
  // العربية
  // ------------------------------------------------------------
  ar: {
    promptTitle: "ما رأيك في Nejon Prayer؟",
    promptMessage: "رأيك يساعدنا على تحسين التطبيق. يستغرق الأمر دقيقة تقريبًا.",
    promptStart: "شارك رأيك",
    promptLater: "ربما لاحقًا",
    promptNever: "لا تسألني مجددًا",

    questions: {
      rating: "ما رأيك في التطبيق؟",
      most_used: "ما الميزات التي تستخدمها أكثر؟",
      improve: "ما الذي يحتاج إلى تحسين؟",
      donation_interest: "هل تدعم التطبيق بتبرع؟",
      message: "ما الذي يجب أن نحسّنه أو نضيفه؟",
    },
    multiHint: "يمكنك اختيار أكثر من خيار",
    optionalHint: "اختياري",
    messagePlaceholder: "اكتب أفكارك هنا...",
    back: "رجوع",
    next: "التالي",
    submit: "إرسال",
    close: "إغلاق",

    thanksTitle: "شكرًا لك!",
    thanksMessage: "رأيك يساعدنا على تحسين التطبيق.",
    supportApp: "ادعم التطبيق",
    errorOffline: "لا يوجد اتصال بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.",
    errorRateLimited: "عدد كبير من الإرسالات اليوم. يرجى المحاولة غدًا.",
    errorServer: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",

    mostUsed: {
      prayer_times: "مواقيت الصلاة",
      notifications: "الإشعارات",
      tracker: "تقدمي",
      qibla: "القبلة",
      quran_read: "قراءة القرآن",
      quran_audio: "الاستماع إلى القرآن",
      guides: "الوضوء والصلاة",
      tesbih: "التسبيح",
      calendar: "رمضان والأعياد",
      quotes: "آيات وأحاديث",
    },
    improve: {
      design: "التصميم",
      speed: "السرعة",
      prayer_times: "مواقيت الصلاة",
      notifications: "الإشعارات",
      quran: "القرآن",
      translations: "الترجمات",
      ads: "الإعلانات",
      features: "ميزات أكثر",
      other: "أخرى",
    },
    donation: {
      yes: "نعم",
      maybe: "ربما",
      no: "لا",
    },
  },
};
