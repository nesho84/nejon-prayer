import { Language } from "@/types/language.types";

export type NamaziTableTranslations = {
  tableTitle: string;
  tableSubtitle: string;
  tableRekatetLabel: string;
  tableNameHeader: string;
  tableSunnetHeader: string;
  tableFarzHeader: string;
  tableVitriHeader: string;
  selamiLabel: string;
  rakatLabel: string;
  footerText: string;
};

export const NAMAZI_TABLE_TR: Record<Language, NamaziTableTranslations> = {
  // ------------------------------------------------------------
  // English
  // ------------------------------------------------------------
  en: {
    selamiLabel: "Salam",
    rakatLabel: "Rakat",
    tableNameHeader: "prayer",
    tableRekatetLabel: "rakat",
    tableSunnetHeader: "Sunnah",
    tableFarzHeader: "Fard",
    tableVitriHeader: "Witr",
    tableTitle: "Table of rak'ahs",
    tableSubtitle: "Prayer consists of parts called rak'ahs.",
    footerText: "Every prayer, whether obligatory or sunnah, is performed for the sake of God and no one else.",
  },

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: {
    selamiLabel: "Salam",
    rakatLabel: "Rak'ah",
    tableNameHeader: "Gebet",
    tableRekatetLabel: "Rakat",
    tableSunnetHeader: "Sunna",
    tableFarzHeader: "Pflicht",
    tableVitriHeader: "Witr",
    tableTitle: "Tabelle der Rak'ahs",
    tableSubtitle: "Das Gebet besteht aus Teilen, die Rak'ahs genannt werden.",
    footerText: "Jedes Gebet, ob Pflichtgebet oder Sunna-Gebet, wird um Gottes willen und um niemand anderen willen verrichtet.",
  },

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: {
    selamiLabel: "Salam",
    rakatLabel: "Rak'ah",
    tableNameHeader: "prière",
    tableRekatetLabel: "rakat",
    tableSunnetHeader: "Sunna",
    tableFarzHeader: "Fard",
    tableVitriHeader: "Witr",
    tableTitle: "Tableau des rak'ahs",
    tableSubtitle: "La prière est composée de parties appelées rak'ahs.",
    footerText: "Chaque prière, qu'elle soit obligatoire ou sunna, est accomplie pour l'amour de Dieu et de nul autre.",
  },

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: {
    selamiLabel: "Selami",
    rakatLabel: "Rekati",
    tableNameHeader: "namazi",
    tableRekatetLabel: "rekate",
    tableSunnetHeader: "Sunnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitri",
    tableTitle: "Tabela e rekateve",
    tableSubtitle: "Namazi përbëhet nga pjesët e quajtura rekate.",
    footerText: "Çdo namaz, qoftë farz ose sunnet, falet për hir të Zotit dhe askujt tjetër.",
  },

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: {
    selamiLabel: "Selam",
    rakatLabel: "Rekat",
    tableNameHeader: "namaz",
    tableRekatetLabel: "rekat",
    tableSunnetHeader: "Sunnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitr",
    tableTitle: "Tabela rekata",
    tableSubtitle: "Namaz se sastoji od dijelova koji se zovu rekati.",
    footerText: "Svaki namaz, bio farz ili sunnet, obavlja se radi Allaha i niko drugog.",
  },

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: {
    selamiLabel: "Селам",
    rakatLabel: "Рекат",
    tableNameHeader: "намаз",
    tableRekatetLabel: "рекат",
    tableSunnetHeader: "Сунет",
    tableFarzHeader: "Фарз",
    tableVitriHeader: "Витр",
    tableTitle: "Табела на рекати",
    tableSubtitle: "Намазот се состои од делови наречени рекати.",
    footerText: "Секој намаз, фарз или сунет, се клања заради Аллах и никој друг.",
  },

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: {
    selamiLabel: "Selam",
    rakatLabel: "Rekat",
    tableNameHeader: "Namaz",
    tableRekatetLabel: "Rekat",
    tableSunnetHeader: "Sünnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitr",
    tableTitle: "Rekat Tablosu",
    tableSubtitle: "Namaz, rekat adı verilen bölümlerden oluşur.",
    footerText: "Her namaz, farz veya sünnet olsun, Allah rızası için kılınır ve başka hiç kimse için değil.",
  },

  // ------------------------------------------------------------
  // Arabic
  // ------------------------------------------------------------
  ar: {
    selamiLabel: "السلام",
    rakatLabel: "الركعة",
    tableNameHeader: "الصلاة",
    tableRekatetLabel: "الركعات",
    tableSunnetHeader: "السنة",
    tableFarzHeader: "الفرض",
    tableVitriHeader: "الوتر",
    tableTitle: "جدول الركعات",
    tableSubtitle: "تتكون الصلاة من أجزاء تُسمى ركعات.",
    footerText: "كل صلاة، سواء كانت فرضًا أو سنة، تُؤدّى خالصةً لله وحده.",
  },
};
