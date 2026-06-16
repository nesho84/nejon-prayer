import { Language } from "@/types/language.types";

export type NamaziTableTranslations = {
  headerTitle: string;
  headerSubtitle: string;
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
    headerTitle: "Table of rak'ahs",
    headerSubtitle: "Overview of prayer rak'ahs",
    footerText: "Every prayer, whether obligatory or sunnah, is performed for the sake of God and no one else.",

    selamiLabel: "Salam",
    rakatLabel: "Rakat",
    tableNameHeader: "prayer",
    tableRekatetLabel: "rakat",
    tableSunnetHeader: "Sunnah",
    tableFarzHeader: "Fard",
    tableVitriHeader: "Witr",
  },

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: {
    headerTitle: "Tabelle der Rak'ahs",
    headerSubtitle: "Überblick über die Rak'ahs des Gebets",
    footerText: "Jedes Gebet, ob Pflichtgebet oder Sunna-Gebet, wird um Gottes willen und um niemand anderen willen verrichtet.",
    selamiLabel: "Salam",
    rakatLabel: "Rak'ah",
    tableNameHeader: "Gebet",
    tableRekatetLabel: "Rakat",
    tableSunnetHeader: "Sunna",
    tableFarzHeader: "Pflicht",
    tableVitriHeader: "Witr",
  },

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: {
    headerTitle: "Tableau des rak'ahs",
    headerSubtitle: "Aperçu des rak'ahs de la prière",
    footerText: "Chaque prière, qu'elle soit obligatoire ou sunna, est accomplie pour l'amour de Dieu et de nul autre.",
    selamiLabel: "Salam",
    rakatLabel: "Rak'ah",
    tableNameHeader: "prière",
    tableRekatetLabel: "rakat",
    tableSunnetHeader: "Sunna",
    tableFarzHeader: "Fard",
    tableVitriHeader: "Witr",
  },

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: {
    headerTitle: "Tabela e rekateve",
    headerSubtitle: "Pasqyra e rekateve të namazit",
    footerText: "Çdo namaz, qoftë farz ose sunnet, falet për hir të Zotit dhe askujt tjetër.",

    selamiLabel: "Selami",
    rakatLabel: "Rekati",
    tableNameHeader: "namazi",
    tableRekatetLabel: "rekate",
    tableSunnetHeader: "Sunnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitri",
  },

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: {
    headerTitle: "Tabela rekata",
    headerSubtitle: "Pregled rekata namaza",
    footerText: "Svaki namaz, bio farz ili sunnet, obavlja se radi Allaha i niko drugog.",
    selamiLabel: "Selam",
    rakatLabel: "Rekat",
    tableNameHeader: "namaz",
    tableRekatetLabel: "rekat",
    tableSunnetHeader: "Sunnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitr",
  },

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: {
    headerTitle: "Табела на рекати",
    headerSubtitle: "Преглед на рекатите на намазот",
    footerText: "Секој намаз, фарз или сунет, се клања заради Аллах и никој друг.",

    selamiLabel: "Селам",
    rakatLabel: "Рекат",
    tableNameHeader: "намаз",
    tableRekatetLabel: "рекат",
    tableSunnetHeader: "Сунет",
    tableFarzHeader: "Фарз",
    tableVitriHeader: "Витр",
  },

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: {
    headerTitle: "Rekat Tablosu",
    headerSubtitle: "Namaz rekatlarına genel bakış",
    footerText: "Her namaz, farz veya sünnet olsun, Allah rızası için kılınır ve başka hiç kimse için değil.",
    selamiLabel: "Selam",
    rakatLabel: "Rekat",
    tableNameHeader: "Namaz",
    tableRekatetLabel: "Rekat",
    tableSunnetHeader: "Sünnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitr",
  },

  // ------------------------------------------------------------
  // Arabic
  // ------------------------------------------------------------
  ar: {
    headerTitle: "جدول الركعات",
    headerSubtitle: "نظرة عامة على ركعات الصلاة",
    footerText: "كل صلاة، سواء كانت فرضًا أو سنة، تُؤدّى خالصةً لله وحده.",
    selamiLabel: "السلام",
    rakatLabel: "الركعة",
    tableNameHeader: "الصلاة",
    tableRekatetLabel: "الركعات",
    tableSunnetHeader: "السنة",
    tableFarzHeader: "الفرض",
    tableVitriHeader: "الوتر",
  },
};
