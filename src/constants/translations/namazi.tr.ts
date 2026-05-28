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
  step13: string;
  step14: string;
  step15: string;
  selamiLabel: string;
  rakatLabel: string;
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
};

export type NamaziSurah = {
  name: string;
  arabic: string;
  transliteration: string;
};

export const NAMAZI_TR: Record<Language, NamaziTranslations> = {
  // ------------------------------------------------------------
  // English
  // ------------------------------------------------------------
  en: {
    namaziTab: "PRAYER",
    headerTitle: "How to Pray",
    headerSubtitle: "Basic guide to 2-rak'ah prayer",

    step1: "Stand facing the Qiblah and make intention in your heart. \n\nRaise your hands until your thumbs touch your earlobes and say: \n\n'Allahu Akbar' \n(Allah is the Greatest). \n\nMen: Fingers naturally spread, not too tight. \nWomen: Hands up to shoulders.",

    step2: "Place your right hand over the left below the navel (men) or on the chest (women). \n\nFeet parallel, 4 fingers apart (men). \n\nRecite Subhanaka, A'udhu, Bismillah, then Surah Fatiha and another Surah (like Ikhlas or Kawthar).",

    step3: "Say 'Allahu Akbar' and bow into Ruku. \n\nBack straight, head in line with back, hands on knees with fingers spread (men) or closed (women). \n\nSay 3 times: \n\n'Subhaana Rabbiyal Adheem.' \n(Glory be to my Lord, the Most Great.) \n\nEyes looking at the place of prostration.",

    step4: "Rise from Ruku saying: \n\n'Sami Allahu liman hamidah' \n\nAnd when fully upright say: \n\n'Rabbanaa wa lakal hamd.' \n(Allah hears those who praise Him. Our Lord, all praise is for You.) \n\nHands by your sides.",

    step5: "Say 'Allahu Akbar' and prostrate in Sajdah. \n\n7 points must touch the ground: forehead, nose, both palms, both knees, and toes of both feet. \n\nMen: stomach raised, thighs away from shins, arms away from sides. \nWomen: body compact. \n\nSay 3 times: \n\n'Subhaana Rabbiyal A'laa.' \n(Glory be to my Lord, the Most High.)",

    step6: "Say 'Allahu Akbar' and sit up. \n\nLeft foot flat (men), right foot with toes towards Qiblah.\nWomen: both feet to the right. \n\nStay briefly in this position. You may say: \n\n'Rabbighfir lee, Rabbighfir lee.' \n(My Lord, forgive me. My Lord, forgive me.)",

    step7: "Say 'Allahu Akbar' and prostrate again in Sajdah. \n\n7 points must touch the ground: forehead, nose, both palms, both knees, and toes of both feet. \n\nMen: stomach raised, thighs away from shins, arms away from sides. \nWomen: body compact. \n\nSay 3 times: \n\n'Subhaana Rabbiyal A'laa.' \n(Glory be to my Lord, the Most High.) \n\nThis completes the first Rak'ah.",

    step8: "Say 'Allahu Akbar' and stand up for the second Rak'ah. Do not raise your hands this time. \n\nPlace your right hand over the left below the navel (men) or on the chest (women). \n\nFeet parallel, 4 fingers apart (men). \n\nRecite Bismillah, then Surah Fatiha and another Surah (like Ikhlas or Kawthar).",

    step9: "Say 'Allahu Akbar' and bow into Ruku. \n\nBack straight, head in line with back, hands on knees with fingers spread (men) or closed (women). \n\nSay 3 times: \n\n'Subhaana Rabbiyal Adheem.' \n(Glory be to my Lord, the Most Great.) \n\nEyes looking at the place of prostration.",

    step10: "Rise from Ruku saying: \n\n'Sami Allahu liman hamidah' \n\nAnd when fully upright say: \n\n'Rabbanaa wa lakal hamd.' \n(Allah hears those who praise Him. Our Lord, all praise is for You.) \n\nHands by your sides.",

    step11: "Say 'Allahu Akbar' and prostrate in Sajdah. \n\n7 points must touch the ground: forehead, nose, both palms, both knees, and toes of both feet. \n\nMen: stomach raised, thighs away from shins, arms away from sides. \nWomen: body compact. \n\nSay 3 times: \n\n'Subhaana Rabbiyal A'laa.' \n(Glory be to my Lord, the Most High.)",

    step12: "Say 'Allahu Akbar' and sit up. \n\nLeft foot flat (men), right foot with toes towards Qiblah. \nWomen: both feet to the right. \n\nStay briefly in this position. You may say: \n\n'Rabbighfir lee, Rabbighfir lee.' \n(My Lord, forgive me. My Lord, forgive me.)",

    step13: "Say 'Allahu Akbar' and prostrate in Sajdah. \n\n7 points must touch the ground: forehead, nose, both palms, both knees, and toes of both feet. \n\nMen: stomach raised, thighs away from shins, arms away from sides.\nWomen: body compact. \n\nSay 3 times: \n\n'Subhaana Rabbiyal A'laa.' \n(Glory be to my Lord, the Most High.) \n\nThen say: \n\n'Allahu Akbar' and remain seated for Qa'dah.",

    step14: "After the second Sajdah of the second Rak'ah, say 'Allahu Akbar' and sit in Qa'dah (final sitting). \n\nRecite Tashahhud, Durood Ibrahim, and supplications. \n\nThe right index finger is raised when bearing witness.",

    step15: "Turn your head to the right and say: \n\n'Assalamu alaikum wa rahmatullah' \n\nThen turn left and say the same. \n\nThe prayer is complete. \nYou may make dua after the prayer.",

    selamiLabel: "Salam",
    rakatLabel: "Rakat",
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
  },

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: {
    namaziTab: "GEBET",
    headerTitle: "Wie man betet",
    headerSubtitle: "Grundlegende Anleitung zum 2-Rak'ah-Gebet",
    step1: "Stehe in Richtung Qibla und fasse die Absicht (Niyya) im Herzen.\n\nHebe die Hände, bis die Daumen die Ohrläppchen berühren und sage:\n\n'Allahu Akbar'\n(Allah ist der Größte).\n\nMänner: Finger natürlich gespreizt.\nFrauen: Hände bis zu den Schultern.",
    step2: "Lege die rechte Hand über die linke unterhalb des Nabels (Männer) oder auf der Brust (Frauen).\n\nFüße parallel, 4 Finger Abstand (Männer).\n\nRezitiere Subhanaka, A'udhu, Bismillah, dann Sura Fatiha und eine weitere Sura (wie Ikhlas oder Kawthar).",
    step3: "Sage 'Allahu Akbar' und beuge dich in Ruku.\n\nRücken gerade, Kopf in einer Linie mit dem Rücken, Hände auf den Knien mit gespreizten Fingern (Männer) oder geschlossenen (Frauen).\n\nSage 3-mal:\n\n'Subhaana Rabbiyal Adheem.'\n(Gepriesen sei mein Herr, der Allgewaltige.)\n\nAugen auf die Stelle der Niederwerfung gerichtet.",
    step4: "Erhebe dich aus Ruku und sage:\n\n'Sami Allahu liman hamidah'\n\nUnd wenn du vollständig aufrecht stehst, sage:\n\n'Rabbanaa wa lakal hamd.'\n(Allah hört denjenigen, der Ihn lobpreist. Unser Herr, Dir gebührt alles Lob.)\n\nHände an den Seiten.",
    step5: "Sage 'Allahu Akbar' und wirf dich in Sajdah (Niederwerfung).\n\n7 Punkte müssen den Boden berühren: Stirn, Nase, beide Handflächen, beide Knie und Zehenspitzen beider Füße.\n\nMänner: Bauch angehoben, Oberschenkel von Unterschenkeln weg, Arme von den Seiten weg.\nFrauen: Körper kompakt.\n\nSage 3-mal:\n\n'Subhaana Rabbiyal A'laa.'\n(Gepriesen sei mein Herr, der Allerhöchste.)",
    step6: "Sage 'Allahu Akbar' und setze dich auf.\n\nLinker Fuß flach (Männer), rechter Fuß mit Zehen zur Qibla.\nFrauen: beide Füße nach rechts.\n\nVerweile kurz in dieser Position. Du kannst sagen:\n\n'Rabbighfir lee, Rabbighfir lee.'\n(Mein Herr, vergib mir. Mein Herr, vergib mir.)",
    step7: "Sage 'Allahu Akbar' und wirf dich erneut in Sajdah.\n\n7 Punkte müssen den Boden berühren: Stirn, Nase, beide Handflächen, beide Knie und Zehenspitzen beider Füße.\n\nMänner: Bauch angehoben, Oberschenkel von Unterschenkeln weg, Arme von den Seiten weg.\nFrauen: Körper kompakt.\n\nSage 3-mal:\n\n'Subhaana Rabbiyal A'laa.'\n(Gepriesen sei mein Herr, der Allerhöchste.)\n\nDamit ist das erste Rakat abgeschlossen.",
    step8: "Sage 'Allahu Akbar' und stehe für das zweite Rakat auf. Hebe diesmal nicht die Hände.\n\nLege die rechte Hand über die linke unterhalb des Nabels (Männer) oder auf der Brust (Frauen).\n\nFüße parallel, 4 Finger Abstand (Männer).\n\nRezitiere Bismillah, dann Sura Fatiha und eine weitere Sura (wie Ikhlas oder Kawthar).",
    step9: "Sage 'Allahu Akbar' und beuge dich in Ruku.\n\nRücken gerade, Kopf in einer Linie mit dem Rücken, Hände auf den Knien mit gespreizten Fingern (Männer) oder geschlossenen (Frauen).\n\nSage 3-mal:\n\n'Subhaana Rabbiyal Adheem.'\n(Gepriesen sei mein Herr, der Allgewaltige.)\n\nAugen auf die Stelle der Niederwerfung gerichtet.",
    step10: "Erhebe dich aus Ruku und sage:\n\n'Sami Allahu liman hamidah'\n\nUnd wenn du vollständig aufrecht stehst, sage:\n\n'Rabbanaa wa lakal hamd.'\n(Allah hört denjenigen, der Ihn lobpreist. Unser Herr, Dir gebührt alles Lob.)\n\nHände an den Seiten.",
    step11: "Sage 'Allahu Akbar' und wirf dich in Sajdah (Niederwerfung).\n\n7 Punkte müssen den Boden berühren: Stirn, Nase, beide Handflächen, beide Knie und Zehenspitzen beider Füße.\n\nMänner: Bauch angehoben, Oberschenkel von Unterschenkeln weg, Arme von den Seiten weg.\nFrauen: Körper kompakt.\n\nSage 3-mal:\n\n'Subhaana Rabbiyal A'laa.'\n(Gepriesen sei mein Herr, der Allerhöchste.)",
    step12: "Sage 'Allahu Akbar' und setze dich auf.\n\nLinker Fuß flach (Männer), rechter Fuß mit Zehen zur Qibla.\nFrauen: beide Füße nach rechts.\n\nVerweile kurz in dieser Position. Du kannst sagen:\n\n'Rabbighfir lee, Rabbighfir lee.'\n(Mein Herr, vergib mir. Mein Herr, vergib mir.)",
    step13: "Sage 'Allahu Akbar' und wirf dich in Sajdah.\n\n7 Punkte müssen den Boden berühren: Stirn, Nase, beide Handflächen, beide Knie und Zehenspitzen beider Füße.\n\nMänner: Bauch angehoben, Oberschenkel von Unterschenkeln weg, Arme von den Seiten weg.\nFrauen: Körper kompakt.\n\nSage 3-mal:\n\n'Subhaana Rabbiyal A'laa.'\n(Gepriesen sei mein Herr, der Allerhöchste.)\n\nDann sage:\n\n'Allahu Akbar' und bleibe für das Qa'dah sitzen.",
    step14: "Nach der zweiten Sajdah des zweiten Rakats sage 'Allahu Akbar' und setze dich in Qa'dah (abschließendes Sitzen).\n\nRezitiere Tashahhud, Durood Ibrahim und Bittgebete.\n\nDer rechte Zeigefinger wird beim Glaubensbekenntnis erhoben.",
    step15: "Drehe deinen Kopf nach rechts und sage:\n\n'Assalamu alaikum wa rahmatullah'\n\nDann nach links und sage dasselbe.\n\nDas Gebet ist abgeschlossen.\nDu kannst nach dem Gebet Dua machen.",
    selamiLabel: "Salam",
    rakatLabel: "Rak'ah",
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
  },

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: {
    namaziTab: "PRIÈRE",
    headerTitle: "Comment Prier",
    headerSubtitle: "Guide de base pour la prière de 2 rak'ahs",
    step1: "Tenez-vous face à la Qibla et faites l'intention dans votre cœur.\n\nLevez les mains jusqu'à ce que vos pouces touchent vos lobes d'oreilles et dites :\n\n'Allahu Akbar'\n(Allah est le Plus Grand).\n\nHommes : doigts naturellement écartés.\nFemmes : mains jusqu'aux épaules.",
    step2: "Placez votre main droite sur la gauche sous le nombril (hommes) ou sur la poitrine (femmes).\n\nPieds parallèles, 4 doigts d'écart (hommes).\n\nRécitez Subhanaka, A'udhu, Bismillah, puis la Sourate Fatiha et une autre Sourate (comme Ikhlas ou Kawthar).",
    step3: "Dites 'Allahu Akbar' et inclinez-vous en Ruku.\n\nDos droit, tête dans l'axe du dos, mains sur les genoux avec les doigts écartés (hommes) ou fermés (femmes).\n\nDites 3 fois :\n\n'Subhaana Rabbiyal Adheem.'\n(Gloire à mon Seigneur, le Très Grand.)\n\nRegard dirigé vers le lieu de prosternation.",
    step4: "Relevez-vous du Ruku en disant :\n\n'Sami Allahu liman hamidah'\n\nEt une fois debout dites :\n\n'Rabbanaa wa lakal hamd.'\n(Allah entend ceux qui Le louent. Notre Seigneur, toute louange T'appartient.)\n\nBras le long du corps.",
    step5: "Dites 'Allahu Akbar' et prosternez-vous en Sajdah.\n\n7 points doivent toucher le sol : front, nez, les deux paumes, les deux genoux et les orteils des deux pieds.\n\nHommes : ventre relevé, cuisses éloignées des mollets, bras éloignés des côtés.\nFemmes : corps compact.\n\nDites 3 fois :\n\n'Subhaana Rabbiyal A'laa.'\n(Gloire à mon Seigneur, le Très Haut.)",
    step6: "Dites 'Allahu Akbar' et asseyez-vous.\n\nPied gauche à plat (hommes), pied droit avec les orteils vers la Qibla.\nFemmes : les deux pieds vers la droite.\n\nRestez brièvement dans cette position. Vous pouvez dire :\n\n'Rabbighfir lee, Rabbighfir lee.'\n(Mon Seigneur, pardonne-moi. Mon Seigneur, pardonne-moi.)",
    step7: "Dites 'Allahu Akbar' et prosternez-vous à nouveau en Sajdah.\n\n7 points doivent toucher le sol : front, nez, les deux paumes, les deux genoux et les orteils des deux pieds.\n\nHommes : ventre relevé, cuisses éloignées des mollets, bras éloignés des côtés.\nFemmes : corps compact.\n\nDites 3 fois :\n\n'Subhaana Rabbiyal A'laa.'\n(Gloire à mon Seigneur, le Très Haut.)\n\nCeci complète le premier Rak'ah.",
    step8: "Dites 'Allahu Akbar' et levez-vous pour le second Rak'ah. Ne levez pas les mains cette fois.\n\nPlacez votre main droite sur la gauche sous le nombril (hommes) ou sur la poitrine (femmes).\n\nPieds parallèles, 4 doigts d'écart (hommes).\n\nRécitez Bismillah, puis la Sourate Fatiha et une autre Sourate (comme Ikhlas ou Kawthar).",
    step9: "Dites 'Allahu Akbar' et inclinez-vous en Ruku.\n\nDos droit, tête dans l'axe du dos, mains sur les genoux avec les doigts écartés (hommes) ou fermés (femmes).\n\nDites 3 fois :\n\n'Subhaana Rabbiyal Adheem.'\n(Gloire à mon Seigneur, le Très Grand.)\n\nRegard dirigé vers le lieu de prosternation.",
    step10: "Relevez-vous du Ruku en disant :\n\n'Sami Allahu liman hamidah'\n\nEt une fois debout dites :\n\n'Rabbanaa wa lakal hamd.'\n(Allah entend ceux qui Le louent. Notre Seigneur, toute louange T'appartient.)\n\nBras le long du corps.",
    step11: "Dites 'Allahu Akbar' et prosternez-vous en Sajdah.\n\n7 points doivent toucher le sol : front, nez, les deux paumes, les deux genoux et les orteils des deux pieds.\n\nHommes : ventre relevé, cuisses éloignées des mollets, bras éloignés des côtés.\nFemmes : corps compact.\n\nDites 3 fois :\n\n'Subhaana Rabbiyal A'laa.'\n(Gloire à mon Seigneur, le Très Haut.)",
    step12: "Dites 'Allahu Akbar' et asseyez-vous.\n\nPied gauche à plat (hommes), pied droit avec les orteils vers la Qibla.\nFemmes : les deux pieds vers la droite.\n\nRestez brièvement dans cette position. Vous pouvez dire :\n\n'Rabbighfir lee, Rabbighfir lee.'\n(Mon Seigneur, pardonne-moi. Mon Seigneur, pardonne-moi.)",
    step13: "Dites 'Allahu Akbar' et prosternez-vous en Sajdah.\n\n7 points doivent toucher le sol : front, nez, les deux paumes, les deux genoux et les orteils des deux pieds.\n\nHommes : ventre relevé, cuisses éloignées des mollets, bras éloignés des côtés.\nFemmes : corps compact.\n\nDites 3 fois :\n\n'Subhaana Rabbiyal A'laa.'\n(Gloire à mon Seigneur, le Très Haut.)\n\nPuis dites :\n\n'Allahu Akbar' et restez assis pour le Qa'dah.",
    step14: "Après le second Sajdah du second Rak'ah, dites 'Allahu Akbar' et asseyez-vous en Qa'dah (position assise finale).\n\nRécitez le Tashahhud, le Durood Ibrahim et les invocations.\n\nL'index droit est levé lors du témoignage.",
    step15: "Tournez la tête vers la droite et dites :\n\n'Assalamu alaikum wa rahmatullah'\n\nPuis tournez vers la gauche et dites la même chose.\n\nLa prière est terminée.\nVous pouvez faire du dua après la prière.",
    selamiLabel: "Salam",
    rakatLabel: "Rak'ah",
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
  },

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: {
    namaziTab: "NAMAZI",
    headerTitle: "Falja e namazit",
    headerSubtitle: "Udhëzues bazik për namaz prej 2 rekatësh",

    step1: "Qëndro drejt Kibles dhe bëj nijetin me zemër. \n\nNgriji duart derisa gishti i madh të prekë veshin dhe thuaj: \n\n'Allahu Ekber' \n(Allahu është më i Madhi). \n\nPër burrat: Gishtat të hapur dhe jo të shtrënguar fort. \nPër gratë: Duart ngrihen deri në nivel të supit.",

    step2: "Vendose dorën e djathtë mbi të majtën poshtë kërthizës (burrat) ose mbi gjoks (gratë). \n\nKëmbët paralele, me largësi 4 gishta (burrat). \n\nLexo Subhaneken, Eudhu, Bismilah, pastaj suren Fatiha dhe një sure tjetër (Ihlas ose Kewthar).",

    step3: "Thuaj 'Allahu Ekber' dhe përkulu në Ruku. \n\nShpina e drejtë, koka në linjë me shpinën, duart mbi gjunjë me gishta të hapura (burrat) ose të mbyllura (gratë). \n\nThuaj 3 herë: \n\n'Subhane Rabbijel Adhim.' \n(I Shenjtë është Zoti im, i Madhi.) \n\nSytë nga vendi i Sexhdes.",
    step4: "Ngrihu nga Ruku duke thënë: \n\n'Semi Allahu limen hamideh' \n\nDhe kur je drejtuar tërësisht thuaj: \n\n'Rabbena ve lekel hamd.' \n(Allahu i dëgjon ata që e lavdërojnë. O Zoti ynë, Ty të takon lavdia.) \n\nDuart anash trupit.",

    step5: "Thuaj 'Allahu Ekber' dhe bie në Sexhde. \n\n7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. \n\nBurrat: bërryla e ngritur, bërryli larg nga kërciri, krahët larg nga brinjët. \nGratë: të grumbulluara. \n\nThuaj 3 herë: \n\n'Subhane Rabbijel A'la.' \n(I Shenjtë është Zoti im, më i Larti.)",

    step6: "Thuaj 'Allahu Ekber' dhe ngrihu ulur. \n\nKëmba e majtë e shtrirë (burrat), e djathta me gishta nga Kibla. \nGratë: të dy këmbët djathtas. \n\nQëndro pak në këtë pozicion dhe thuaj: \n\n'Rabbigfir li, Rabbigfir li.' \n(O Zoti im më fal, o Zoti im më fal.)",

    step7: "Thuaj 'Allahu Ekber' dhe bie përsëri në Sexhde. \n\n7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. \n\nBurrat: bërryla e ngritur, bërryli larg nga kërciri, krahët larg nga brinjët. \nGratë: të grumbulluara. \n\nThuaj 3 herë: \n\n'Subhane Rabbijel A'la.' \n(I Shenjtë është Zoti im, më i Larti.) \n\nKjo përfundon Rekatin e parë.",

    step8: "Thuaj 'Allahu Ekber' dhe ngrihu në këmbë për Rekatin e dytë. Mos i ngrit duart këtë herë. \n\nVendose dorën e djathtë mbi të majtën poshtë kërthizës (burrat) ose mbi gjoks (gratë). \n\nKëmbët paralele, me largësi 4 gishta (burrat). \n\nLexo Bismilah, pastaj suren Fatiha dhe një sure tjetër (Ihlas ose Kewthar).",

    step9: "Thuaj 'Allahu Ekber' dhe përkulu në Ruku. \n\nShpina e drejtë, koka në linjë me shpinën, duart mbi gjunjë me gishta të hapura (burrat) ose të mbyllura (gratë). \n\nThuaj 3 herë: \n\n'Subhane Rabbijel Adhim.' \n(I Shenjtë është Zoti im, i Madhi.) \n\nSytë nga vendi i Sexhdes.",

    step10: "Ngrihu nga Ruku duke thënë: \n\n'Semi Allahu limen hamideh' \n\nDhe kur je drejtuar tërësisht thuaj: \n\n'Rabbena ve lekel hamd.' \n(Allahu i dëgjon ata që e lavdërojnë. O Zoti ynë, Ty të takon lavdia.) \n\nDuart anash trupit.",

    step11: "Thuaj 'Allahu Ekber' dhe bie në Sexhde. \n\n7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. \n\nBurrat: bërryla e ngritur, bërryli larg nga kërciri, krahët larg nga brinjët. \nGratë: të grumbulluara. \n\nThuaj 3 herë: \n\n'Subhane Rabbijel A'la.' \n(I Shenjtë është Zoti im, më i Larti.)",

    step12: "Thuaj 'Allahu Ekber' dhe ngrihu ulur. \n\nKëmba e majtë e shtrirë (burrat), e djathta me gishta nga Kibla. \nGratë: të dy këmbët djathtas. \n\nQëndro pak në këtë pozicion dhe thuaj: \n\n'Rabbigfir li, Rabbigfir li.' \n(O Zoti im më fal, o Zoti im më fal.)",

    step13: "Thuaj 'Allahu Ekber' dhe bie në Sexhde. \n\n7 pika duhet të prekin tokën: balli, hunda, të dyja pëllëmbët, të dy gjunjët, dhe majat e gishtave të këmbëve. \n\nBurrat: bërryla e ngritur, bërryli larg nga kërciri, krahët larg nga brinjët. \nGratë: të grumbulluara. \n\nThuaj 3 herë: \n\n'Subhane Rabbijel A'la.' \n(I Shenjtë është Zoti im, më i Larti.) \n\nPastaj thuaj: \n\n'Allahu Ekber' dhe qëndro ulur për Kaaden.",

    step14: "Pas Sexhdes së dytë të Rekatit të dytë, thuaj 'Allahu Ekber' dhe ulu në Kaade (pozicioni përfundimtar). \n\nLexo Ettehijjatun, Allahumme Sal-li, Allahumme Barik dhe Rabbena duatë. \n\nGishti tregues i dorës së djathtë ngrihet kur thuhet dëshmia.",

    step15: "Kthe kokën djathtas dhe thuaj: \n\n'Es-selamu alejkum ve rahmetullah' \n\nPastaj ktheje majtas dhe thuaj të njëjtën. \n\nNamazi përfundon. \nMund të bësh dua pas namazit.",

    selamiLabel: "Selami",
    rakatLabel: "Rekati",
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
  },

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: {
    namaziTab: "NAMAZ",
    headerTitle: "Kako Klanjati",
    headerSubtitle: "Osnovni vodič za namaz od 2 rekata",
    step1: "Stanite okrenuti prema Kibli i učinite nijjet u srcu.\n\nPodignite ruke dok palčevi ne dodirnu ušne resice i recite:\n\n'Allahu Ekber'\n(Allah je Najveći).\n\nMuškarci: prsti prirodno raspoređeni.\nŽene: ruke do ramena.",
    step2: "Stavite desnu ruku na lijevu ispod pupka (muškarci) ili na prsa (žene).\n\nStopala paralelna, 4 prsta razmaka (muškarci).\n\nRecitujte Subhaneke, E'uzu, Bismillu, zatim Suru Fatihu i drugu Suru (poput Ihlasa ili Kevser).",
    step3: "Recite 'Allahu Ekber' i sagnite se u ruku.\n\nLeđa ravna, glava u liniji s leđima, ruke na koljenima s prstima raširenim (muškarci) ili skupljenim (žene).\n\nRecite 3 puta:\n\n'Subhane Rabbiyal Azim.'\n(Slava mome Gospodaru, Najvećem.)\n\nPogled usmjeren prema mjestu sedžde.",
    step4: "Ustanite iz rukua govoreći:\n\n'Semi'allahu limen hamideh'\n\nI kada ste potpuno uspravni recite:\n\n'Rabbenā ve lekel hamd.'\n(Allah čuje one koji Ga hvale. Gospodaru naš, Tebi pripada svaka hvala.)\n\nRuke uz tijelo.",
    step5: "Recite 'Allahu Ekber' i učinite sedždu.\n\n7 tačaka mora dodirnuti tlo: čelo, nos, oba dlana, oba koljena i prsti oba stopala.\n\nMuškarci: trbuh podignut, bedra odvojena od potkoljenica, ruke odvojene od strana.\nŽene: tijelo skupljeno.\n\nRecite 3 puta:\n\n'Subhane Rabbiyal E'ala.'\n(Slava mome Gospodaru, Previšnjem.)",
    step6: "Recite 'Allahu Ekber' i sjednite.\n\nLijevo stopalo ravno (muškarci), desno stopalo s prstima prema Kibli.\nŽene: oba stopala prema desno.\n\nOstanite kratko u ovom položaju. Možete reći:\n\n'Rabbigfir li, Rabbigfir li.'\n(Gospodaru moj, oprosti mi. Gospodaru moj, oprosti mi.)",
    step7: "Recite 'Allahu Ekber' i ponovo učinite sedždu.\n\n7 tačaka mora dodirnuti tlo: čelo, nos, oba dlana, oba koljena i prsti oba stopala.\n\nMuškarci: trbuh podignut, bedra odvojena od potkoljenica, ruke odvojene od strana.\nŽene: tijelo skupljeno.\n\nRecite 3 puta:\n\n'Subhane Rabbiyal E'ala.'\n(Slava mome Gospodaru, Previšnjem.)\n\nTime je završen prvi rekat.",
    step8: "Recite 'Allahu Ekber' i ustanite za drugi rekat. Ovog puta ne podižite ruke.\n\nStavite desnu ruku na lijevu ispod pupka (muškarci) ili na prsa (žene).\n\nRecitujte Bismillu, zatim Suru Fatihu i drugu Suru (poput Ihlasa ili Kevser).",
    step9: "Recite 'Allahu Ekber' i sagnite se u ruku.\n\nLeđa ravna, glava u liniji s leđima, ruke na koljenima s prstima raširenim (muškarci) ili skupljenim (žene).\n\nRecite 3 puta:\n\n'Subhane Rabbiyal Azim.'\n(Slava mome Gospodaru, Najvećem.)\n\nPogled usmjeren prema mjestu sedžde.",
    step10: "Ustanite iz rukua govoreći:\n\n'Semi'allahu limen hamideh'\n\nI kada ste potpuno uspravni recite:\n\n'Rabbenā ve lekel hamd.'\n(Allah čuje one koji Ga hvale. Gospodaru naš, Tebi pripada svaka hvala.)\n\nRuke uz tijelo.",
    step11: "Recite 'Allahu Ekber' i učinite sedždu.\n\n7 tačaka mora dodirnuti tlo: čelo, nos, oba dlana, oba koljena i prsti oba stopala.\n\nMuškarci: trbuh podignut, bedra odvojena od potkoljenica, ruke odvojene od strana.\nŽene: tijelo skupljeno.\n\nRecite 3 puta:\n\n'Subhane Rabbiyal E'ala.'\n(Slava mome Gospodaru, Previšnjem.)",
    step12: "Recite 'Allahu Ekber' i sjednite.\n\nLijevo stopalo ravno (muškarci), desno stopalo s prstima prema Kibli.\nŽene: oba stopala prema desno.\n\nOstanite kratko u ovom položaju. Možete reći:\n\n'Rabbigfir li, Rabbigfir li.'\n(Gospodaru moj, oprosti mi. Gospodaru moj, oprosti mi.)",
    step13: "Recite 'Allahu Ekber' i učinite sedždu.\n\n7 tačaka mora dodirnuti tlo: čelo, nos, oba dlana, oba koljena i prsti oba stopala.\n\nMuškarci: trbuh podignut, bedra odvojena od potkoljenica, ruke odvojene od strana.\nŽene: tijelo skupljeno.\n\nRecite 3 puta:\n\n'Subhane Rabbiyal E'ala.'\n(Slava mome Gospodaru, Previšnjem.)\n\nZatim recite:\n\n'Allahu Ekber' i ostanite sjediti za ka'de.",
    step14: "Nakon druge sedžde drugog rekata, recite 'Allahu Ekber' i sjednite u ka'de (konačno sjedenje).\n\nRecitujte Ettehijjatu, Salavat i dove.\n\nDesni kažiprst se podiže pri svjedočenju.",
    step15: "Okrenite glavu na desno i recite:\n\n'Esselamu alejkum ve rahmetullah'\n\nZatim okrenite na lijevo i recite isto.\n\nNamaz je završen.\nMožete učiti dovu nakon namaza.",
    selamiLabel: "Selam",
    rakatLabel: "Rekat",
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
  },

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: {
    namaziTab: "НАМАЗ",
    headerTitle: "Како да Клањате",
    headerSubtitle: "Основен водич за намаз од 2 рекати",
    step1: "Застанете свртени кон Кибла и направете ниет во срцето.\n\nПодигнете ги рацете додека палците не го допрат ушното ткиво и речете:\n\n'Аллаху Екбер'\n(Аллах е Највеликиот).\n\nМажи: прстите природно раширени.\nЖени: рацете до рамената.",
    step2: "Ставете ја десната рака над левата под папокот (мажи) или на градите (жени).\n\nСтапалата паралелни, 4 прста растојание (мажи).\n\nРецитирајте Субханеке, Е'узу, Бисмилла, потоа Сура Фатиха и друга Сура (kako Ихлас или Кевсер).",
    step3: "Речете 'Аллаху Екбер' и наведнете се во руку.\n\nГрбот рамен, главата во линија со грбот, рацете на колената со прстите раширени (мажи) или затворени (жени).\n\nРечете 3 пати:\n\n'Субхане Рабиjал Азим.'\n(Слава на мојот Господар, Највеликиот.)\n\nПогледот насочен кон местото на седжда.",
    step4: "Исправете се од руку говорејќи:\n\n'Семи'аллаху лимен хамидех'\n\nИ кога сте целосно исправени речете:\n\n'Рабенā ве лекел хамд.'\n(Аллах ги слуша оние кои Го фалат. Господару наш, Тебе Ти припаѓа секоја фала.)\n\nРацете покрај телото.",
    step5: "Речете 'Аллаху Екбер' и учинете седжда.\n\n7 точки мора да го допрат тлото: чело, нос, двете дланки, двете колена и прстите на двете стапала.\n\nМажи: стомакот подигнат, бутовите одвоени од потколениците, рацете одвоени од страните.\nЖени: телото собрано.\n\nРечете 3 пати:\n\n'Субхане Рабиjал Е'ала.'\n(Слава на мојот Господар, Превисокиот.)",
    step6: "Речете 'Аллаху Екбер' и седнете.\n\nЛевото стапало рамно (мажи), десното стапало со прстите кон Кибла.\nЖени: двете стапала кон десно.\n\nОстанете кратко во оваа позиција. Можете да речете:\n\n'Рабигфир ли, Рабигфир ли.'\n(Господару мој, прости ми. Господару мој, прости ми.)",
    step7: "Речете 'Аллаху Екбер' и повторно учинете седжда.\n\n7 точки мора да го допрат тлото: чело, нос, двете дланки, двете колена и прстите на двете стапала.\n\nМажи: стомакот подигнат, бутовите одвоени од потколениците, рацете одвоени од страните.\nЖени: телото собрано.\n\nРечете 3 пати:\n\n'Субхане Рабиjал Е'ала.'\n(Слава на мојот Господар, Превисокиот.)\n\nСо тоа е завршен првиот рекат.",
    step8: "Речете 'Аллаху Екбер' и станете за вториот рекат. Овој пат не ги подигнувајте рацете.\n\nСтавете ја десната рака над левата под папокот (мажи) или на градите (жени).\n\nРецитирајте Бисмилла, потоа Сура Фатиха и друга Сура (kako Ихлас или Кевсер).",
    step9: "Речете 'Аллаху Екбер' и наведнете се во руку.\n\nГрбот рамен, главата во линија со грбот, рацете на колената со прстите раширени (мажи) или затворени (жени).\n\nРечете 3 пати:\n\n'Субхане Рабиjал Азим.'\n(Слава на мојот Господар, Највеликиот.)\n\nПогледот насочен кон местото на седжда.",
    step10: "Исправете се од руку говорејќи:\n\n'Семи'аллаху лимен хамидех'\n\nИ кога сте целосно исправени речете:\n\n'Рабенā ве лекел хамд.'\n(Аллах ги слуша оние кои Го фалат. Господару наш, Тебе Ти припаѓа секоја фала.)\n\nРацете покрај телото.",
    step11: "Речете 'Аллаху Екбер' и учинете седжда.\n\n7 точки мора да го допрат тлото: чело, нос, двете дланки, двете колена и прстите на двете стапала.\n\nМажи: стомакот подигнат, бутовите одвоени од потколениците, рацете одвоени од страните.\nЖени: телото собрано.\n\nРечете 3 пати:\n\n'Субхане Рабиjал Е'ала.'\n(Слава на мојот Господар, Превисокиот.)",
    step12: "Речете 'Аллаху Екбер' и седнете.\n\nЛевото стапало рамно (мажи), десното стапало со прстите кон Кибла.\nЖени: двете стапала кон десно.\n\nОстанете кратко во оваа позиција. Можете да речете:\n\n'Рабигфир ли, Рабигфир ли.'\n(Господару мој, прости ми. Господару мој, прости ми.)",
    step13: "Речете 'Аллаху Екбер' и учинете седжда.\n\n7 точки мора да го допрат тлото: чело, нос, двете дланки, двете колена и прстите на двете стапала.\n\nМажи: стомакот подигнат, бутовите одвоени од потколениците, рацете одвоени од страните.\nЖени: телото собрано.\n\nРечете 3 пати:\n\n'Субхане Рабиjал Е'ала.'\n(Слава на мојот Господар, Превисокиот.)\n\nПотоа речете:\n\n'Аллаху Екбер' и останете да седите за ка'де.",
    step14: "По втората седжда на вториот рекат, речете 'Аллаху Екбер' и седнете во ка'де (конечно седење).\n\nРецитирајте Еттехиjjату, Салават и дови.\n\nДесниот показалец се подига при сведочењето.",
    step15: "Свртете ја главата надесно и речете:\n\n'Есселаму алеjкум ве рахметулла'\n\nПотоа свртете налево и речете исто.\n\nНамазот е завршен.\nМожете да учите дова по намазот.",
    selamiLabel: "Селам",
    rakatLabel: "Рекат",
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
  },

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: {
    namaziTab: "Namaz",
    headerTitle: "Namaz Kılma",
    headerSubtitle: "2 rekat namaz için temel rehber",
    step1: "Kıbleye dönün ve kalben niyet edin.\n\nElleriniz başparmaklar kulak memelerine gelecek şekilde kaldırın ve deyin:\n\n'Allahu Ekber'\n\nErkekler: Parmaklar doğal olarak açık, sıkılmamış.\nKadınlar: Eller omuz hizasına kadar kaldırılır.",
    step2: "Sağ elinizi solunuzun üzerine göbek altına (erkekler) veya göğsüne (kadınlar) koyun.\n\nAyaklar paralel, aralarında dört parmak mesafe (erkekler).\n\nSübhaneke, Eûzü Besmeleyi okuyun, sonra Fatiha suresini ve başka bir sure (örneğin İhlas veya Kevser) okuyun.",
    step3: "'Allahu Ekber' deyin ve rükûa gidin.\n\nSırt düz, baş sırtla hizalı, eller dizlere açık (erkekler) veya kapalı (kadınlar).\n\nÜç kez söyleyin:\n\n'Sübhane Rabbiyel Azim.'\n(Rabbim çok yücedir.)\n\nGözler secde yerindedir.",
    step4: "Rükûdan diyerek kalkın:\n\n'Semi'allahü limen hamideh'\n\nTam ayağa kalktığınızda söyleyin:\n\n'Rabbenâ ve lekel hamd.'\n(Allah, kendisini hamd ile övenleri işitir. Ey Rabbimiz, hamd sana aittir.)\n\nEller vücudun yanında.",
    step5: "'Allahu Ekber' deyin ve secdeye gidin.\n\nYedi organın yere temas etmesi gerekir: Alın, burun, iki avuç, iki diz ve ayak parmaklarının uçları.\n\nErkekler: Dirsekler kalkık, karnı uyluklardan uzak, kollar kaburga kemiklerinden uzak.\nKadınlar: Vücut toplanmış.\n\nÜç kez söyleyin:\n\n'Sübhane Rabbiyel A'lâ.'\n(Rabbim çok yüksektir.)",
    step6: "'Allahu Ekber' deyin ve oturun.\n\nErkekler: Sol ayak açık, sağ ayak dik ve parmakları kıbleye dönük.\nKadınlar: Her iki ayak sağa doğru.\n\nBiraz bu pozisyonda kalın. Şöyle diyebilirsiniz:\n\n'Rabbigfir li, Rabbigfir li.'\n(Ey Rabbim beni bağışla, ey Rabbim beni bağışla.)",
    step7: "'Allahu Ekber' deyin ve tekrar secdeye gidin.\n\nYedi organın yere temas etmesi gerekir: Alın, burun, iki avuç, iki diz ve ayak parmaklarının uçları.\n\nErkekler: Dirsekler kalkık, karnı uyluklardan uzak, kollar kaburga kemiklerinden uzak.\nKadınlar: Vücut toplanmış.\n\nÜç kez söyleyin:\n\n'Sübhane Rabbiyel A'lâ.'\n(Rabbim çok yüksektir.)\n\nBöylece ilk rekat tamamlanır.",
    step8: "'Allahu Ekber' deyin ve ikinci rekate kalkın. Bu sefer ellerinizi kaldırmayın.\n\nSağ elinizi solunuzun üzerine göbek altına (erkekler) veya göğsüne (kadınlar) koyun.\n\nBesmele'yi okuyun, sonra Fatiha suresini ve başka bir sure (İhlas veya Kevser) okuyun.",
    step9: "'Allahu Ekber' deyin ve rükûa gidin.\n\nSırt düz, baş sırtla hizalı, eller dizlere açık (erkekler) veya kapalı (kadınlar).\n\nÜç kez söyleyin:\n\n'Sübhane Rabbiyel Azim.'\n(Rabbim çok yücedir.)\n\nGözler secde yerindedir.",
    step10: "Rükûdan diyerek kalkın:\n\n'Semi'allahü limen hamideh'\n\nTam ayağa kalktığınızda söyleyin:\n\n'Rabbenâ ve lekel hamd.'\n(Allah, kendisini hamd ile övenleri işitir. Ey Rabbimiz, hamd sana aittir.)\n\nEller vücudun yanında.",
    step11: "'Allahu Ekber' deyin ve secdeye gidin.\n\nYedi organın yere temas etmesi gerekir: Alın, burun, iki avuç, iki diz ve ayak parmaklarının uçları.\n\nErkekler: Dirsekler kalkık, karnı uyluklardan uzak, kollar kaburga kemiklerinden uzak.\nKadınlar: Vücut toplanmış.\n\nÜç kez söyleyin:\n\n'Sübhane Rabbiyel A'lâ.'\n(Rabbim çok yüksektir.)",
    step12: "'Allahu Ekber' deyin ve oturun.\n\nErkekler: Sol ayak açık, sağ ayak dik ve parmakları kıbleye dönük.\nKadınlar: Her iki ayak sağa doğru.\n\nBiraz bu pozisyonda kalın. Şöyle diyebilirsiniz:\n\n'Rabbigfir li, Rabbigfir li.'\n(Ey Rabbim beni bağışla, ey Rabbim beni bağışla.)",
    step13: "'Allahu Ekber' deyin ve secdeye gidin.\n\nYedi organın yere temas etmesi gerekir: Alın, burun, iki avuç, iki diz ve ayak parmaklarının uçları.\n\nErkekler: Dirsekler kalkık, karnı uyluklardan uzak, kollar kaburga kemiklerinden uzak.\nKadınlar: Vücut toplanmış.\n\nÜç kez söyleyin:\n\n'Sübhane Rabbiyel A'lâ.'\n(Rabbim çok yüksektir.)\n\nSonra deyin:\n\n'Allahu Ekber' ve ka'de için oturun.",
    step14: "İkinci rekatın ikinci secdesinden sonra, 'Allahu Ekber' deyin ve oturun.\n\nEttehiyyatü, Allahümme Salli, Allahümme Barik ve Rabbena dualarını okuyun.\n\nSağ elin işaret parmağı şehadet getirilirken kaldırılır.",
    step15: "Sağa dönün ve selam vererek deyin:\n\n'Esselamu aleyküm ve rahmetullah'\n\nSonra sola dönün ve aynı şeyi söyleyin.\n\nNamaz tamamlanır.\nNamazdan sonra dua edebilirsiniz.",
    selamiLabel: "Selam",
    rakatLabel: "Rekat",
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
  },

  // ------------------------------------------------------------
  // العربية
  // ------------------------------------------------------------
  ar: {
    namaziTab: "الصلاة",
    headerTitle: "كيفية الصلاة",
    headerSubtitle: "دليل مبسط لصلاة ركعتين",
    step1: "قف متجهًا إلى القبلة وانْوِ الصلاة في قلبك.\n\nارفع يديك حتى تحاذي الإبهامان شحمتي الأذنين وقل:\n\n'الله أكبر'\n\nالرجال: الأصابع مفرقة طبيعيًا دون تشديد.\nالنساء: ترفع اليدان إلى مستوى الكتفين.",
    step2: "ضع يدك اليمنى فوق اليسرى أسفل السرة (للرجال) أو على الصدر (للنساء).\n\nتكون القدمان متوازيتين وبينهما مسافة أربع أصابع (للرجال).\n\nاقرأ دعاء الاستفتاح والاستعاذة والبسملة، ثم سورة الفاتحة وسورة أخرى (مثل الإخلاص أو الكوثر).",
    step3: "قل: 'الله أكبر' ثم اركع.\n\nيكون الظهر مستقيمًا والرأس بمحاذاته، وتوضع اليدان على الركبتين مع تفريق الأصابع (للرجال) أو ضمها (للنساء).\n\nقل ثلاث مرات:\n\n'سبحان ربي العظيم.'\n(تنزيهًا لربي العظيم.)\n\nويكون النظر إلى موضع السجود.",
    step4: "ارفع من الركوع قائلاً:\n\n'سمع الله لمن حمده'\n\nوعند الوقوف التام قل:\n\n'ربنا ولك الحمد.'\n(سمع الله لمن حمده، ربنا لك الحمد.)\n\nوتكون اليدان بمحاذاة الجانبين.",
    step5: "قل: 'الله أكبر' واسجد.\n\nيجب أن تلامس الأرض سبعة أعضاء: الجبهة، الأنف، الكفان، الركبتان، وأطراف القدمين.\n\nالرجال: يبتعد البطن عن الفخذين والذراعان عن الجانبين.\nالنساء: يكون الجسد منضمًا.\n\nقل ثلاث مرات:\n\n'سبحان ربي الأعلى.'\n(تنزيهًا لربي الأعلى.)",
    step6: "قل: 'الله أكبر' واجلس بين السجدتين.\n\nالرجل: تكون القدم اليسرى مفروشة واليمنى منصوبة وأصابعها باتجاه القبلة.\nالمرأة: تكون القدمان إلى اليمين.\n\nاجلس قليلًا، ويمكنك أن تقول:\n\n'رب اغفر لي، رب اغفر لي.'\n(يا رب اغفر لي.)",
    step7: "قل: 'الله أكبر' واسجد.\n\nيجب أن تلامس الأرض سبعة أعضاء: الجبهة، الأنف، الكفان، الركبتان، وأطراف القدمين.\n\nالرجال: يبتعد البطن عن الفخذين والذراعان عن الجانبين.\nالنساء: يكون الجسد منضمًا.\n\nقل ثلاث مرات:\n\n'سبحان ربي الأعلى.'\n(تنزيهًا لربي الأعلى.)\n\nوبذلك تكتمل الركعة الأولى.",
    step8: "قل: 'الله أكبر' وانهض للركعة الثانية دون رفع اليدين.\n\nضع يدك اليمنى فوق اليسرى أسفل السرة (للرجال) أو على الصدر (للنساء).\n\nتكون القدمان متوازيتين وبينهما مسافة أربع أصابع (للرجال).\n\nاقرأ البسملة، ثم سورة الفاتحة وسورة أخرى (مثل الإخلاص أو الكوثر).",
    step9: "قل: 'الله أكبر' ثم اركع.\n\nيكون الظهر مستقيمًا والرأس بمحاذاته، وتوضع اليدان على الركبتين مع تفريق الأصابع (للرجال) أو ضمها (للنساء).\n\nقل ثلاث مرات:\n\n'سبحان ربي العظيم.'\n(تنزيهًا لربي العظيم.)\n\nويكون النظر إلى موضع السجود.",
    step10: "ارفع من الركوع قائلاً:\n\n'سمع الله لمن حمده'\n\nوعند الوقوف التام قل:\n\n'ربنا ولك الحمد.'\n(سمع الله لمن حمده، ربنا لك الحمد.)\n\nوتكون اليدان بمحاذاة الجانبين.",
    step11: "قل: 'الله أكبر' واسجد.\n\nيجب أن تلامس الأرض سبعة أعضاء: الجبهة، الأنف، الكفان، الركبتان، وأطراف القدمين.\n\nالرجال: يبتعد البطن عن الفخذين والذراعان عن الجانبين.\nالنساء: يكون الجسد منضمًا.\n\nقل ثلاث مرات:\n\n'سبحان ربي الأعلى.'\n(تنزيهًا لربي الأعلى.)",
    step12: "قل: 'الله أكبر' واجلس بين السجدتين.\n\nالرجل: تكون القدم اليسرى مفروشة واليمنى منصوبة وأصابعها باتجاه القبلة.\nالمرأة: تكون القدمان إلى اليمين.\n\nاجلس قليلًا، ويمكنك أن تقول:\n\n'رب اغفر لي، رب اغفر لي.'\n(يا رب اغفر لي.)",
    step13: "قل: 'الله أكبر' واسجد.\n\nيجب أن تلامس الأرض سبعة أعضاء: الجبهة، الأنف، الكفان، الركبتان، وأطراف القدمين.\n\nالرجال: يبتعد البطن عن الفخذين والذراعان عن الجانبين.\nالنساء: يكون الجسد منضمًا.\n\nقل ثلاث مرات:\n\n'سبحان ربي الأعلى.'\n(تنزيهًا لربي الأعلى.)\n\nثم قل:\n\n'الله أكبر' وابقَ جالسًا للتشهد.",
    step14: "بعد السجدة الثانية من الركعة الثانية، قل: 'الله أكبر' واجلس للتشهد الأخير.\n\nاقرأ التشهد، والصلاة الإبراهيمية، والأدعية.\n\nتُرفع السبابة عند الشهادة.",
    step15: "سلِّم عن اليمين قائلاً:\n\n'السلام عليكم ورحمة الله'\n\nثم سلِّم عن اليسار كذلك.\n\nوبذلك تنتهي الصلاة.\nويمكنك الدعاء بعد الصلاة.",
    selamiLabel: "السلام",
    rakatLabel: "الركعة",
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
  },
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
      "Attahiyyaatu lillaahi wassalawaatu wattayyibaat.\nAssalaamu 'alaika ayyuhan-Nabiyyu wa rahmatullaahi wa barakaatuh.\nAssalaamu 'alainaa wa 'alaa 'ibaadillaahis-saaliheen.\nAsh-hadu al-laa ilaaha illallaah, wa ash-hadu anna Muhammadan 'abduhu wa rasuuluh.",
  },
  allahummaSalli: {
    name: "Allahumma Salli",
    arabic:
      "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration:
      "Allaahumma salli 'alaa Muhammadin wa 'alaa aali Muhammad, kamaa sallayta 'alaa Ibraaheema wa 'alaa aali Ibraaheem, innaka Hameedun Majeed.",
  },
  allahummaBarik: {
    name: "Allahumma Barik",
    arabic:
      "اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration:
      "Allaahumma baarik 'alaa Muhammadin wa 'alaa aali Muhammad, kamaa baarakta 'alaa Ibraaheema wa 'alaa aali Ibraaheem, innaka Hameedun Majeed.",
  },
  rabbena: {
    name: "Rabbena",
    arabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ\nرَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    transliteration:
      "Rabbanaa aatinaa fid-dunyaa hasanatan wa fil-aakhirati hasanatan wa qinaa 'adhaaban-naar.\nRabbanaa ghfir lee wa li-waalidayya wa lil-mu'mineena yawma yaqoomul-hisaab.",
  },
};
