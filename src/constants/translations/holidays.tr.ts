import { HolidayName } from "@/types/holiday.types";
import { Language } from "@/types/language.types";

export type HolidayTranslations = {
  name: string;
  description: string;
};

export type HolidaysScreenTranslations = {
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  holidays: Record<HolidayName, HolidayTranslations>;
};

export const HOLIDAYS_TR: Record<Language, HolidaysScreenTranslations> = {
  en: {
    headerTitle: "Islamic Holidays",
    headerSubtitle: "Key dates of the Islamic calendar",
    footerText: "Dates are calculated based on the Hijri calendar and may vary by one day depending on moon sighting.",
    holidays: {
      hijri_new_year: { name: "Islamic New Year", description: "First day of the Hijri year" },
      ashura: { name: "Ashura", description: "The day of Ashura" },
      regaib: { name: "Laylat al-Raghaib", description: "The first holy night of Rajab" },
      isra_miraj: { name: "Isra and Mi'raj", description: "The Night Journey and Ascension" },
      laylat_baraat: { name: "Laylat al-Bara'at", description: "The night of forgiveness" },
      ramadan_start: { name: "Ramadan", description: "The holy month of fasting" },
      laylat_qadr: { name: "Laylat al-Qadr", description: "The night of the Quran's revelation" },
      eid_fitr: { name: "Eid al-Fitr", description: "Feast of breaking the fast" },
      arafah: { name: "Day of Arafah", description: "The day of standing at Arafah" },
      eid_adha: { name: "Eid al-Adha", description: "Feast of the sacrifice" },
    },
  },
  de: {
    headerTitle: "Islamische Feiertage",
    headerSubtitle: "Wichtige Daten des islamischen Kalenders",
    footerText: "Die Daten werden nach dem Hijri-Kalender berechnet und können je nach Mondbeobachtung um einen Tag abweichen.",
    holidays: {
      hijri_new_year: { name: "Islamisches Neujahr", description: "Erster Tag des Hidschra-Jahres" },
      ashura: { name: "Aschura", description: "Der Tag von Aschura" },
      regaib: { name: "Regaib-Nacht", description: "Die erste heilige Nacht des Radschab" },
      isra_miraj: { name: "Isra und Mi'radsch", description: "Nachtreise und Himmelfahrt" },
      laylat_baraat: { name: "Bara'at-Nacht", description: "Die Nacht der Vergebung" },
      ramadan_start: { name: "Ramadan", description: "Der heilige Fastenmonat" },
      laylat_qadr: { name: "Laylat al-Qadr", description: "Die Nacht der Offenbarung des Korans" },
      eid_fitr: { name: "Eid al-Fitr", description: "Ramadanfest" },
      arafah: { name: "Tag von Arafat", description: "Der Tag des Stehens in Arafat" },
      eid_adha: { name: "Eid al-Adha", description: "Opferfest" },
    },
  },
  fr: {
    headerTitle: "Fêtes islamiques",
    headerSubtitle: "Dates clés du calendrier islamique",
    footerText: "Les dates sont calculées selon le calendrier hégirien et peuvent varier d'un jour selon l'observation de la lune.",
    holidays: {
      hijri_new_year: { name: "Nouvel An islamique", description: "Premier jour de l'année hégirienne" },
      ashura: { name: "Achoura", description: "Le jour d'Achoura" },
      regaib: { name: "Laylat al-Raghaib", description: "La première nuit sacrée de Rajab" },
      isra_miraj: { name: "Isra et Mi'raj", description: "Le Voyage nocturne et l'Ascension" },
      laylat_baraat: { name: "Laylat al-Bara'at", description: "La nuit du pardon" },
      ramadan_start: { name: "Ramadan", description: "Le mois sacré du jeûne" },
      laylat_qadr: { name: "Laylat al-Qadr", description: "La nuit de la révélation du Coran" },
      eid_fitr: { name: "Aïd el-Fitr", description: "Fête de la rupture du jeûne" },
      arafah: { name: "Jour d'Arafat", description: "Le jour de la station à Arafat" },
      eid_adha: { name: "Aïd el-Adha", description: "Fête du sacrifice" },
    },
  },
  sq: {
    headerTitle: "Festat Islame",
    headerSubtitle: "Datat kryesore të kalendarit islamik",
    footerText: "Datat llogariten bazuar në kalendarin Hixhri dhe mund të ndryshojnë me një ditë në varësi të vëzhgimit të hënës.",
    holidays: {
      hijri_new_year: { name: "Viti i ri Islamik", description: "Dita e parë e vitit Hixhri" },
      ashura: { name: "Ashura", description: "Dita e Ashurës" },
      regaib: { name: "Nata e Regaibit", description: "Nata e parë e mirë e Rexhepit" },
      isra_miraj: { name: "Isra dhe Miraxhi", description: "Udhëtimi i natës dhe ngjitja" },
      laylat_baraat: { name: "Nata e Beratit", description: "Nata e faljes" },
      ramadan_start: { name: "Ramazani", description: "Muaji i shenjtë i Ramazanit" },
      laylat_qadr: { name: "Nata e Kadrit", description: "Nata e zbritjes së Kuranit" },
      eid_fitr: { name: "Fitër Bajrami", description: "Festa e Fitër Bajramit" },
      arafah: { name: "Dita e Arafatit", description: "Dita e qëndrimit në Arafat" },
      eid_adha: { name: "Kurban Bajrami", description: "Festa e Kurban Bajramit" },
    },
  },
  bs: {
    headerTitle: "Islamski praznici",
    headerSubtitle: "Ključni datumi islamskog kalendara",
    footerText: "Datumi se računaju prema hidžretskom kalendaru i mogu varirati za jedan dan ovisno o posmatranju Mjeseca.",
    holidays: {
      hijri_new_year: { name: "Islamska Nova godina", description: "Prvi dan hidžretske godine" },
      ashura: { name: "Ašura", description: "Dan Ašure" },
      regaib: { name: "Regaib", description: "Prva blagoslovljena noć redžeba" },
      isra_miraj: { name: "Isra i Mi'radž", description: "Noćno putovanje i uzdignuće" },
      laylat_baraat: { name: "Lejletul-Berat", description: "Noć oprosta" },
      ramadan_start: { name: "Ramazan", description: "Sveti mjesec posta" },
      laylat_qadr: { name: "Lejletul-Kadr", description: "Noć objave Kur'ana" },
      eid_fitr: { name: "Ramazanski Bajram", description: "Mali Bajram" },
      arafah: { name: "Dan Arefata", description: "Dan stajanja na Arefatu" },
      eid_adha: { name: "Kurban Bajram", description: "Praznik žrtvovanja" },
    },
  },
  mk: {
    headerTitle: "Исламски празници",
    headerSubtitle: "Клучни датуми на исламскиот календар",
    footerText: "Датумите се пресметуваат врз основа на хиџретскиот календар и може да варираат за еден ден во зависност од набљудувањето на Месечината.",
    holidays: {
      hijri_new_year: { name: "Исламска Нова година", description: "Прв ден од хиџретската година" },
      ashura: { name: "Ашура", description: "Денот на Ашура" },
      regaib: { name: "Регаиб", description: "Првата света ноќ на Реџеп" },
      isra_miraj: { name: "Исра и Мираџ", description: "Ноќното патување и вознесението" },
      laylat_baraat: { name: "Лејлетул-Берат", description: "Ноќта на простувањето" },
      ramadan_start: { name: "Рамазан", description: "Светиот месец на пост" },
      laylat_qadr: { name: "Ноќта на Кадр", description: "Ноќта на објавувањето на Куранот" },
      eid_fitr: { name: "Рамазан Бајрам", description: "Празник на крајот на постот" },
      arafah: { name: "Ден на Арафат", description: "Денот на стоењето на Арафат" },
      eid_adha: { name: "Курбан Бајрам", description: "Празник на жртвувањето" },
    },
  },
  tr: {
    headerTitle: "İslami Bayramlar",
    headerSubtitle: "İslam takviminin önemli tarihleri",
    footerText: "Tarihler Hicri takvime göre hesaplanmaktadır ve ay gözlemine bağlı olarak bir gün farklılık gösterebilir.",
    holidays: {
      hijri_new_year: { name: "Hicri Yılbaşı", description: "Hicri yılın ilk günü" },
      ashura: { name: "Aşure", description: "Aşure günü" },
      regaib: { name: "Regaib Kandili", description: "Recep ayının ilk kandili" },
      isra_miraj: { name: "Miraç Kandili", description: "Gece yolculuğu ve yükseliş" },
      laylat_baraat: { name: "Berat Kandili", description: "Affediliş gecesi" },
      ramadan_start: { name: "Ramazan", description: "Mübarek oruç ayı" },
      laylat_qadr: { name: "Kadir Gecesi", description: "Kur'an'ın indirildiği gece" },
      eid_fitr: { name: "Ramazan Bayramı", description: "Ramazanın sona ermesinin kutlaması" },
      arafah: { name: "Arefe Günü", description: "Arafat'ta vakfe günü" },
      eid_adha: { name: "Kurban Bayramı", description: "Kurban Bayramı kutlaması" },
    },
  },
  ar: {
    headerTitle: "الأعياد الإسلامية",
    headerSubtitle: "التواريخ الرئيسية للتقويم الإسلامي",
    footerText: "تُحسب التواريخ وفقاً للتقويم الهجري وقد تختلف بيوم واحد تبعاً لرؤية الهلال.",
    holidays: {
      hijri_new_year: { name: "رأس السنة الهجرية", description: "أول يوم في السنة الهجرية" },
      ashura: { name: "عاشوراء", description: "يوم عاشوراء" },
      regaib: { name: "ليلة الرغائب", description: "أول ليلة مباركة في رجب" },
      isra_miraj: { name: "الإسراء والمعراج", description: "رحلة الإسراء والمعراج" },
      laylat_baraat: { name: "ليلة البراءة", description: "ليلة المغفرة" },
      ramadan_start: { name: "رمضان", description: "الشهر الكريم المبارك" },
      laylat_qadr: { name: "ليلة القدر", description: "ليلة نزول القرآن الكريم" },
      eid_fitr: { name: "عيد الفطر", description: "عيد الفطر المبارك" },
      arafah: { name: "يوم عرفة", description: "يوم الوقوف بعرفة" },
      eid_adha: { name: "عيد الأضحى", description: "عيد الأضحى المبارك" },
    },
  },
};