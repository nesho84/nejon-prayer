import { Language } from "@/types/language.types";

export type NamaziTranslations = {
  namaziTab: string;
  headerTitle: string;
  headerSubtitle: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  step6: string;
  step7: string;
  step8: string;
  step9: string;
  step10: string;
  step11: string;
  step12: string;
  footerText: string;
  rekatetTab: string;
  tableNameHeader: string;
  tableRekatetLabel: string;
  tableSunnetHeader: string;
  tableFarzHeader: string;
  tableVitriHeader: string;
  tableTitle: string;
  tableSubtitle: string;
  tableFooter: string;
  surahsTableTitle: string;
};

export type NamaziSurah = {
  name: string;
  arabic: string;
  transliteration: string;
};

// ------------------------------------------------------------
// Surah / Dua data — language-independent (Arabic + transliteration only)
// ------------------------------------------------------------
export const NAMAZI_SURAHS: Record<string, NamaziSurah> = {
  subhaneke: {
    name: "Subhaneke",
    arabic:
      "سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلٰهَ غَيْرُكَ",
    transliteration:
      "Subhaanakal-laahumma wa bihamdika, wa tabaarakasmuka, wa ta'aalaa jadduka, wa laa ilaaha ghayruk.",
  },
  taawwudh: {
    name: "Ta'awwudh",
    arabic: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\nبِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ",
    transliteration: "A'udhu billaahi minash-shaytaanir-rajeem.\nBismillaahir-Rahmaanir-Raheem.",
  },
  fatiha: {
    name: "Al-Fatiha",
    arabic:
      "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ\nالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ\nالرَّحْمٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    transliteration:
      "Bismillaahir-Rahmaanir-Raheem.\nAl-hamdu lillaahi Rabbil-'aalameen.\nAr-Rahmaanir-Raheem.\nMaaliki Yawmid-Deen.\nIyyaaka na'budu wa iyyaaka nasta'een.\nIhdinas-Siraatal-Mustaqeem.\nSiraatal-ladheena an'amta 'alayhim, ghayril-maghdoobi 'alayhim wa lad-daaalleen.",
  },
  ikhlas: {
    name: "Al-Ikhlas",
    arabic:
      "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ\nقُلْ هُوَ اللهُ أَحَدٌ\nاللهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
    transliteration:
      "Bismillaahir-Rahmaanir-Raheem.\nQul huwal-laahu ahad.\nAllaahus-Samad.\nLam yalid wa lam yuulad.\nWa lam yakul-lahu kufuwan ahad.",
  },
  kawthar: {
    name: "Al-Kawthar",
    arabic:
      "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ\nإِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ\nفَصَلِّ لِرَبِّكَ وَانْحَرْ\nإِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
    transliteration:
      "Bismillaahir-Rahmaanir-Raheem.\nInnaa a'taynaakal-Kawthar.\nFasalli li-Rabbika wanhar.\nInna shaani'aka huwal-abtar.",
  },
  attahiyyatu: {
    name: "Attahiyyatu",
    arabic:
      "التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration:
      "Attahiyyaatu lillaahi wassalawaatu wattayyibaat.\nAssalaamu 'alaika ayyuhan-Nabiyyu wa rahmatullaahi wa barakaatuh.\nAssalaamu 'alainaa wa 'alaa 'ibaadillaahis-saaliheen.\nAsh-hadu al-laa ilaaha illallaah,\nwa ash-hadu anna Muhammadan 'abduhu wa rasuuluh.",
  },
  allahummaSalli: {
    name: "Allahumma Salli",
    arabic:
      "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration:
      "Allaahumma salli 'alaa Muhammadin wa 'alaa aali Muhammad,\nkamaa sallayta 'alaa Ibraaheema wa 'alaa aali Ibraaheem,\ninnaka Hameedun Majeed.",
  },
  allahummaBarik: {
    name: "Allahumma Barik",
    arabic:
      "اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration:
      "Allaahumma baarik 'alaa Muhammadin wa 'alaa aali Muhammad,\nkamaa baarakta 'alaa Ibraaheema wa 'alaa aali Ibraaheem,\ninnaka Hameedun Majeed.",
  },
  rabbena: {
    name: "Rabbena",
    arabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ\nرَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    transliteration:
      "Rabbanaa aatinaa fid-dunyaa hasanatan wa fil-aakhirati hasanatan wa qinaa 'adhaaban-naar.\nRabbanaa ghfir lee wa li-waalidayya wa lil-mu'mineena yawma yaqoomul-hisaab.",
  },
};

