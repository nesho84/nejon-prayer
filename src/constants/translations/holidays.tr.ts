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
        info: "Marks the start of the Hijri year, counted from the Prophet Muhammad's migration from Mecca to Medina in 622 CE. It is a quiet occasion rather than a festival, often marked with reflection and voluntary prayer.",
      },
      ashura: {
        name: "Ashura",
        description: "The day of Ashura",
        info: "Commemorates the day Musa (Moses) and his people were delivered from Pharaoh at the parting of the sea. Many Muslims fast on this day, and for Shia Muslims it is also a day of mourning for Imam Husayn at Karbala.",
      },
      regaib: {
        name: "Laylat al-Raghaib",
        description: "The first holy night of Rajab",
        info: "The first blessed night of Rajab, opening the three sacred months that lead up to Ramadan. It is widely observed in Turkey and the Balkans with extra prayer and Quran recitation.",
      },
      isra_miraj: {
        name: "Isra and Mi'raj",
        description: "The Night Journey and Ascension",
        info: "Commemorates the Prophet Muhammad's night journey from Mecca to Jerusalem and his ascension through the heavens. The five daily prayers were established on this night.",
      },
      laylat_baraat: {
        name: "Laylat al-Bara'at",
        description: "The night of forgiveness",
        info: "The night of forgiveness, observed in the middle of Sha'ban as Ramadan approaches. Many spend it in prayer, seeking pardon and praying for those who have died.",
      },
      ramadan_start: {
        name: "Ramadan",
        description: "First day of Ramadan fasting",
        info: "The first day of the month of fasting, when Muslims abstain from food and drink from dawn until sunset. The month emphasises prayer, charity and Quran recitation, and ends with Eid al-Fitr.",
      },
      laylat_qadr: {
        name: "Laylat al-Qadr",
        description: "The night of the Quran's revelation",
        info: "The night the first verses of the Quran were revealed to the Prophet Muhammad. It falls within the last ten nights of Ramadan, and the Quran describes it as better than a thousand months.",
      },
      eid_fitr: {
        name: "Eid al-Fitr",
        description: "Feast of breaking the fast",
        info: "Closes the fast of Ramadan with a communal morning prayer, family visits and gifts for children. Before the prayer, Muslims give zakat al-fitr so that everyone can share in the celebration.",
      },
      arafah: {
        name: "Day of Arafah",
        description: "The day of standing at Arafah",
        info: "The day pilgrims gather on the plain of Arafah near Mecca, the central rite of the Hajj. Those not on pilgrimage often fast, and the day falls immediately before Eid al-Adha.",
      },
      eid_adha: {
        name: "Eid al-Adha",
        description: "Feast of the sacrifice",
        info: "Commemorates Ibrahim's willingness to sacrifice his son and God's mercy in sparing him. It coincides with the end of the Hajj, and families who are able share sacrificial meat with relatives and those in need.",
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
        info: "Markiert den Beginn des Hidschra-Jahres, gezählt ab der Auswanderung des Propheten Mohammed von Mekka nach Medina im Jahr 622. Es ist kein Fest, sondern ein stiller Anlass zur Besinnung und zum freiwilligen Gebet.",
      },
      ashura: {
        name: "Aschura",
        description: "Der Tag von Aschura",
        info: "Erinnert an den Tag, an dem Musa (Mose) und sein Volk durch die Teilung des Meeres vor dem Pharao gerettet wurden. Viele Muslime fasten an diesem Tag; für Schiiten ist er zugleich ein Trauertag für Imam Husain in Kerbela.",
      },
      regaib: {
        name: "Regaib-Nacht",
        description: "Die erste heilige Nacht des Radschab",
        info: "Die erste gesegnete Nacht des Monats Radschab und Beginn der drei heiligen Monate vor dem Ramadan. In der Türkei und auf dem Balkan wird sie mit zusätzlichem Gebet und Koranlesung begangen.",
      },
      isra_miraj: {
        name: "Isra und Mi'radsch",
        description: "Nachtreise und Himmelfahrt",
        info: "Erinnert an die Nachtreise des Propheten Mohammed von Mekka nach Jerusalem und seine Himmelfahrt. In dieser Nacht wurden die fünf täglichen Gebete festgelegt.",
      },
      laylat_baraat: {
        name: "Bara'at-Nacht",
        description: "Die Nacht der Vergebung",
        info: "Die Nacht der Vergebung in der Mitte des Monats Schaban, kurz vor dem Ramadan. Viele verbringen sie im Gebet, bitten um Verzeihung und beten für die Verstorbenen.",
      },
      ramadan_start: {
        name: "Ramadan",
        description: "Erster Fastentag im Ramadan",
        info: "Der erste Tag des Fastenmonats, in dem Muslime von der Morgendämmerung bis zum Sonnenuntergang auf Essen und Trinken verzichten. Der Monat steht für Gebet, Wohltätigkeit und Koranlesung und endet mit dem Fest des Fastenbrechens.",
      },
      laylat_qadr: {
        name: "Laylat al-Qadr",
        description: "Die Nacht der Offenbarung des Korans",
        info: "Die Nacht, in der dem Propheten Mohammed die ersten Verse des Korans offenbart wurden. Sie fällt in die letzten zehn Nächte des Ramadan; der Koran nennt sie besser als tausend Monate.",
      },
      eid_fitr: {
        name: "Eid al-Fitr",
        description: "Ramadanfest",
        info: "Beendet das Fasten des Ramadan mit einem gemeinsamen Morgengebet, Familienbesuchen und Geschenken für die Kinder. Vor dem Gebet wird die Zakat al-Fitr entrichtet, damit alle mitfeiern können.",
      },
      arafah: {
        name: "Tag von Arafat",
        description: "Der Tag des Stehens in Arafat",
        info: "Der Tag, an dem sich die Pilger auf der Ebene von Arafat bei Mekka versammeln – der zentrale Ritus der Hadsch. Wer nicht auf Pilgerfahrt ist, fastet häufig; der Tag liegt unmittelbar vor dem Opferfest.",
      },
      eid_adha: {
        name: "Eid al-Adha",
        description: "Opferfest",
        info: "Erinnert an Ibrahims Bereitschaft, seinen Sohn zu opfern, und an Gottes Barmherzigkeit, die ihn verschonte. Das Fest fällt auf das Ende der Hadsch; wer kann, teilt das Opferfleisch mit Verwandten und Bedürftigen.",
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
        info: "Marque le début de l'année hégirienne, comptée à partir de l'émigration du prophète Mahomet de La Mecque à Médine en 622. Ce n'est pas une fête, mais une occasion de recueillement et de prière volontaire.",
      },
      ashura: {
        name: "Achoura",
        description: "Le jour d'Achoura",
        info: "Commémore le jour où Moïse et son peuple furent sauvés de Pharaon lors de l'ouverture de la mer. Beaucoup de musulmans jeûnent ce jour-là ; pour les chiites, c'est aussi un jour de deuil pour l'imam Hussein à Kerbala.",
      },
      regaib: {
        name: "Laylat al-Raghaib",
        description: "La première nuit sacrée de Rajab",
        info: "La première nuit bénie du mois de Rajab, qui ouvre les trois mois sacrés précédant le Ramadan. Elle est largement observée en Turquie et dans les Balkans par des prières et la récitation du Coran.",
      },
      isra_miraj: {
        name: "Isra et Mi'raj",
        description: "Le Voyage nocturne et l'Ascension",
        info: "Commémore le voyage nocturne du prophète Mahomet de La Mecque à Jérusalem, puis son ascension à travers les cieux. C'est au cours de cette nuit que les cinq prières quotidiennes furent instituées.",
      },
      laylat_baraat: {
        name: "Laylat al-Bara'at",
        description: "La nuit du pardon",
        info: "La nuit du pardon, observée au milieu du mois de Chaabane, à l'approche du Ramadan. Beaucoup la passent en prière, demandant le pardon et priant pour les défunts.",
      },
      ramadan_start: {
        name: "Ramadan",
        description: "Premier jour du jeûne du Ramadan",
        info: "Premier jour du mois de jeûne, durant lequel les musulmans s'abstiennent de manger et de boire de l'aube au coucher du soleil. Le mois met l'accent sur la prière, la charité et la lecture du Coran, et se termine par l'Aïd el-Fitr.",
      },
      laylat_qadr: {
        name: "Laylat al-Qadr",
        description: "La nuit de la révélation du Coran",
        info: "La nuit où les premiers versets du Coran furent révélés au prophète Mahomet. Elle se situe dans les dix dernières nuits du Ramadan et le Coran la décrit comme meilleure que mille mois.",
      },
      eid_fitr: {
        name: "Aïd el-Fitr",
        description: "Fête de la rupture du jeûne",
        info: "Clôt le jeûne du Ramadan par une prière matinale collective, des visites familiales et des cadeaux pour les enfants. Avant la prière, les musulmans versent la zakat al-fitr afin que tous puissent participer à la fête.",
      },
      arafah: {
        name: "Jour d'Arafat",
        description: "Le jour de la station à Arafat",
        info: "Le jour où les pèlerins se rassemblent dans la plaine d'Arafat, près de La Mecque : le rite central du Hajj. Ceux qui ne sont pas en pèlerinage jeûnent souvent, et ce jour précède immédiatement l'Aïd el-Adha.",
      },
      eid_adha: {
        name: "Aïd el-Adha",
        description: "Fête du sacrifice",
        info: "Commémore la disposition d'Abraham à sacrifier son fils et la miséricorde de Dieu qui l'épargna. La fête coïncide avec la fin du Hajj ; ceux qui en ont les moyens partagent la viande du sacrifice avec leurs proches et les nécessiteux.",
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
        info: "Shënon fillimin e vitit Hixhri, i cili numërohet nga shpërngulja e Profetit Muhamed prej Mekës në Medinë në vitin 622. Nuk është festë, por një ditë e qetë reflektimi dhe lutjeje vullnetare.",
      },
      ashura: {
        name: "Ashura",
        description: "Dita e Ashurasë",
        info: "Përkujton ditën kur Musai (Moisiu) dhe populli i tij shpëtuan nga Faraoni me ndarjen e detit. Shumë muslimanë agjërojnë këtë ditë; për shiitët është edhe ditë zie për Imam Husejnin në Qerbela.",
      },
      regaib: {
        name: "Nata e Regaibit",
        description: "Nata e Mirë e parë – Regaib",
        info: "Nata e parë e bekuar e muajit Rexheb dhe fillimi i tre muajve të shenjtë para Ramazanit. Shënohet gjerësisht në Turqi dhe në Ballkan me lutje dhe lexim të Kuranit.",
      },
      isra_miraj: {
        name: "Isra dhe Miraxhi",
        description: "Udhëtimi i natës dhe ngjitja",
        info: "Përkujton udhëtimin e natës të Profetit Muhamed prej Mekës në Jerusalem dhe ngjitjen e tij në qiej. Në këtë natë u caktuan pesë namazet e ditës.",
      },
      laylat_baraat: {
        name: "Nata e Beratit",
        description: "Nata e faljes",
        info: "Nata e faljes, në mesin e muajit Shaban, para se të nisë Ramazani. Shumë e kalojnë në lutje, duke kërkuar falje dhe duke u lutur për të vdekurit.",
      },
      ramadan_start: {
        name: "Ramazani",
        description: "Dita e parë e agjërimit të Ramazanit",
        info: "Dita e parë e muajit të agjërimit, kur muslimanët heqin dorë nga ushqimi dhe pija nga agimi deri në perëndim. Muaji theksohet me lutje, bamirësi dhe lexim të Kuranit dhe përfundon me Fitër Bajramin.",
      },
      laylat_qadr: {
        name: "Nata e Kadrit",
        description: "Nata e zbritjes së Kuranit",
        info: "Nata kur Profetit Muhamed i zbritën ajetet e para të Kuranit. Bie në dhjetë netët e fundit të Ramazanit dhe Kurani e përshkruan më të mirë se një mijë muaj.",
      },
      eid_fitr: {
        name: "Fitër Bajrami",
        description: "Dita e parë e Fitër Bajramit",
        info: "Mbyll agjërimin e Ramazanit me namazin e përbashkët të mëngjesit, vizita familjare dhe dhurata për fëmijët. Para namazit jepet zekati i fitrit, që festa të ndahet nga të gjithë.",
      },
      arafah: {
        name: "Dita e Arafatit",
        description: "Dita e qëndrimit në Arafat",
        info: "Dita kur haxhilerët mblidhen në rrafshin e Arafatit pranë Mekës – riti kryesor i Haxhit. Ata që nuk janë në haxh shpesh agjërojnë, dhe dita bie menjëherë para Kurban Bajramit.",
      },
      eid_adha: {
        name: "Kurban Bajrami",
        description: "Dita e parë e Kurban Bajramit",
        info: "Përkujton gatishmërinë e Ibrahimit për të flijuar birin e tij dhe mëshirën e Zotit që e shpëtoi. Përkon me fundin e Haxhit; familjet që kanë mundësi ndajnë mishin e kurbanit me të afërmit dhe nevojtarët.",
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
        info: "Označava početak hidžretske godine, koja se računa od preseljenja Poslanika Muhammeda iz Mekke u Medinu 622. godine. Nije praznik u svečanom smislu, nego prilika za razmišljanje i dobrovoljnu molitvu.",
      },
      ashura: {
        name: "Ašura",
        description: "Dan Ašure",
        info: "Podsjeća na dan kada su Musa (Mojsije) i njegov narod spašeni od faraona razdvajanjem mora. Mnogi muslimani toga dana poste, a šiitima je to i dan žalosti za imamom Husejnom na Kerbeli.",
      },
      regaib: {
        name: "Regaib",
        description: "Prva blagoslovljena noć redžeba",
        info: "Prva blagoslovljena noć mjeseca redžeba i početak tri sveta mjeseca prije ramazana. Široko se obilježava u Turskoj i na Balkanu namazom i učenjem Kur'ana.",
      },
      isra_miraj: {
        name: "Isra i Mi'radž",
        description: "Noćno putovanje i uzdignuće",
        info: "Podsjeća na noćno putovanje Poslanika Muhammeda iz Mekke u Jerusalem i njegovo uzdignuće kroz nebesa. Te noći propisano je pet dnevnih namaza.",
      },
      laylat_baraat: {
        name: "Lejletul-Berat",
        description: "Noć oprosta",
        info: "Noć oprosta, koja se obilježava u sredini mjeseca šabana, pred ramazan. Mnogi je provode u namazu, tražeći oprost i moleći za umrle.",
      },
      ramadan_start: {
        name: "Ramazan",
        description: "Prvi dan posta ramazana",
        info: "Prvi dan mjeseca posta, kada se muslimani od zore do zalaska sunca odriču hrane i pića. Mjesec je posvećen namazu, sadaki i učenju Kur'ana, a završava Ramazanskim Bajramom.",
      },
      laylat_qadr: {
        name: "Lejletul-Kadr",
        description: "Noć objave Kur'ana",
        info: "Noć u kojoj su Poslaniku Muhammedu objavljeni prvi ajeti Kur'ana. Pada u posljednjih deset noći ramazana, a Kur'an je opisuje boljom od hiljadu mjeseci.",
      },
      eid_fitr: {
        name: "Ramazanski Bajram",
        description: "Mali Bajram",
        info: "Zaključuje ramazanski post zajedničkim jutarnjim namazom, posjetama rodbini i darovima za djecu. Prije namaza daje se zekatul-fitr kako bi svi mogli učestvovati u prazniku.",
      },
      arafah: {
        name: "Dan Arefata",
        description: "Dan stajanja na Arefatu",
        info: "Dan kada se hadžije skupljaju na Arefatu blizu Mekke – središnji obred hadža. Oni koji nisu na hadžu često poste, a dan pada neposredno pred Kurban Bajram.",
      },
      eid_adha: {
        name: "Kurban Bajram",
        description: "Praznik žrtvovanja",
        info: "Podsjeća na Ibrahimovu spremnost da žrtvuje sina i Božiju milost koja ga je sačuvala. Praznik se poklapa sa završetkom hadža; ko može, dijeli kurbansko meso s rodbinom i onima u potrebi.",
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
        info: "Го означува почетокот на хиџретската година, која се смета од преселбата на пророкот Мухамед од Мека во Медина во 622 година. Не е празник во свечен смисол, туку повод за размисла и доброволна молитва.",
      },
      ashura: {
        name: "Ашура",
        description: "Денот на Ашура",
        info: "Го одбележува денот кога Муса (Мојсеј) и неговиот народ биле спасени од фараонот при разделувањето на морето. Многу муслимани постат тој ден, а за шиитите тоа е и ден на жалост за имамот Хусеин во Кербела.",
      },
      regaib: {
        name: "Регаиб",
        description: "Првата света ноќ на Реџеп",
        info: "Првата благословена ноќ на месецот реџеп и почеток на трите свети месеци пред Рамазан. Широко се одбележува во Турција и на Балканот со молитва и читање на Куранот.",
      },
      isra_miraj: {
        name: "Исра и Мираџ",
        description: "Ноќното патување и вознесението",
        info: "Го одбележува ноќното патување на пророкот Мухамед од Мека до Ерусалим и неговото вознесение низ небесата. Таа ноќ биле пропишани петте дневни молитви.",
      },
      laylat_baraat: {
        name: "Лејлетул-Берат",
        description: "Ноќта на простувањето",
        info: "Ноќта на простувањето, која се одбележува во средината на месецот шабан, пред Рамазан. Многумина ја поминуваат во молитва, барајќи прошка и молејќи се за починатите.",
      },
      ramadan_start: {
        name: "Рамазан",
        description: "Прв ден од постот на Рамазан",
        info: "Првиот ден од месецот на постот, кога муслиманите се воздржуваат од храна и пијалак од зори до зајдисонце. Месецот е посветен на молитва, милосрдие и читање на Куранот и завршува со Рамазан Бајрам.",
      },
      laylat_qadr: {
        name: "Ноќта на Кадр",
        description: "Ноќта на објавувањето на Куранот",
        info: "Ноќта во која на пророкот Мухамед му биле објавени првите стихови од Куранот. Паѓа во последните десет ноќи на Рамазан, а Куранот ја опишува како подобра од илјада месеци.",
      },
      eid_fitr: {
        name: "Рамазан Бајрам",
        description: "Празник на крајот на постот",
        info: "Го затвора постот на Рамазан со заедничка утринска молитва, посети на роднини и подароци за децата. Пред молитвата се дава зекат ал-фитр, за да можат сите да го делат празникот.",
      },
      arafah: {
        name: "Ден на Арафат",
        description: "Денот на стоењето на Арафат",
        info: "Денот кога аџиите се собираат на рамнината Арафат близу Мека – централниот обред на аџилакот. Тие што не се на аџилак често постат, а денот паѓа непосредно пред Курбан Бајрам.",
      },
      eid_adha: {
        name: "Курбан Бајрам",
        description: "Празник на жртвувањето",
        info: "Ја одбележува подготвеноста на Ибрахим да го жртвува својот син и Божјата милост што го спасила. Празникот се совпаѓа со крајот на аџилакот; тие што можат го делат курбанското месо со роднините и со потребните.",
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
        info: "Hicri yılın başlangıcını gösterir; bu takvim Hz. Muhammed'in 622'de Mekke'den Medine'ye hicretiyle başlar. Bayram niteliğinde bir kutlama değil, tefekkür ve nafile ibadet günüdür.",
      },
      ashura: {
        name: "Aşure",
        description: "Aşure günü",
        info: "Hz. Musa ve kavminin denizin yarılmasıyla Firavun'dan kurtulduğu günü anar. Birçok Müslüman bu gün oruç tutar; Şiiler için ayrıca Kerbela'da İmam Hüseyin için matem günüdür.",
      },
      regaib: {
        name: "Regaib Kandili",
        description: "Recep ayının ilk kandili",
        info: "Recep ayının ilk mübarek gecesi ve Ramazan'a giden üç ayların başlangıcıdır. Türkiye'de ve Balkanlar'da namaz ve Kur'an okumakla yaygın olarak ihya edilir.",
      },
      isra_miraj: {
        name: "Miraç Kandili",
        description: "Gece yolculuğu ve yükseliş",
        info: "Hz. Muhammed'in Mekke'den Kudüs'e gece yolculuğunu ve göklere yükselişini anar. Beş vakit namaz bu gecede farz kılınmıştır.",
      },
      laylat_baraat: {
        name: "Berat Kandili",
        description: "Affediliş gecesi",
        info: "Şaban ayının ortasında, Ramazan'a az kalmışken idrak edilen affediliş gecesidir. Birçok kişi geceyi namazla geçirir, bağışlanma diler ve vefat edenler için dua eder.",
      },
      ramadan_start: {
        name: "Ramazan",
        description: "Ramazan orucunun ilk günü",
        info: "Oruç ayının ilk günüdür; Müslümanlar şafaktan gün batımına kadar yemeden içmeden uzak durur. Ay boyunca namaz, sadaka ve Kur'an okumak öne çıkar ve Ramazan Bayramı ile sona erer.",
      },
      laylat_qadr: {
        name: "Kadir Gecesi",
        description: "Kur'an'ın indirildiği gece",
        info: "Kur'an'ın ilk ayetlerinin Hz. Muhammed'e indirildiği gecedir. Ramazan'ın son on gecesi içinde yer alır ve Kur'an onu bin aydan hayırlı olarak niteler.",
      },
      eid_fitr: {
        name: "Ramazan Bayramı",
        description: "Ramazanın sona ermesinin kutlaması",
        info: "Ramazan orucunu toplu bayram namazı, aile ziyaretleri ve çocuklara hediyelerle tamamlar. Namazdan önce fitre verilir, böylece bayramı herkes paylaşabilir.",
      },
      arafah: {
        name: "Arefe Günü",
        description: "Arafat'ta vakfe günü",
        info: "Hacıların Mekke yakınlarındaki Arafat ovasında toplandığı gündür; haccın en önemli rüknüdür. Hacda olmayanlar genellikle oruç tutar ve bu gün Kurban Bayramı'nın hemen öncesine denk gelir.",
      },
      eid_adha: {
        name: "Kurban Bayramı",
        description: "Kurban Bayramı kutlaması",
        info: "Hz. İbrahim'in oğlunu kurban etme teslimiyetini ve Allah'ın onu esirgeyen rahmetini anar. Haccın bitişiyle aynı güne denk gelir; imkânı olanlar kurban etini akrabalarıyla ve ihtiyaç sahipleriyle paylaşır.",
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
        info: "يمثل بداية السنة الهجرية التي تُحسب من هجرة النبي محمد من مكة إلى المدينة عام 622 م. ليس عيداً بالمعنى الاحتفالي، بل مناسبة للتأمل والعبادة التطوعية.",
      },
      ashura: {
        name: "عاشوراء",
        description: "يوم عاشوراء",
        info: "يوم نجاة موسى وقومه من فرعون بانفلاق البحر. يصوم كثير من المسلمين هذا اليوم، وهو عند الشيعة أيضاً يوم حزن على الإمام الحسين في كربلاء.",
      },
      regaib: {
        name: "ليلة الرغائب",
        description: "أول ليلة مباركة في رجب",
        info: "أول ليلة مباركة من شهر رجب، وبداية الأشهر الثلاثة التي تسبق رمضان. تُحيا على نطاق واسع في تركيا والبلقان بالصلاة وقراءة القرآن.",
      },
      isra_miraj: {
        name: "الإسراء والمعراج",
        description: "رحلة الإسراء والمعراج",
        info: "تحيي ذكرى رحلة النبي محمد الليلية من مكة إلى القدس ثم عروجه إلى السماوات. وفي هذه الليلة فُرضت الصلوات الخمس.",
      },
      laylat_baraat: {
        name: "ليلة البراءة",
        description: "ليلة المغفرة",
        info: "ليلة المغفرة في منتصف شهر شعبان، قبيل حلول رمضان. يقضيها كثيرون في الصلاة، طلباً للعفو ودعاءً للموتى.",
      },
      ramadan_start: {
        name: "رمضان",
        description: "أول يوم من صيام رمضان",
        info: "أول يوم من شهر الصيام، حيث يمتنع المسلمون عن الطعام والشراب من الفجر إلى غروب الشمس. شهر تتضاعف فيه الصلاة والصدقة وقراءة القرآن، وينتهي بعيد الفطر.",
      },
      laylat_qadr: {
        name: "ليلة القدر",
        description: "ليلة نزول القرآن الكريم",
        info: "الليلة التي نزلت فيها أوائل آيات القرآن على النبي محمد. تقع في العشر الأواخر من رمضان، ويصفها القرآن بأنها خير من ألف شهر.",
      },
      eid_fitr: {
        name: "عيد الفطر",
        description: "عيد الفطر المبارك",
        info: "يختم صيام رمضان بصلاة العيد جماعةً وزيارة الأهل وإدخال الفرح على الأطفال. وتُدفع زكاة الفطر قبل الصلاة ليشارك الجميع في الفرحة.",
      },
      arafah: {
        name: "يوم عرفة",
        description: "يوم الوقوف بعرفة",
        info: "اليوم الذي يجتمع فيه الحجاج في صعيد عرفة قرب مكة، وهو الركن الأعظم من الحج. ويصوم غير الحاج هذا اليوم غالباً، وهو يسبق عيد الأضحى.",
      },
      eid_adha: {
        name: "عيد الأضحى",
        description: "عيد الأضحى المبارك",
        info: "يحيي ذكرى استعداد إبراهيم للتضحية بابنه ورحمة الله التي فداه بها. يوافق ختام الحج، ويتقاسم القادرون لحم الأضاحي مع الأقارب والمحتاجين.",
      },
    },
  },
};
