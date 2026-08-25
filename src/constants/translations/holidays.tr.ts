import { HolidayName } from "@/types/holiday.types";
import { Language } from "@/types/language.types";

export type HolidaysTranslationsType = {
  name: string;
  description: string;
  info: string;          // 2–3 sentences shown in the info modal
};

export type HolidaysTranslations = {
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  holidays: Record<HolidayName, HolidaysTranslationsType>;
};

export const HOLIDAYS_TR: Record<Language, HolidaysTranslations> = {
  en: {
    headerTitle: "Islamic Holidays",
    headerSubtitle: "Key dates of the Islamic calendar",
    footerText: "Dates are calculated based on the Hijri calendar and may vary by one day depending on moon sighting.",
    holidays: {
      hijri_new_year: {
        name: "Islamic New Year",
        description: "First day of the Hijri year",
        info: "Falls on 1 Muharram and opens the Hijri year, counted from the migration of the Prophet Muhammad (pbuh) from Mecca to Medina in 622 CE. It is not a festival but a quiet occasion for reflection and voluntary worship.",
      },
      ashura: {
        name: "Ashura",
        description: "The day of Ashura",
        info: "On 10 Muharram, Musa (Moses) and his people were delivered from Pharaoh when the sea parted. Fasting this day is a sunnah, kept on the 9th and 10th of Muharram together. It is also the day Imam Husayn, grandson of the Prophet Muhammad (pbuh), was martyred at Karbala in 680 CE.",
      },
      regaib: {
        name: "Laylat al-Raghaib",
        description: "The first holy night of Rajab",
        info: "The first blessed night of Rajab; its name means wishes and longings, for on it believers bring their needs before God. This night opens the three holy months — Rajab, Sha'ban and Ramadan — and is kept with night prayer and Quran recitation.",
      },
      isra_miraj: {
        name: "Isra and Mi'raj",
        description: "The Night Journey and Ascension",
        info: "Marks the night journey of the Prophet Muhammad (pbuh) from Mecca to the Al-Aqsa Mosque in Jerusalem (Isra), and his ascension through the heavens (Mi'raj). The five daily prayers were made obligatory on this night, observed on 27 Rajab.",
      },
      laylat_baraat: {
        name: "Laylat al-Bara'at",
        description: "The night of forgiveness",
        info: "The night of 15 Sha'ban, when deeds are raised and the year ahead is decreed. Known as the night of forgiveness, believers spend it in prayer, seeking pardon for themselves and mercy for those who have died.",
      },
      ramadan_start: {
        name: "Ramadan",
        description: "First day of Ramadan fasting",
        info: "The first day of Ramadan, when Muslims fast from dawn until sunset. Fasting is one of the five pillars of Islam; this month is given to prayer, charity and reciting the Quran, and ends with Eid al-Fitr.",
      },
      laylat_qadr: {
        name: "Laylat al-Qadr",
        description: "The night of the Quran's revelation",
        info: "The night the first verses of the Quran were revealed to the Prophet Muhammad (pbuh). It is sought in the odd nights of the last ten of Ramadan and most widely kept on the 27th. The Quran calls it better than a thousand months (97:3).",
      },
      eid_fitr: {
        name: "Eid al-Fitr",
        description: "Feast of breaking the fast",
        info: "The first day of Shawwal closes the fast of Ramadan with the Eid prayer, family visits and gifts for the children. Sadaqat al-fitr is due from everyone with the means and is given before the prayer, so that all can share in the day.",
      },
      arafah: {
        name: "Day of Arafah",
        description: "The day of standing at Arafah",
        info: "On 9 Dhul-Hijjah pilgrims stand on the plain of Arafah near Mecca — the standing (wuquf) that is the pillar of the Hajj. Those not on pilgrimage are encouraged to fast; the Prophet Muhammad (pbuh) said it expiates the year before and the year after. It falls the day before Eid al-Adha.",
      },
      eid_adha: {
        name: "Eid al-Adha",
        description: "Feast of the sacrifice",
        info: "The tenth of Dhul-Hijjah recalls Ibrahim's readiness to sacrifice his son Ismail, and the ram God gave in his place. It closes the Hajj, and the kurban is due from everyone who owns the nisab; the meat is shared with relatives, neighbours and those in need.",
      },
    },
  },
  de: {
    headerTitle: "Islamische Feiertage",
    headerSubtitle: "Wichtige Daten des islamischen Kalenders",
    footerText: "Die Daten werden nach dem Hijri-Kalender berechnet und können je nach Mondbeobachtung um einen Tag abweichen.",
    holidays: {
      hijri_new_year: {
        name: "Islamisches Neujahr",
        description: "Erster Tag des Hidschra-Jahres",
        info: "Fällt auf den 1. Muharram und eröffnet das Hidschra-Jahr, gezählt ab der Auswanderung des Propheten Muhammad (s.a.v.s.) von Mekka nach Medina im Jahr 622. Es ist kein Fest, sondern ein stiller Anlass zur Besinnung und zum freiwilligen Gebet.",
      },
      ashura: {
        name: "Aschura",
        description: "Der Tag von Aschura",
        info: "Am 10. Muharram wurden Musa (Mose) und sein Volk vor dem Pharao gerettet, als sich das Meer teilte. Das Fasten an diesem Tag ist Sunna und wird am 9. und 10. Muharram zusammen gehalten. Es ist zugleich der Tag, an dem Imam Husain, der Enkel des Propheten Muhammad (s.a.v.s.), 680 in Kerbela den Tod fand.",
      },
      regaib: {
        name: "Regaib-Nacht",
        description: "Die erste heilige Nacht des Radschab",
        info: "Die erste gesegnete Nacht des Radschab; ihr Name bedeutet Wünsche und Sehnsüchte, denn in ihr tragen die Gläubigen ihre Bitten vor Gott. Diese Nacht eröffnet die drei heiligen Monate — Radschab, Schaban und Ramadan — und wird mit Nachtgebet und Koranlesung begangen.",
      },
      isra_miraj: {
        name: "Isra und Mi'radsch",
        description: "Nachtreise und Himmelfahrt",
        info: "Erinnert an die Nachtreise des Propheten Muhammad (s.a.v.s.) von Mekka zur al-Aqsa-Moschee in Jerusalem (Isra) und an seine Himmelfahrt (Miradsch). In dieser Nacht wurden die fünf täglichen Gebete zur Pflicht; sie wird am 27. Radschab begangen.",
      },
      laylat_baraat: {
        name: "Bara'at-Nacht",
        description: "Die Nacht der Vergebung",
        info: "Die Nacht des 15. Schaban, in der die Taten emporgehoben und die Geschicke des kommenden Jahres bestimmt werden. Sie gilt als Nacht der Vergebung: Die Gläubigen verbringen sie im Gebet, bitten um Verzeihung und gedenken der Verstorbenen.",
      },
      ramadan_start: {
        name: "Ramadan",
        description: "Erster Fastentag im Ramadan",
        info: "Der erste Tag des Ramadan, an dem Muslime von der Morgendämmerung bis zum Sonnenuntergang fasten. Das Fasten ist eine der fünf Säulen des Islam; dieser Monat gehört dem Gebet, der Wohltätigkeit und der Koranlesung und endet mit dem Fest des Fastenbrechens.",
      },
      laylat_qadr: {
        name: "Laylat al-Qadr",
        description: "Die Nacht der Offenbarung des Korans",
        info: "Die Nacht, in der dem Propheten Muhammad (s.a.v.s.) die ersten Verse des Korans offenbart wurden. Sie wird in den ungeraden Nächten der letzten zehn Ramadan-Nächte gesucht und meist in der 27. Nacht begangen. Der Koran nennt sie besser als tausend Monate (97:3).",
      },
      eid_fitr: {
        name: "Eid al-Fitr",
        description: "Ramadanfest",
        info: "Der erste Tag des Schawwal beschließt das Fasten des Ramadan mit dem Festgebet, Familienbesuchen und Geschenken für die Kinder. Die Sadaqat al-Fitr ist für alle Bemittelten Pflicht und wird vor dem Festgebet entrichtet, damit alle mitfeiern können.",
      },
      arafah: {
        name: "Tag von Arafat",
        description: "Der Tag des Stehens in Arafat",
        info: "Am 9. Dhu l-Hiddscha stehen die Pilger auf der Ebene von Arafat bei Mekka — dieses Stehen (Wuquf) ist die Säule der Hadsch. Wer nicht pilgert, dem wird das Fasten empfohlen; der Prophet Muhammad (s.a.v.s.) sagte, es tilge die Sünden des vergangenen und des kommenden Jahres. Der Tag liegt unmittelbar vor dem Opferfest.",
      },
      eid_adha: {
        name: "Eid al-Adha",
        description: "Opferfest",
        info: "Der 10. Dhu l-Hiddscha erinnert an Ibrahims Bereitschaft, seinen Sohn Ismail zu opfern, und an den Widder, den Gott an dessen Stelle gab. Das Fest beschließt die Hadsch; das Kurban ist für alle Pflicht, die den Nisab besitzen, und das Fleisch wird mit Verwandten, Nachbarn und Bedürftigen geteilt.",
      },
    },
  },
  fr: {
    headerTitle: "Fêtes islamiques",
    headerSubtitle: "Dates clés du calendrier islamique",
    footerText: "Les dates sont calculées selon le calendrier hégirien et peuvent varier d'un jour selon l'observation de la lune.",
    holidays: {
      hijri_new_year: {
        name: "Nouvel An islamique",
        description: "Premier jour de l'année hégirienne",
        info: "Le 1er Muharram ouvre l'année hégirienne, comptée depuis l'émigration du prophète Muhammad (psl) de La Mecque à Médine en 622. Ce n'est pas une fête, mais un moment de recueillement et d'adoration volontaire.",
      },
      ashura: {
        name: "Achoura",
        description: "Le jour d'Achoura",
        info: "Le 10 Muharram, Moïse et son peuple furent sauvés de Pharaon lorsque la mer s'ouvrit. Le jeûne de ce jour est une sunna, observé les 9 et 10 Muharram ensemble. C'est aussi le jour où l'imam Hussein, petit-fils du prophète Muhammad (psl), fut tué à Kerbala en 680.",
      },
      regaib: {
        name: "Laylat al-Raghaib",
        description: "La première nuit sacrée de Rajab",
        info: "La première nuit bénie de Rajab ; son nom signifie souhaits et aspirations, car les croyants y présentent leurs demandes à Dieu. Cette nuit ouvre les trois mois sacrés — Rajab, Chaabane et Ramadan — et elle est observée par la prière nocturne et la récitation du Coran.",
      },
      isra_miraj: {
        name: "Isra et Mi'raj",
        description: "Le Voyage nocturne et l'Ascension",
        info: "Commémore le voyage nocturne du prophète Muhammad (psl) de La Mecque à la mosquée al-Aqsa à Jérusalem (Isra), puis son ascension à travers les cieux (Miraj). Les cinq prières quotidiennes furent rendues obligatoires cette nuit-là, célébrée le 27 Rajab.",
      },
      laylat_baraat: {
        name: "Laylat al-Bara'at",
        description: "La nuit du pardon",
        info: "La nuit du 15 Chaabane, où les actes sont élevés et où se décide l'année à venir. Appelée nuit du pardon, les croyants la passent en prière, implorant le pardon pour eux-mêmes et la miséricorde pour les défunts.",
      },
      ramadan_start: {
        name: "Ramadan",
        description: "Premier jour du jeûne du Ramadan",
        info: "Premier jour du Ramadan, où les musulmans jeûnent de l'aube au coucher du soleil. Le jeûne est l'un des cinq piliers de l'islam ; ce mois est consacré à la prière, à la charité et à la lecture du Coran, et s'achève par l'Aïd el-Fitr.",
      },
      laylat_qadr: {
        name: "Laylat al-Qadr",
        description: "La nuit de la révélation du Coran",
        info: "La nuit où les premiers versets du Coran furent révélés au prophète Muhammad (psl). On la recherche dans les nuits impaires des dix dernières du Ramadan et on l'observe surtout la 27e. Le Coran la dit meilleure que mille mois (97:3).",
      },
      eid_fitr: {
        name: "Aïd el-Fitr",
        description: "Fête de la rupture du jeûne",
        info: "Le 1er Chawwal clôt le jeûne du Ramadan par la prière de l'Aïd, les visites familiales et des cadeaux pour les enfants. La sadaqat al-fitr incombe à tous ceux qui en ont les moyens et se verse avant la prière, afin que chacun puisse prendre part à la fête.",
      },
      arafah: {
        name: "Jour d'Arafat",
        description: "Le jour de la station à Arafat",
        info: "Le 9 Dhou al-Hijja, les pèlerins se tiennent dans la plaine d'Arafat près de La Mecque : cette station (wuquf) est le pilier du Hajj. Le jeûne est recommandé à ceux qui ne font pas le pèlerinage ; le prophète Muhammad (psl) a dit qu'il efface les péchés de l'année passée et de l'année à venir. Ce jour précède l'Aïd el-Adha.",
      },
      eid_adha: {
        name: "Aïd el-Adha",
        description: "Fête du sacrifice",
        info: "Le 10 Dhou al-Hijja rappelle la disposition d'Abraham à sacrifier son fils Ismaël, et le bélier que Dieu donna à sa place. La fête clôt le Hajj ; le kurban incombe à quiconque possède le nisab, et la viande est partagée avec les proches, les voisins et les nécessiteux.",
      },
    },
  },
  sq: {
    headerTitle: "Festat Islame",
    headerSubtitle: "Datat kryesore të kalendarit islamik",
    footerText: "Datat llogariten bazuar në kalendarin Hixhri dhe mund të ndryshojnë me një ditë në varësi të vëzhgimit të hënës.",
    holidays: {
      hijri_new_year: {
        name: "Viti i ri Islamik",
        description: "Dita e parë e Vitit të Ri Hixhri",
        info: "Viti Hixhri fillon më 1 Muharrem dhe numërohet nga shpërngulja e Muhammedit s.a.v.s. prej Mekës në Medinë në vitin 622. Kjo ditë nuk është festë, por një ditë e qetë përkujtimi dhe ibadeti vullnetar.",
      },
      ashura: {
        name: "Ashura",
        description: "Dita e Ashurasë",
        info: "Më 10 Muharrem, Musait a.s. dhe popullit të tij Zoti u dha shpëtim nga Faraoni, kur u nda deti. Agjërimi i kësaj dite është sunet dhe mbahet më 9 dhe 10 Muharrem bashkë. Kjo është edhe dita kur Imam Hysejni, nipi i Muhammedit s.a.v.s., ra dëshmor në Qerbela në vitin 680.",
      },
      regaib: {
        name: "Nata e Regaibit",
        description: "Nata e Mirë e parë – Regaib",
        info: "Nata e parë e bekuar e muajit Rexheb; emri i saj do të thotë dëshira dhe lutje, sepse besimtarët i drejtohen Zotit me kërkesat e tyre. Kjo natë hap tre muajt e shenjtë — Rexheb, Shaban dhe Ramazan — dhe shënohet me namaz nate dhe lexim të Kuranit.",
      },
      isra_miraj: {
        name: "Isra dhe Miraxhi",
        description: "Udhëtimi i natës dhe ngjitja",
        info: "Kjo natë përkujton udhëtimin e Muhammedit s.a.v.s. prej Mekës në Xhaminë e Aksasë në Jerusalem (Israja) dhe ngjitjen e tij nëpër qiej (Miraxhi). Në këtë natë u bënë obligim pesë namazet e ditës dhe shënohet më 27 Rexheb.",
      },
      laylat_baraat: {
        name: "Nata e Beratit",
        description: "Nata e faljes",
        info: "Nata e 15 e Shabanit, kur veprat ngrihen te Zoti dhe caktohet viti që vjen. Kjo natë njihet si nata e faljes: besimtarët e kalojnë me namaz dhe lutje, duke kërkuar falje për vete dhe mëshirë për të vdekurit.",
      },
      ramadan_start: {
        name: "Ramazani",
        description: "Dita e parë e agjërimit të Ramazanit",
        info: "Dita e parë e Ramazanit, kur muslimanët agjërojnë prej agimit deri në perëndim të diellit. Agjërimi është një nga pesë shtyllat e Islamit; ky muaj i kushtohet namazit, bamirësisë dhe leximit të Kuranit dhe përfundon me Fitër Bajramin.",
      },
      laylat_qadr: {
        name: "Nata e Kadrit",
        description: "Nata e zbritjes së Kuranit",
        info: "Nata në të cilën Muhammedit s.a.v.s. i zbriten ajetet e para të Kuranit. Kjo natë është në dhjetë ditët e fundit të Ramazanit dhe shënohet më së shumti natën e 27-të. Kurani e cilëson më të mirë se një mijë muaj (97:3).",
      },
      eid_fitr: {
        name: "Fitër Bajrami",
        description: "Dita e parë e Fitër Bajramit",
        info: "Dita e parë e Shevalit e mbyll agjërimin e Ramazanit me namazin e Bajramit, vizita familjare dhe dhurata për fëmijët. Sadakatul-fitri (vitrat) është vaxhib për këdo që ka mundësi dhe jepet para namazit të Bajramit, që festa të gëzohet nga të gjithë.",
      },
      arafah: {
        name: "Dita e Arafatit",
        description: "Dita e qëndrimit në Arafat",
        info: "Më 9 Dhulhixhe haxhilerët qëndrojnë në fushën e Arafatit pranë Mekës — ky qëndrim (vukufi) është shtylla e Haxhit. Atyre që nuk janë në haxh u rekomandohet agjërimi; Muhammedi s.a.v.s. ka thënë se ai i shlyen mëkatet e vitit të kaluar dhe të atij që vjen. Kjo ditë bie para Kurban Bajramit.",
      },
      eid_adha: {
        name: "Kurban Bajrami",
        description: "Dita e parë e Kurban Bajramit",
        info: "Dita e 10 e Dhulhixhes përkujton gatishmërinë e Ibrahimit a.s. për të flijuar birin e tij Ismailin a.s. dhe dashin që Zoti dha në vend të tij. Kjo ditë e mbyll Haxhin; kurbani është vaxhib për këdo që zotëron nisabin, dhe mishi ndahet me të afërmit, fqinjët dhe nevojtarët.",
      },
    },
  },
  bs: {
    headerTitle: "Islamski praznici",
    headerSubtitle: "Ključni datumi islamskog kalendara",
    footerText: "Datumi se računaju prema hidžretskom kalendaru i mogu varirati za jedan dan ovisno o posmatranju Mjeseca.",
    holidays: {
      hijri_new_year: {
        name: "Islamska Nova godina",
        description: "Prvi dan hidžretske godine",
        info: "Pada 1. muharrema i otvara hidžretsku godinu, koja se računa od preseljenja Muhammeda s.a.v.s. iz Mekke u Medinu 622. godine. Nije praznik, nego prilika za razmišljanje i dobrovoljni ibadet.",
      },
      ashura: {
        name: "Ašura",
        description: "Dan Ašure",
        info: "Desetog muharrema Musa a.s. i njegov narod spašeni su od faraona kada se more razdvojilo. Post toga dana je sunnet i drži se 9. i 10. muharrema zajedno. To je i dan kada je Imam Husejn, unuk Muhammeda s.a.v.s., poginuo na Kerbeli 680. godine.",
      },
      regaib: {
        name: "Regaib",
        description: "Prva blagoslovljena noć redžeba",
        info: "Prva blagoslovljena noć redžeba; njeno ime znači želje i čežnje, jer se vjernici te noći obraćaju Allahu svojim molbama. Ova noć otvara tri sveta mjeseca — redžeb, šaban i ramazan — i obilježava se noćnim namazom i učenjem Kur'ana.",
      },
      isra_miraj: {
        name: "Isra i Mi'radž",
        description: "Noćno putovanje i uzdignuće",
        info: "Podsjeća na noćno putovanje Muhammeda s.a.v.s. iz Mekke do Mesdžidul-Aksa u Jerusalemu (Isra) i njegovo uzdignuće kroz nebesa (Mi'radž). Te noći propisano je pet dnevnih namaza; obilježava se 27. redžeba.",
      },
      laylat_baraat: {
        name: "Lejletul-Berat",
        description: "Noć oprosta",
        info: "Noć 15. šabana, kada se djela uzdižu i određuje godina koja dolazi. Poznata je kao noć oprosta: vjernici je provode u namazu i dovi, tražeći oprost za sebe i milost za umrle.",
      },
      ramadan_start: {
        name: "Ramazan",
        description: "Prvi dan posta ramazana",
        info: "Prvi dan ramazana, kada muslimani poste od zore do zalaska sunca. Post je jedan od pet stubova islama; ovaj mjesec je posvećen namazu, sadaki i učenju Kur'ana, a završava Ramazanskim Bajramom.",
      },
      laylat_qadr: {
        name: "Lejletul-Kadr",
        description: "Noć objave Kur'ana",
        info: "Noć u kojoj su Muhammedu s.a.v.s. objavljeni prvi ajeti Kur'ana. Traži se u neparnim noćima posljednjih deset noći ramazana, a najviše se obilježava 27. noć. Kur'an je opisuje boljom od hiljadu mjeseci (97:3).",
      },
      eid_fitr: {
        name: "Ramazanski Bajram",
        description: "Mali Bajram",
        info: "Prvi dan ševvala zaključuje ramazanski post bajram-namazom, posjetama rodbini i darovima za djecu. Sadekatul-fitr (vitre) je vadžib za svakoga ko ima mogućnosti i daje se prije bajram-namaza, da bi svi mogli osjetiti radost praznika.",
      },
      arafah: {
        name: "Dan Arefata",
        description: "Dan stajanja na Arefatu",
        info: "Devetog zul-hidždžeta hadžije stoje na Arefatu blizu Mekke — to stajanje (vukuf) je stub hadža. Onima koji nisu na hadžu preporučuje se post; Muhammed s.a.v.s. je rekao da on briše grijehe protekle i naredne godine. Dan pada neposredno pred Kurban Bajram.",
      },
      eid_adha: {
        name: "Kurban Bajram",
        description: "Praznik žrtvovanja",
        info: "Deseti zul-hidždže podsjeća na Ibrahimovu a.s. spremnost da žrtvuje sina Ismaila a.s. i na ovna kojeg je Allah dao umjesto njega. Praznik zaključuje hadž; kurban je vadžib za svakoga ko posjeduje nisab, a meso se dijeli s rodbinom, komšijama i onima u potrebi.",
      },
    },
  },
  mk: {
    headerTitle: "Исламски празници",
    headerSubtitle: "Клучни датуми на исламскиот календар",
    footerText: "Датумите се пресметуваат врз основа на хиџретскиот календар и може да варираат за еден ден во зависност од набљудувањето на Месечината.",
    holidays: {
      hijri_new_year: {
        name: "Исламска Нова година",
        description: "Прв ден од хиџретската година",
        info: "Паѓа на 1 мухарем и ја отвора хиџретската година, која се смета од преселбата на Мухамед с.а.в.с. од Мека во Медина во 622 година. Не е празник, туку прилика за размисла и доброволен ибадет.",
      },
      ashura: {
        name: "Ашура",
        description: "Денот на Ашура",
        info: "На 10 мухарем Муса а.с. и неговиот народ биле спасени од фараонот кога се разделило морето. Постот на овој ден е сунет и се држи на 9 и 10 мухарем заедно. Тоа е и денот кога Имам Хусеин, внукот на Мухамед с.а.в.с., загинал во Кербела во 680 година.",
      },
      regaib: {
        name: "Регаиб",
        description: "Првата света ноќ на Реџеп",
        info: "Првата благословена ноќ на реџеп; нејзиното име значи желби и копнежи, бидејќи верниците таа ноќ Му се обраќаат на Аллах со своите молби. Оваа ноќ ги отвора трите свети месеци — реџеп, шабан и рамазан — и се одбележува со ноќен намаз и учење на Куранот.",
      },
      isra_miraj: {
        name: "Исра и Мираџ",
        description: "Ноќното патување и вознесението",
        info: "Го одбележува ноќното патување на Мухамед с.а.в.с. од Мека до џамијата Ал-Акса во Ерусалим (Исра) и неговото вознесение низ небесата (Мираџ). Таа ноќ биле пропишани петте дневни намази; се одбележува на 27 реџеп.",
      },
      laylat_baraat: {
        name: "Лејлетул-Берат",
        description: "Ноќта на простувањето",
        info: "Ноќта на 15 шабан, кога делата се воздигнуваат и се определува годината што доаѓа. Позната е како ноќ на простувањето: верниците ја поминуваат во намаз и дова, барајќи прошка за себе и милост за починатите.",
      },
      ramadan_start: {
        name: "Рамазан",
        description: "Прв ден од постот на Рамазан",
        info: "Првиот ден од рамазан, кога муслиманите постат од зори до зајдисонце. Постот е еден од петте столбови на исламот; овој месец е посветен на намаз, садака и учење на Куранот и завршува со Рамазан Бајрам.",
      },
      laylat_qadr: {
        name: "Ноќта на Кадр",
        description: "Ноќта на објавувањето на Куранот",
        info: "Ноќта во која на Мухамед с.а.в.с. му биле објавени првите ајети од Куранот. Се бара во непарните ноќи од последните десет ноќи на рамазан, а најмногу се одбележува 27-та ноќ. Куранот ја опишува како подобра од илјада месеци (97:3).",
      },
      eid_fitr: {
        name: "Рамазан Бајрам",
        description: "Празник на крајот на постот",
        info: "Првиот ден од шевал го затвора рамазанскиот пост со бајрам-намаз, посети на роднини и подароци за децата. Садекатул-фитр (витре) е ваџиб за секој што има можност и се дава пред бајрам-намазот, за да можат сите да ја почувствуваат радоста на празникот.",
      },
      arafah: {
        name: "Ден на Арафат",
        description: "Денот на стоењето на Арафат",
        info: "На 9 зулхиџе аџиите стојат на Арафат близу Мека — тоа стоење (вукуф) е столбот на аџилакот. На оние што не се на аџилак им се препорачува пост; Мухамед с.а.в.с. рекол дека тој ги брише гревовите од минатата и од идната година. Денот паѓа непосредно пред Курбан Бајрам.",
      },
      eid_adha: {
        name: "Курбан Бајрам",
        description: "Празник на жртвувањето",
        info: "Десеттиот ден од зулхиџе потсетува на подготвеноста на Ибрахим а.с. да го жртвува синот Исмаил а.с. и на овенот што Аллах го дал наместо него. Празникот го затвора аџилакот; курбанот е ваџиб за секој што поседува нисаб, а месото се дели со роднините, соседите и оние во потреба.",
      },
    },
  },
  tr: {
    headerTitle: "İslami Bayramlar",
    headerSubtitle: "İslam takviminin önemli tarihleri",
    footerText: "Tarihler Hicri takvime göre hesaplanmaktadır ve ay gözlemine bağlı olarak bir gün farklılık gösterebilir.",
    holidays: {
      hijri_new_year: {
        name: "Hicri Yılbaşı",
        description: "Hicri yılın ilk günü",
        info: "1 Muharrem'de başlayan hicri yılın ilk günüdür; takvim, Hz. Muhammed'in (s.a.v.) 622'de Mekke'den Medine'ye hicretiyle başlar. Bayram değil, tefekkür ve nafile ibadet günüdür.",
      },
      ashura: {
        name: "Aşure",
        description: "Aşure günü",
        info: "10 Muharrem'de Hz. Musa (a.s.) ve kavmi, deniz yarılınca Firavun'dan kurtulmuştur. Bu günün orucu sünnettir ve 9 ile 10 Muharrem birlikte tutulur. Ayrıca Hz. Muhammed'in (s.a.v.) torunu Hz. Hüseyin'in 680'de Kerbelâ'da şehit edildiği gündür.",
      },
      regaib: {
        name: "Regaib Kandili",
        description: "Recep ayının ilk kandili",
        info: "Recep ayının ilk mübarek gecesidir; adı arzu ve istekler anlamına gelir, zira müminler o gece dileklerini Allah'a arz eder. Bu gece üç ayların — Recep, Şaban ve Ramazan — başlangıcıdır ve gece namazı ve Kur'an tilavetiyle ihya edilir.",
      },
      isra_miraj: {
        name: "Miraç Kandili",
        description: "Gece yolculuğu ve yükseliş",
        info: "Hz. Muhammed'in (s.a.v.) Mekke'den Kudüs'teki Mescid-i Aksâ'ya gece yolculuğunu (İsrâ) ve göklere yükselişini (Mirac) anar. Beş vakit namaz bu gecede farz kılınmıştır; 27 Recep'te idrak edilir.",
      },
      laylat_baraat: {
        name: "Berat Kandili",
        description: "Affediliş gecesi",
        info: "15 Şaban gecesidir; amellerin yükseltildiği ve gelecek yılın takdir edildiği gecedir. Affediliş gecesi olarak bilinir: müminler geceyi namaz ve dua ile geçirir, kendileri için bağışlanma, vefat edenler için rahmet diler.",
      },
      ramadan_start: {
        name: "Ramazan",
        description: "Ramazan orucunun ilk günü",
        info: "Ramazan'ın ilk günüdür; Müslümanlar şafaktan gün batımına kadar oruç tutar. Oruç İslam'ın beş şartından biridir; bu ay namaz, sadaka ve Kur'an tilavetiyle geçer ve Ramazan Bayramı ile sona erer.",
      },
      laylat_qadr: {
        name: "Kadir Gecesi",
        description: "Kur'an'ın indirildiği gece",
        info: "Kur'an'ın ilk ayetlerinin Hz. Muhammed'e (s.a.v.) indirildiği gecedir. Ramazan'ın son on gecesinin tek gecelerinde aranır, en çok 27. gece ihya edilir. Kur'an onu bin aydan hayırlı olarak niteler (97:3).",
      },
      eid_fitr: {
        name: "Ramazan Bayramı",
        description: "Ramazanın sona ermesinin kutlaması",
        info: "Şevval'in ilk günü Ramazan orucunu bayram namazı, aile ziyaretleri ve çocuklara hediyelerle tamamlar. Fitre, imkânı olan herkese vaciptir ve bayram namazından önce verilir ki bayramı herkes paylaşabilsin.",
      },
      arafah: {
        name: "Arefe Günü",
        description: "Arafat'ta vakfe günü",
        info: "9 Zilhicce'de hacılar Mekke yakınlarındaki Arafat ovasında vakfeye durur; bu vakfe haccın rüknüdür. Hacda olmayanlara oruç tavsiye edilir; Hz. Muhammed (s.a.v.) bu orucun geçmiş ve gelecek yılın günahlarına kefaret olduğunu bildirmiştir. Bu gün Kurban Bayramı'nın hemen öncesindedir.",
      },
      eid_adha: {
        name: "Kurban Bayramı",
        description: "Kurban Bayramı kutlaması",
        info: "10 Zilhicce, Hz. İbrahim'in (a.s.) oğlu Hz. İsmail'i (a.s.) kurban etme teslimiyetini ve Allah'ın onun yerine gönderdiği koçu anar. Bayram haccı tamamlar; kurban, nisaba sahip olan herkese vaciptir ve eti akraba, komşu ve ihtiyaç sahipleriyle paylaşılır.",
      },
    },
  },
  ar: {
    headerTitle: "الأعياد الإسلامية",
    headerSubtitle: "التواريخ الرئيسية للتقويم الإسلامي",
    footerText: "تُحسب التواريخ وفقاً للتقويم الهجري وقد تختلف بيوم واحد تبعاً لرؤية الهلال.",
    holidays: {
      hijri_new_year: {
        name: "رأس السنة الهجرية",
        description: "أول يوم في السنة الهجرية",
        info: "يوافق غرة محرم ويفتتح السنة الهجرية التي تُحسب من هجرة النبي محمد ﷺ من مكة إلى المدينة سنة 622م. ليس عيداً، بل مناسبة للتأمل والعبادة التطوعية.",
      },
      ashura: {
        name: "عاشوراء",
        description: "يوم عاشوراء",
        info: "في العاشر من محرم نجّى الله موسى عليه السلام وقومه من فرعون بانفلاق البحر. وصيام هذا اليوم سنة، ويُصام التاسع والعاشر من محرم معاً. وفيه أيضاً استُشهد الإمام الحسين، حفيد النبي محمد ﷺ، في كربلاء سنة 680م.",
      },
      regaib: {
        name: "ليلة الرغائب",
        description: "أول ليلة مباركة في رجب",
        info: "أول ليلة مباركة من رجب، واسمها من الرغائب أي الأماني، إذ يرفع المؤمنون فيها حاجاتهم إلى الله. وهذه الليلة تفتتح الأشهر الثلاثة — رجب وشعبان ورمضان — وتُحيا بقيام الليل وتلاوة القرآن.",
      },
      isra_miraj: {
        name: "الإسراء والمعراج",
        description: "رحلة الإسراء والمعراج",
        info: "تحيي ذكرى إسراء النبي محمد ﷺ من مكة إلى المسجد الأقصى في القدس، ومعراجه إلى السماوات العُلى. وفي هذه الليلة فُرضت الصلوات الخمس، وتُحيا في السابع والعشرين من رجب.",
      },
      laylat_baraat: {
        name: "ليلة البراءة",
        description: "ليلة المغفرة",
        info: "ليلة النصف من شعبان، تُرفع فيها الأعمال ويُقدَّر فيها أمر العام المقبل. تُعرف بليلة المغفرة: يقضيها المؤمنون في الصلاة والدعاء، يطلبون العفو لأنفسهم والرحمة لموتاهم.",
      },
      ramadan_start: {
        name: "رمضان",
        description: "أول يوم من صيام رمضان",
        info: "أول أيام رمضان، حيث يصوم المسلمون من الفجر إلى غروب الشمس. والصيام ركن من أركان الإسلام الخمسة؛ ويُعمر هذا الشهر بالصلاة والصدقة وتلاوة القرآن، وينتهي بعيد الفطر.",
      },
      laylat_qadr: {
        name: "ليلة القدر",
        description: "ليلة نزول القرآن الكريم",
        info: "الليلة التي نزلت فيها أوائل آيات القرآن على النبي محمد ﷺ. تُلتمس في الأوتار من العشر الأواخر من رمضان، وتُحيا غالباً ليلة السابع والعشرين. ويصفها القرآن بأنها خير من ألف شهر (٩٧:٣).",
      },
      eid_fitr: {
        name: "عيد الفطر",
        description: "عيد الفطر المبارك",
        info: "أول أيام شوال، يختم صيام رمضان بصلاة العيد وصلة الأرحام وإدخال الفرح على الأطفال. وصدقة الفطر واجبة على كل من ملك النصاب، وتُخرَج قبل صلاة العيد ليشارك الجميع في فرحة العيد.",
      },
      arafah: {
        name: "يوم عرفة",
        description: "يوم الوقوف بعرفة",
        info: "في التاسع من ذي الحجة يقف الحجاج بصعيد عرفة قرب مكة، والوقوف ركن الحج الأعظم. ويُستحب صيامه لغير الحاج؛ وقد أخبر النبي محمد ﷺ أنه يكفّر السنة الماضية والسنة الآتية. ويأتي قبل عيد الأضحى بيوم.",
      },
      eid_adha: {
        name: "عيد الأضحى",
        description: "عيد الأضحى المبارك",
        info: "العاشر من ذي الحجة يذكّر باستعداد إبراهيم عليه السلام للتضحية بابنه إسماعيل عليه السلام، وبالكبش الذي فداه الله به. ويختم هذا اليوم موسم الحج؛ والأضحية واجبة على من ملك النصاب، ويُقسَّم لحمها على الأقارب والجيران والمحتاجين.",
      },
    },
  },
};
