import { HolidayType } from "@/types/holiday.types";
import { Language } from "@/types/language.types";

export type HolidayTranslations = {
  name: string;
  description: string;
};

export const HOLIDAYS_TR: Record<HolidayType, Record<Language, HolidayTranslations>> = {
  ramadan_start: {
    en: { name: "Ramadan", description: "The holy month of fasting" },
    de: { name: "Ramadan", description: "Der heilige Fastenmonat" },
    fr: { name: "Ramadan", description: "Le mois sacré du jeûne" },
    sq: { name: "Ramazani", description: "Muaji i shenjtë i Ramazanit" },
    bs: { name: "Ramazan", description: "Sveti mjesec posta" },
    mk: { name: "Рамазан", description: "Светиот месец на пост" },
    tr: { name: "Ramazan", description: "Mübarek oruç ayı" },
    ar: { name: "رمضان", description: "الشهر الكريم المبارك" },
  },
  laylat_qadr: {
    en: { name: "Laylat al-Qadr", description: "The night of the Quran's revelation" },
    de: { name: "Laylat al-Qadr", description: "Die Nacht der Offenbarung des Korans" },
    fr: { name: "Laylat al-Qadr", description: "La nuit de la révélation du Coran" },
    sq: { name: "Nata e Kadrit", description: "Nata e zbritjes së Kuranit" },
    bs: { name: "Lejletul-Kadr", description: "Noć objave Kur'ana" },
    mk: { name: "Ноќта на Кадр", description: "Ноќта на објавувањето на Куранот" },
    tr: { name: "Kadir Gecesi", description: "Kur'an'ın indirildiği gece" },
    ar: { name: "ليلة القدر", description: "ليلة نزول القرآن الكريم" },
  },
  eid_fitr: {
    en: { name: "Eid al-Fitr", description: "Feast of breaking the fast" },
    de: { name: "Eid al-Fitr", description: "Ramadanfest" },
    fr: { name: "Aïd el-Fitr", description: "Fête de la rupture du jeûne" },
    sq: { name: "Fitër Bajrami", description: "Festa e Fitër Bajramit" },
    bs: { name: "Ramazanski Bajram", description: "Mali Bajram" },
    mk: { name: "Рамазан Бајрам", description: "Празник на крајот на постот" },
    tr: { name: "Ramazan Bayramı", description: "Ramazanın sona ermesinin kutlaması" },
    ar: { name: "عيد الفطر", description: "عيد الفطر المبارك" },
  },
  eid_adha: {
    en: { name: "Eid al-Adha", description: "Feast of the sacrifice" },
    de: { name: "Eid al-Adha", description: "Opferfest" },
    fr: { name: "Aïd el-Adha", description: "Fête du sacrifice" },
    sq: { name: "Kurban Bajrami", description: "Festa e Kurban Bajramit" },
    bs: { name: "Kurban Bajram", description: "Praznik žrtvovanja" },
    mk: { name: "Курбан Бајрам", description: "Празник на жртвувањето" },
    tr: { name: "Kurban Bayramı", description: "Kurban Bayramı kutlaması" },
    ar: { name: "عيد الأضحى", description: "عيد الأضحى المبارك" },
  },
};