// ------------------------------------------------------------
// Namazi translations for each language
// ------------------------------------------------------------
export const NAMAZI_TRANSLATIONS: Record<Language, NamaziTranslations> = {
  // ------------------------------------------------------------
  // English
  // ------------------------------------------------------------
  en: {
    namaziTab: "PRAYER",
    headerTitle: "How to Pray",
    headerSubtitle: "Basic guide to 2-rak'ah prayer",
    step1: "Stand facing the Qiblah and make intention in your heart. Raise your hands until your thumbs touch your earlobes and say 'Allahu Akbar' (Allah is the Greatest). Men: Fingers naturally spread, not too tight. Women: Hands up to shoulders.",
    step2: "Place your right hand over the left below the navel (men) or on the chest (women). Recite Subhanaka.",
    step3: "Recite A'udhu, Bismillah, then Surah Fatiha and another Surah (like Ikhlas or Kawthar). Feet parallel, 4 fingers apart (men).",
    step4: "Say 'Allahu Akbar' and bow into Ruku. Back straight, head in line with back, hands on knees with fingers spread (men) or closed (women). Say 3 times:\n\n'Subhaana Rabbiyal Adheem.'\n\n(Glory be to my Lord, the Most Great.)\n\nEyes looking at the place of prostration.",
    step5: "Rise from Ruku saying 'Sami Allahu liman hamidah' and when fully upright say:\n\n'Rabbanaa wa lakal hamd.'\n\n(Allah hears those who praise Him. Our Lord, all praise is for You.)\n\nHands by your sides.",
    step6: "Say 'Allahu Akbar' and prostrate in Sajdah. 7 points must touch the ground: forehead, nose, both palms, both knees, and toes of both feet. Men: stomach raised, thighs away from shins, arms away from sides. Women: body compact. Say 3 times:\n\n'Subhaana Rabbiyal A'laa.'\n\n(Glory be to my Lord, the Most High.)",
    step7: "Say 'Allahu Akbar' and sit up. Left foot flat (men), right foot with toes towards Qiblah. Women: both feet to the right. Stay briefly in this position. You may say:\n\n'Rabbighfir lee, Rabbighfir lee.'\n\n(My Lord, forgive me. My Lord, forgive me.)",
    step8: "Say 'Allahu Akbar' and prostrate again in the second Sajdah with the same position as step 6. Say 3 times:\n\n'Subhaana Rabbiyal A'laa.'\n\nThis completes the first Rak'ah.",
    step9: "Say 'Allahu Akbar' and stand up for the second Rak'ah. Do not raise your hands this time. Repeat steps 3 and 4: Recite Fatiha + Surah, perform Ruku.",
    step10: "After the Ruku of the second Rak'ah, perform steps 5, 6, 7, and 8 (rise from Ruku, perform two Sajdahs).",
    step11: "After the second Sajdah of the second Rak'ah, say 'Allahu Akbar' and sit in Qa'dah (final sitting). Recite Tashahhud, Durood Ibrahim, and supplications. The right index finger is raised when bearing witness.",
    step12: "Turn your head to the right and say 'Assalamu alaikum wa rahmatullah', then turn left and say the same. The prayer is complete. You may make dua after the prayer.",
    footerText: "This is a basic guide to praying 2 rak'ahs. For full details, the exact number of rak'ahs for each prayer, and specific rules, please consult scholars or see the prayer table.",
    rekatetTab: "TABLE OF RAKAT",
    tableNameHeader: "prayer",
    tableRekatetLabel: "rakat",
    tableSunnetHeader: "Sunnah",
    tableFarzHeader: "Fard",
    tableVitriHeader: "Witr",
    tableTitle: "Table of rak'ahs",
    tableSubtitle: "Prayer consists of parts called rak'ahs.",
    tableFooter: "Every prayer, whether obligatory or sunnah, is performed for the sake of God and no one else.",
    surahsTableTitle: "Overview of prayers recited during the obligatory rak'ahs",
  },

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: {
    namaziTab: "GEBET",
    headerTitle: "Wie man betet",
    headerSubtitle: "Grundlegende Anleitung zum 2-Rak'ah-Gebet",
    step1: "Stehe in Richtung Qibla und fasse die Absicht (Niyya) im Herzen. Hebe die Hände, bis die Daumen die Ohrläppchen berühren und sage 'Allahu Akbar' (Allah ist der Größte). Männer: Finger natürlich gespreizt. Frauen: Hände bis zu den Schultern.",
    step2: "Lege die rechte Hand über die linke unterhalb des Nabels (Männer) oder auf der Brust (Frauen). Rezitiere Subhanaka.",
    step3: "Rezitiere A'udhu, Bismillah, dann Sura Fatiha und eine weitere Sura (wie Ikhlas oder Kawthar). Füße parallel, 4 Finger Abstand (Männer).",
    step4: "Sage 'Allahu Akbar' und beuge dich in Ruku. Rücken gerade, Kopf in einer Linie mit dem Rücken, Hände auf den Knien mit gespreizten Fingern (Männer) oder geschlossenen (Frauen). Sage 3-mal:\n\n'Subhaana Rabbiyal Adheem.'\n\n(Gepriesen sei mein Herr, der Allgewaltige.)\n\nAugen auf die Stelle der Niederwerfung gerichtet.",
    step5: "Erhebe dich aus Ruku und sage 'Sami Allahu liman hamidah', und wenn du vollständig aufrecht stehst, sage:\n\n'Rabbanaa wa lakal hamd.'\n\n(Allah hört denjenigen, der Ihn lobpreist. Unser Herr, Dir gebührt alles Lob.)\n\nHände an den Seiten.",
    step6: "Sage 'Allahu Akbar' und wirf dich in Sajdah (Niederwerfung). 7 Punkte müssen den Boden berühren: Stirn, Nase, beide Handflächen, beide Knie und Zehenspitzen beider Füße. Männer: Bauch angehoben, Oberschenkel von Unterschenkeln weg, Arme von den Seiten weg. Frauen: Körper kompakt. Sage 3-mal:\n\n'Subhaana Rabbiyal A'laa.'\n\n(Gepriesen sei mein Herr, der Allerhöchste.)",
    step7: "Sage 'Allahu Akbar' und setze dich auf. Linker Fuß flach (Männer), rechter Fuß mit Zehen zur Qibla. Frauen: beide Füße nach rechts. Verweile kurz in dieser Position. Du kannst sagen:\n\n'Rabbighfir lee, Rabbighfir lee.'\n\n(Mein Herr, vergib mir. Mein Herr, vergib mir.)",
    step8: "Sage 'Allahu Akbar' und wirf dich erneut in die zweite Sajdah mit derselben Position wie in Schritt 6. Sage 3-mal:\n\n'Subhaana Rabbiyal A'laa.'\n\nDamit ist das erste Rakat abgeschlossen.",
    step9: "Sage 'Allahu Akbar' und stehe für das zweite Rakat auf. Hebe diesmal nicht die Hände. Wiederhole die Schritte 3 und 4: Rezitiere Fatiha + Sura, führe Ruku aus.",
    step10: "Nach dem Ruku des zweiten Rakats führe die Schritte 5, 6, 7 und 8 aus (erhebe dich aus Ruku, vollziehe zwei Sajdahs).",
    step11: "Nach der zweiten Sajdah des zweiten Rakats sage 'Allahu Akbar' und setze dich in Qa'dah (abschließendes Sitzen). Rezitiere Tashahhud, Durood Ibrahim und Bittgebete. Der rechte Zeigefinger wird beim Glaubensbekenntnis erhoben.",
    step12: "Drehe deinen Kopf nach rechts und sage 'Assalamu alaikum wa rahmatullah', dann nach links und sage dasselbe. Das Gebet ist abgeschlossen. Du kannst nach dem Gebet Dua machen.",
    footerText: "Dies ist eine kurze Anleitung zum Verrichten von zwei Rak'ahs. Für detaillierte Informationen, die genaue Anzahl der Rak'ahs für jedes Gebet und spezifische Regeln konsultieren Sie bitte Gelehrte oder die Gebetstabelle.",
    rekatetTab: "TABELLE DER RAKAT",
    tableNameHeader: "Gebet",
    tableRekatetLabel: "Rakat",
    tableSunnetHeader: "Sunna",
    tableFarzHeader: "Pflicht",
    tableVitriHeader: "Witr",
    tableTitle: "Tabelle der Rak'ahs",
    tableSubtitle: "Das Gebet besteht aus Teilen, die Rak'ahs genannt werden.",
    tableFooter: "Jedes Gebet, ob Pflichtgebet oder Sunna-Gebet, wird um Gottes willen und um niemand anderen willen verrichtet.",
    surahsTableTitle: "Übersicht der Gebete, die während der Pflicht-Rak'ahs rezitiert werden",
  },

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: {
    namaziTab: "PRIÈRE",
    headerTitle: "Comment Prier",
    headerSubtitle: "Guide de base pour la prière de 2 rak'ahs",
    step1: "Tenez-vous face à la Qibla et faites l'intention dans votre cœur. Levez les mains jusqu'à ce que vos pouces touchent vos lobes d'oreilles et dites 'Allahu Akbar' (Allah est le Plus Grand). Hommes : doigts naturellement écartés. Femmes : mains jusqu'aux épaules.",
    step2: "Placez votre main droite sur la gauche sous le nombril (hommes) ou sur la poitrine (femmes). Récitez Subhanaka.",
    step3: "Récitez A'udhu, Bismillah, puis la Sourate Fatiha et une autre Sourate (comme Ikhlas ou Kawthar). Pieds parallèles, 4 doigts d'écart (hommes).",
    step4: "Dites 'Allahu Akbar' et inclinez-vous en Ruku. Dos droit, tête dans l'axe du dos, mains sur les genoux avec les doigts écartés (hommes) ou fermés (femmes). Dites 3 fois :\n\n'Subhaana Rabbiyal Adheem.'\n\n(Gloire à mon Seigneur, le Très Grand.)\n\nRegard dirigé vers le lieu de prosternation.",
    step5: "Relevez-vous du Ruku en disant 'Sami Allahu liman hamidah' et une fois debout dites :\n\n'Rabbanaa wa lakal hamd.'\n\n(Allah entend ceux qui Le louent. Notre Seigneur, toute louange T'appartient.)\n\nBras le long du corps.",
    step6: "Dites 'Allahu Akbar' et prosternez-vous en Sajdah. 7 points doivent toucher le sol : front, nez, les deux paumes, les deux genoux et les orteils des deux pieds. Hommes : ventre relevé, cuisses éloignées des mollets, bras éloignés des côtés. Femmes : corps compact. Dites 3 fois :\n\n'Subhaana Rabbiyal A'laa.'\n\n(Gloire à mon Seigneur, le Très Haut.)",
    step7: "Dites 'Allahu Akbar' et asseyez-vous. Pied gauche à plat (hommes), pied droit avec les orteils vers la Qibla. Femmes : les deux pieds vers la droite. Restez brièvement dans cette position. Vous pouvez dire :\n\n'Rabbighfir lee, Rabbighfir lee.'\n\n(Mon Seigneur, pardonne-moi. Mon Seigneur, pardonne-moi.)",
    step8: "Dites 'Allahu Akbar' et prosternez-vous à nouveau dans le second Sajdah avec la même position qu'à l'étape 6. Dites 3 fois :\n\n'Subhaana Rabbiyal A'laa.'\n\nCeci complète le premier Rak'ah.",
    step9: "Dites 'Allahu Akbar' et levez-vous pour le second Rak'ah. Ne levez pas les mains cette fois. Répétez les étapes 3 et 4 : récitez Fatiha + Sourate, effectuez le Ruku.",
    step10: "Après le Ruku du second Rak'ah, effectuez les étapes 5, 6, 7 et 8 (relevez-vous du Ruku, effectuez deux Sajdahs).",
    step11: "Après le second Sajdah du second Rak'ah, dites 'Allahu Akbar' et asseyez-vous en Qa'dah (position assise finale). Récitez le Tashahhud, le Durood Ibrahim et les invocations. L'index droit est levé lors du témoignage.",
    step12: "Tournez la tête vers la droite et dites 'Assalamu alaikum wa rahmatullah', puis tournez vers la gauche et dites la même chose. La prière est terminée. Vous pouvez faire du dua après la prière.",
    footerText: "Ceci est un guide de base pour prier 2 rak'ahs. Pour les détails complets, le nombre exact de rak'ahs pour chaque prière et les règles spécifiques, veuillez consulter des savants ou voir le tableau des prières.",
    rekatetTab: "TABLEAU DES RAKAT",
    tableNameHeader: "prière",
    tableRekatetLabel: "rakat",
    tableSunnetHeader: "Sunna",
    tableFarzHeader: "Fard",
    tableVitriHeader: "Witr",
    tableTitle: "Tableau des rak'ahs",
    tableSubtitle: "La prière est composée de parties appelées rak'ahs.",
    tableFooter: "Chaque prière, qu'elle soit obligatoire ou sunna, est accomplie pour l'amour de Dieu et de nul autre.",
    surahsTableTitle: "Aperçu des prières récitées pendant les rak'ahs obligatoires",
  },

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: {
    namaziTab: "NAMAZI",
    headerTitle: "Falja e namazit",
    headerSubtitle: "Udhëzues bazik për namaz prej 2 rekatësh",
    step1: "Qëndro drejt Kibles dhe bëj nijetin me zemër. Ngriji duart derisa gishti i madh të prekë veshin dhe thuaj: 'Allahu Ekber' (Allahu është më i Madhi). Për burrat: Gishtat të hapur dhe jo të shtrënguar fort. Për gratë: Duart ngrihen deri në nivel të supit.",
    step2: "Vendose dorën e djathtë mbi të majtën poshtë kërthizës (burrat) ose mbi gjoks (gratë). Lexo Subhaneken.",
    step3: "Lexo Eudhu, Bismilah, pastaj suren Fatiha dhe një sure tjetër (si Ihlas ose Keuther). Këmbët paralele, me largësi 4 gishta (burrat).",
    step4: "Thuaj 'Allahu Ekber' dhe përkulju në Ruku. Shpina e drejtë, kokë në linjë me shpinën, duart mbi gjunjë me gishta të hapura (burrat) ose të mbyllura (gratë). Thuaj 3 herë:\n\n'Subhane Rabbijel Adhim.'\n\n(I Shenjtë është Zoti im, i Madhi.)\n\nSytë nga vendi i Sexhdes.",
    step5: "Ngrihu nga Ruku duke thënë 'Semi Allahu limen hamideh' dhe kur je drejtuar tërësisht thuaj:\n\n'Rabbena ve lekel hamd.'\n\n(Allahu i dëgjon ata që e lavdërojnë. O Zoti ynë, Ty të takon lavdia.)\n\nDuart anash trupit.",
    step6: "Thuaj 'Allahu Ekber' dhe bie në Sexhde. 7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. Burrat: bërryla e ngritur, bërryti larg nga kërciri, krahët larg nga brinjët. Gratë: të grumbulluar. Thuaj 3 herë:\n\n'Subhane Rabbijel A'la.'\n\n(I Shenjtë është Zoti im, më i Larti.)",
    step7: "Thuaj 'Allahu Ekber' dhe ngrihu ulur. Këmba e majtë e shtrirë (burrat), e djathta me gishta nga Kibla. Gratë: të dy këmbët djathtas. Qëndro pak në këtë pozicion. Mund të thuash:\n\n'Rabbigfir li, Rabbigfir li.'\n\n(O Zoti im më fal, o Zoti im më fal.)",
    step8: "Thuaj 'Allahu Ekber' dhe bie përsëri në Sexhde të dytë me të njëjtin pozicion si hapi 6. Thuaj 3 herë:\n\n'Subhane Rabbijel A'la.'\n\nKjo përfundon Rekatin e parë.",
    step9: "Thuaj 'Allahu Ekber' dhe ngrihu në këmbë për rekatin e dytë. Mos i ngrit duart këtë herë. Përsërit hapin 3 dhe 4: lexo Fatiha + sure, bëj ruku.",
    step10: "Pas Rukus së rekatit të dytë, kryej hapat 5, 6, 7 dhe 8 (ngrihu nga Ruku, bëj dy Sexhde).",
    step11: "Pas Sexhdes së dytë të rekatit të dytë, thuaj 'Allahu Ekber' dhe ulu në Kaade (pozicioni përfundimtar). Lexo Ettehijjatun, Allahumme Sal-li, Allahumme Barik dhe Rabbena duatë. Gishti tregues i dorës së djathtë ngrihet kur thuhet dëshmia.",
    step12: "Kthe kokën djathtas dhe thuaj 'Es-selamu alejkum ve rahmetullah', pastaj ktheje majtas dhe thuaj të njëjtën. Namazi përfundon. Mund të bësh dua pas namazit.",
    footerText: "Ky është një udhëzues bazik për namaz prej 2 rekatësh. Për detaje të plota, numrin e saktë të rekatëve për çdo namaz dhe rregulla specifike, ju lutemi konsultohuni me dijetarët ose shikoni tabelën e rekateve.",
    rekatetTab: "TABELA E REKATEVE",
    tableNameHeader: "namazi",
    tableRekatetLabel: "rekate",
    tableSunnetHeader: "Sunnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitri",
    tableTitle: "Tabela e rekateve",
    tableSubtitle: "Namazi përbëhet nga pjesët e quajtura rekate.",
    tableFooter: "Çdo namaz, qoftë farz ose sunnet, falet për hir të Zotit dhe askujt tjetër.",
    surahsTableTitle: "Pasqyra e lutjeve që thuhen gjatë faljes së farzeve",
  },

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: {
    namaziTab: "NAMAZ",
    headerTitle: "Kako Klanjati",
    headerSubtitle: "Osnovni vodič za namaz od 2 rekata",
    step1: "Stanite okrenuti prema Kibli i učinite nijjet u srcu. Podignite ruke dok palčevi ne dodirnu ušne resice i recite 'Allahu Ekber' (Allah je Najveći). Muškarci: prsti prirodno raspoređeni. Žene: ruke do ramena.",
    step2: "Stavite desnu ruku na lijevu ispod pupka (muškarci) ili na prsa (žene). Recitujte Subhaneke.",
    step3: "Recitujte E'uzu, Bismillu, zatim Suru Fatihu i drugu Suru (poput Ihlasa ili Kevser). Stopala paralelna, 4 prsta razmaka (muškarci).",
    step4: "Recite 'Allahu Ekber' i sagnite se u ruku. Leđa ravna, glava u liniji s leđima, ruke na koljenima s prstima raširenim (muškarci) ili skupljenim (žene). Recite 3 puta:\n\n'Subhane Rabbiyal Azim.'\n\n(Slava mome Gospodaru, Najvećem.)\n\nPogled usmjeren prema mjestu sedžde.",
    step5: "Ustanite iz rukua govoreći 'Semi'allahu limen hamideh' i kada ste potpuno uspravni recite:\n\n'Rabbenā ve lekel hamd.'\n\n(Allah čuje one koji Ga hvale. Gospodaru naš, Tebi pripada svaka hvala.)\n\nRuke uz tijelo.",
    step6: "Recite 'Allahu Ekber' i učinite sedždu. 7 tačaka mora dodirnuti tlo: čelo, nos, oba dlana, oba koljena i prsti oba stopala. Muškarci: trbuh podignut, bedra odvojena od potkoljenica, ruke odvojene od strana. Žene: tijelo skupljeno. Recite 3 puta:\n\n'Subhane Rabbiyal E'ala.'\n\n(Slava mome Gospodaru, Previšnjem.)",
    step7: "Recite 'Allahu Ekber' i sjednite. Lijevo stopalo ravno (muškarci), desno stopalo s prstima prema Kibli. Žene: oba stopala prema desno. Ostanite kratko u ovom položaju. Možete reći:\n\n'Rabbigfir li, Rabbigfir li.'\n\n(Gospodaru moj, oprosti mi. Gospodaru moj, oprosti mi.)",
    step8: "Recite 'Allahu Ekber' i ponovo učinite sedždu u drugoj sedždi s istim položajem kao u koraku 6. Recite 3 puta:\n\n'Subhane Rabbiyal E'ala.'\n\nTime je završen prvi rekat.",
    step9: "Recite 'Allahu Ekber' i ustanite za drugi rekat. Ovog puta ne podižite ruke. Ponovite korake 3 i 4: recitujte Fatihu + Suru, obavite ruku.",
    step10: "Nakon rukua drugog rekata, obavite korake 5, 6, 7 i 8 (ustanite iz rukua, obavite dvije sedžde).",
    step11: "Nakon druge sedžde drugog rekata, recite 'Allahu Ekber' i sjednite u ka'de (konačno sjedenje). Recitujte Ettehijjatu, Salavat i dove. Desni kažiprst se podiže pri svjedočenju.",
    step12: "Okrenite glavu na desno i recite 'Esselamu alejkum ve rahmetullah', zatim okrenite na lijevo i recite isto. Namaz je završen. Možete učiti dovu nakon namaza.",
    footerText: "Ovo je osnovni vodič za klanjanje 2 rekata. Za potpune detalje, tačan broj rekata za svaki namaz i specifična pravila, molimo konsultujte učenjake ili pogledajte tabelu namaza.",
    rekatetTab: "TABELA REKATA",
    tableNameHeader: "namaz",
    tableRekatetLabel: "rekat",
    tableSunnetHeader: "Sunnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitr",
    tableTitle: "Tabela rekata",
    tableSubtitle: "Namaz se sastoji od dijelova koji se zovu rekati.",
    tableFooter: "Svaki namaz, bio farz ili sunnet, obavlja se radi Allaha i niko drugog.",
    surahsTableTitle: "Pregled dova koje se uče tokom klanjanja farzova",
  },

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: {
    namaziTab: "НАМАЗ",
    headerTitle: "Како да Клањате",
    headerSubtitle: "Основен водич за намаз од 2 рекати",
    step1: "Застанете свртени кон Кибла и направете ниет во срцето. Подигнете ги рацете додека палците не го допрат ушното ткиво и речете 'Аллаху Екбер' (Аллах е Највеликиот). Мажи: прстите природно раширени. Жени: рацете до рамената.",
    step2: "Ставете ја десната рака над левата под папокот (мажи) или на градите (жени). Рецитирајте Субханеке.",
    step3: "Рецитирајте Е'узу, Бисмилла, потоа Сура Фатиха и друга Сура (како Ихлас или Кевсер). Стапалата паралелни, 4 прста растојание (мажи).",
    step4: "Речете 'Аллаху Екбер' и наведнете се во руку. Грбот рамен, главата во линија со грбот, рацете на колената со прстите раширени (мажи) или затворени (жени). Речете 3 пати:\n\n'Субхане Рабиjал Азим.'\n\n(Слава на мојот Господар, Највеликиот.)\n\nПогледот насочен кон местото на седжда.",
    step5: "Исправете се од руку говорејќи 'Семи'аллаху лимен хамидех' и кога сте целосно исправени речете:\n\n'Рабенā ве лекел хамд.'\n\n(Аллах ги слуша оние кои Го фалат. Господару наш, Тебе Ти припаѓа секоја фала.)\n\nРацете покрај телото.",
    step6: "Речете 'Аллаху Екбер' и учинете седжда. 7 точки мора да го допрат тлото: чело, нос, двете дланки, двете колена и прстите на двете стапала. Мажи: стомакот подигнат, бутовите одвоени од потколениците, рацете одвоени од страните. Жени: телото собрано. Речете 3 пати:\n\n'Субхане Рабиjал Е'ала.'\n\n(Слава на мојот Господар, Превисокиот.)",
    step7: "Речете 'Аллаху Екбер' и седнете. Левото стапало рамно (мажи), десното стапало со прстите кон Кибла. Жени: двете стапала кон десно. Останете кратко во оваа позиција. Можете да речете:\n\n'Рабигфир ли, Рабигфир ли.'\n\n(Господару мој, прости ми. Господару мој, прости ми.)",
    step8: "Речете 'Аллаху Екбер' и повторно учинете седжда со иста позиција како во чекор 6. Речете 3 пати:\n\n'Субхане Рабиjал Е'ала.'\n\nСо тоа е завршен првиот рекат.",
    step9: "Речете 'Аллаху Екбер' и станете за вториот рекат. Овој пат не ги подигнувајте рацете. Повторете ги чекори 3 и 4: рецитирајте Фатиха + Сура, учинете руку.",
    step10: "По руку на вториот рекат, учинете ги чекори 5, 6, 7 и 8 (исправете се од руку, учинете две седжди).",
    step11: "По втората седжда на вториот рекат, речете 'Аллаху Екбер' и седнете во ка'де (конечно седење). Рецитирајте Еттехиjjату, Салават и дови. Десниот показалец се подига при сведочењето.",
    step12: "Свртете ја главата надесно и речете 'Есселаму алеjкум ве рахметулла', потоа свртете налево и речете исто. Намазот е завршен. Можете да учите дова по намазот.",
    footerText: "Ова е основен водич за клањање 2 рекати. За целосни детали, точниот број рекати за секој намаз и специфичните правила, консултирајте учени луѓе или погледајте ја табелата на намази.",
    rekatetTab: "ТАБЕЛА НА РЕКАТИ",
    tableNameHeader: "намаз",
    tableRekatetLabel: "рекат",
    tableSunnetHeader: "Сунет",
    tableFarzHeader: "Фарз",
    tableVitriHeader: "Витр",
    tableTitle: "Табела на рекати",
    tableSubtitle: "Намазот се состои од делови наречени рекати.",
    tableFooter: "Секој намаз, фарз или сунет, се клања заради Аллах и никој друг.",
    surahsTableTitle: "Преглед на молитвите кои се читаат за време на фарз рекатите",
  },

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: {
    namaziTab: "Namaz",
    headerTitle: "Namaz Kılma",
    headerSubtitle: "2 rekat namaz için temel rehber",
    step1: "Kıbleye dönün ve kalben niyet edin. Elleriniz başparmaklar kulak memelerine gelecek şekilde kaldırın ve 'Allahu Ekber' deyin. Erkekler: Parmaklar doğal olarak açık, sıkılmamış. Kadınlar: Eller omuz hizasına kadar kaldırılır.",
    step2: "Sağ elinizi solunuzun üzerine göbek altına (erkekler) veya göğsüne (kadınlar) koyun. İstiftah duasını okuyun.",
    step3: "Eudhu, Besmele'yi okuyun, sonra Fatiha suresini ve başka bir sure (örneğin İhlas veya Kevser) okuyun. Ayaklar paralel, aralarında dört parmak mesafe (erkekler).",
    step4: "'Allahu Ekber' deyin ve rükûa gidin. Sırt düz, baş sırtla hizalı, eller dizlere açık (erkekler) veya kapalı (kadınlar). Üç kez söyleyin:\n\nSubhane Rabbijel Adhim.\n\n(Rabbim çok yücedir).\n\nGözler secde yerindedir.",
    step5: "Rükûdan 'Semi Allahu limen hamideh' diyerek kalkın ve tam ayağa kalktığınızda söyleyin:\n\nRabbena ve lekel hamd.\n\n(Allah, kendisini hamd ile övenleri işitir. Ey Rabbimiz, hamd sana aittir).\n\nEller vücudun yanında.",
    step6: "'Allahu Ekber' deyin ve secdeye gidin. Yedi organın yere temas etmesi gerekir: Alın, burun, iki avuç, iki diz ve ayak parmaklarının uçları. Erkekler: Dirsekler kalkık, karnı uyluklardan uzak, kollar kaburga kemiklerinden uzak. Kadınlar: Vücut toplanmış. Üç kez söyleyin:\n\nSubhane Rabbijel A'la.\n\n(Rabbim çok yüksektir).",
    step7: "'Allahu Ekber' deyin ve oturun. Erkekler: Sol ayak açık, sağ ayak dik ve parmakları kıbleye dönük. Kadınlar: Her iki ayak sağa doğru. Biraz bu pozisyonda kalın. Şöyle diyebilirsiniz:\n\nRabbigfir li, Rabbigfir li.\n\n(Ey Rabbim beni bağışla, ey Rabbim beni bağışla).",
    step8: "'Allahu Ekber' deyin ve ikinci secdeye aynı şekilde gidin. Üç kez söyleyin:\n\nSubhane Rabbijel A'la.\n\nBöylece ilk rekat tamamlanır.",
    step9: "'Allahu Ekber' deyin ve ikinci rekata kalkın, bu sefer ellerinizi kaldırmayın. 3. ve 4. adımları tekrarlayın: Fatiha + sure okuyun, sonra rükûa gidin.",
    step10: "İkinci rekatın rükûundan sonra, önceki gibi kalkın ve iki secdeyi yapın.",
    step11: "İkinci rekatın ikinci secdesinden sonra, 'Allahu Ekber' deyin ve oturun. Ettehiyyatü, Allahumme Sal-li, Allahumme Barik ve Rabbena dualarını okuyun. Sağ elin işaret parmağı şehadet getirilirken kaldırılır.",
    step12: "Sağa selam vererek 'Es-selamu alejkum ve rahmetullah' deyin, sonra sola dönün ve aynı şeyi söyleyin. Namaz tamamlanır. Namazdan sonra dua edebilirsiniz.",
    footerText: "Bu, 2 rekat namaz için temel bir rehberdir. Detaylar, her namaz için doğru rekat sayısı ve özel kurallar için lütfen alimlere danışın veya rekat tablosuna bakın.",
    rekatetTab: "Rekat Tablosu",
    tableNameHeader: "Namaz",
    tableRekatetLabel: "Rekat",
    tableSunnetHeader: "Sünnet",
    tableFarzHeader: "Farz",
    tableVitriHeader: "Vitr",
    tableTitle: "Rekat Tablosu",
    tableSubtitle: "Namaz, rekat adı verilen bölümlerden oluşur.",
    tableFooter: "Her namaz, farz veya sünnet olsun, Allah rızası için kılınır ve başka hiç kimse için değil.",
    surahsTableTitle: "Farz rekatlarda okunan duaların özeti",
  },

  // ------------------------------------------------------------
  // العربية
  // ------------------------------------------------------------
  ar: {
    namaziTab: "الصلاة",
    headerTitle: "كيفية الصلاة",
    headerSubtitle: "دليل مبسط لصلاة ركعتين",
    step1: "قف متجهًا إلى القبلة وانْوِ الصلاة في قلبك. ارفع يديك حتى تحاذي الإبهامان شحمتي الأذنين وقل: الله أكبر. الرجال: الأصابع مفرقة طبيعيًا دون تشديد. النساء: ترفع اليدان إلى مستوى الكتفين.",
    step2: "ضع يدك اليمنى فوق اليسرى أسفل السرة (للرجال) أو على الصدر (للنساء). اقرأ دعاء الاستفتاح.",
    step3: "اقرأ الاستعاذة والبسملة، ثم سورة الفاتحة وسورة أخرى (مثل الإخلاص أو الكوثر). تكون القدمان متوازيتين وبينهما مسافة أربع أصابع (للرجال).",
    step4: "قل: الله أكبر، ثم اركع. يكون الظهر مستقيمًا والرأس بمحاذاته، وتوضع اليدان على الركبتين مع تفريق الأصابع (للرجال) أو ضمها (للنساء). قل ثلاث مرات:\n\nسبحان ربي العظيم.\n\n(تنزيهًا لربي العظيم).\n\nويكون النظر إلى موضع السجود.",
    step5: "ارفع من الركوع قائلاً: سمع الله لمن حمده، وعند الوقوف التام قل:\n\nربنا ولك الحمد.\n\n(سمع الله لمن حمده، ربنا لك الحمد).\n\nوتكون اليدان بمحاذاة الجانبين.",
    step6: "قل: الله أكبر، واسجد. يجب أن تلامس الأرض سبعة أعضاء: الجبهة، الأنف، الكفان، الركبتان، وأطراف القدمين. الرجال: يبتعد البطن عن الفخذين والذراعان عن الجانبين. النساء: يكون الجسد منضمًا. قل ثلاث مرات:\n\nسبحان ربي الأعلى.\n\n(تنزيهًا لربي الأعلى).",
    step7: "قل: الله أكبر، واجلس بين السجدتين. الرجل: تكون القدم اليسرى مفروشة واليمنى منصوبة وأصابعها باتجاه القبلة. المرأة: تكون القدمان إلى اليمين. اجلس قليلًا، ويمكنك أن تقول:\n\nرب اغفر لي، رب اغفر لي.\n\n(يا رب اغفر لي).",
    step8: "قل: الله أكبر، واسجد السجدة الثانية بنفس هيئة السجدة الأولى. قل ثلاث مرات:\n\nسبحان ربي الأعلى.\n\nوبذلك تكتمل الركعة الأولى.",
    step9: "قل: الله أكبر، وانهض للركعة الثانية دون رفع اليدين. كرر الخطوتين 3 و4: قراءة الفاتحة وسورة، ثم الركوع.",
    step10: "بعد الركوع في الركعة الثانية، قم بالاعتدال ثم أدِّ السجدتين كما في السابق.",
    step11: "بعد السجدة الثانية من الركعة الثانية، قل: الله أكبر، واجلس للتشهد الأخير. اقرأ التشهد، والصلاة الإبراهيمية، والأدعية. تُرفع السبابة عند الشهادة.",
    step12: "سلِّم عن اليمين قائلاً: السلام عليكم ورحمة الله، ثم عن اليسار كذلك. وبذلك تنتهي الصلاة. ويمكنك الدعاء بعد الصلاة.",
    footerText: "هذا دليل مبسط لصلاة ركعتين. لمعرفة التفاصيل الكاملة، وعدد الركعات لكل صلاة، والأحكام الخاصة، يُرجى الرجوع إلى العلماء أو الاطلاع على جدول الصلوات.",
    rekatetTab: "جدول الركعات",
    tableNameHeader: "الصلاة",
    tableRekatetLabel: "الركعات",
    tableSunnetHeader: "السنة",
    tableFarzHeader: "الفرض",
    tableVitriHeader: "الوتر",
    tableTitle: "جدول الركعات",
    tableSubtitle: "تتكون الصلاة من أجزاء تُسمى ركعات.",
    tableFooter: "كل صلاة، سواء كانت فرضًا أو سنة، تُؤدّى خالصةً لله وحده.",
    surahsTableTitle: "نظرة عامة على الأذكار التي تُقرأ خلال ركعات الفرض",
  },
};
