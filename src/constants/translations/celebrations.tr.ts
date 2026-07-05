import { Language } from "@/types/language.types";

export type CelebrationTranslations = {
  emoji: string;
  title: string;
  message: string;
};

export const PRAYER_CELEBRATIONS_TR: Record<Language, CelebrationTranslations[]> = {
  // ------------------------------------------------------------
  // English
  // ------------------------------------------------------------
  en: [
    { emoji: '🤲', title: 'May Allah accept your prayers', message: 'All 5 prayers completed today' },
    { emoji: '✨', title: 'Beautiful consistency today', message: 'Keep up the great work' },
    { emoji: '🌙', title: 'Daily prayers completed', message: 'Alhamdulillah' },
    { emoji: '🕌', title: 'All prayers completed today', message: 'May Allah accept them' },
    { emoji: '🎉', title: "You completed today's prayers", message: 'Well done!' },
    { emoji: '🤍', title: 'Keep it up', message: 'Every prayer counts' },
    { emoji: '🌟', title: 'MashaAllah!', message: 'All 5 prayers fulfilled today' },
    { emoji: '🌸', title: 'Perfect day of worship', message: 'May Allah bless your efforts' },
    { emoji: '☀️', title: 'Another blessed day', message: 'All prayers completed' },
    { emoji: '💫', title: 'SubhanAllah!', message: 'You showed great dedication today' },
  ],

  // ------------------------------------------------------------
  // Deutsch
  // ------------------------------------------------------------
  de: [
    { emoji: '🤲', title: 'Möge Allah deine Gebete annehmen', message: 'Alle 5 Gebete heute verrichtet' },
    { emoji: '✨', title: 'Heute hast du dich bewährt', message: 'Weiter so!' },
    { emoji: '🌙', title: 'Alle Tagesgebete verrichtet', message: 'Alhamdulillah' },
    { emoji: '🕌', title: 'Alle Gebete heute verrichtet', message: 'Möge Allah sie annehmen' },
    { emoji: '🎉', title: 'Alle 5 Gebete heute verrichtet', message: 'Alhamdulillah' },
    { emoji: '🤍', title: 'Mach weiter so', message: 'Jedes Gebet zählt' },
    { emoji: '🌟', title: 'MashaAllah!', message: 'Alle 5 Gebete heute erfüllt' },
    { emoji: '🌸', title: 'Ein vollkommener Tag der Anbetung', message: 'Möge Allah deine Bemühungen segnen' },
    { emoji: '☀️', title: 'Noch ein gesegneter Tag', message: 'Alle Gebete verrichtet' },
    { emoji: '💫', title: 'SubhanAllah!', message: 'Heute hast du deine Entschlossenheit gezeigt' },
  ],

  // ------------------------------------------------------------
  // Français
  // ------------------------------------------------------------
  fr: [
    { emoji: '🤲', title: "Qu'Allah accepte tes prières", message: 'Les 5 prières accomplies aujourd\'hui' },
    { emoji: '✨', title: "Tu t'es montré déterminé aujourd'hui", message: 'Continue comme ça !' },
    { emoji: '🌙', title: 'Prières du jour accomplies', message: 'Alhamdulillah' },
    { emoji: '🕌', title: 'Toutes les prières accomplies', message: "Qu'Allah les accepte" },
    { emoji: '🎉', title: "Les 5 prières accomplies aujourd'hui", message: 'Alhamdulillah' },
    { emoji: '🤍', title: 'Continue comme ça', message: 'Chaque prière a sa valeur' },
    { emoji: '🌟', title: 'MashaAllah !', message: 'Les 5 prières du jour accomplies' },
    { emoji: '🌸', title: 'Une journée parfaite de dévotion', message: "Qu'Allah bénisse tes efforts" },
    { emoji: '☀️', title: 'Une autre journée bénie', message: 'Toutes les prières accomplies' },
    { emoji: '💫', title: 'SubhanAllah !', message: "Tu t'es montré déterminé aujourd'hui" },
  ],

  // ------------------------------------------------------------
  // Shqip
  // ------------------------------------------------------------
  sq: [
    { emoji: '🤲', title: 'Allahu ti pranoftë namazet e tua', message: 'Të 5 namazet u falën sot' },
    { emoji: '✨', title: 'Sot u tregove i vendosur', message: 'Vazhdo kështu!' },
    { emoji: '🌙', title: 'Namazet e sotme u falën', message: 'Elhamdulilah' },
    { emoji: '🕌', title: 'Të gjitha namazet u falën sot', message: 'Allahu i pranoftë' },
    { emoji: '🎉', title: 'I kryeve të 5 namazet sot', message: 'Elhamdulilah' },
    { emoji: '🤍', title: 'Vazhdo kështu', message: 'Çdo namaz ka vlerën e vet' },
    { emoji: '🌟', title: 'MashaAllah!', message: 'Pesë namazet e ditës u falën' },
    { emoji: '🌸', title: 'Ditë e përsosur ibadetesh', message: 'Allahu i bekoftë përpjekjet e tua' },
    { emoji: '☀️', title: 'Edhe një ditë e bekuar', message: 'Të gjitha namazet u falën' },
    { emoji: '💫', title: 'SubhanAllah!', message: 'Sot u tregove vërtetë i përkushtuar' },
  ],

  // ------------------------------------------------------------
  // Bosanski
  // ------------------------------------------------------------
  bs: [
    { emoji: '🤲', title: 'Neka Allah primi tvoje namaze', message: 'Svih 5 namaza danas klanjano' },
    { emoji: '✨', title: 'Danas si pokazao upornost', message: 'Nastavi ovako!' },
    { emoji: '🌙', title: 'Dnevni namazi su klanjani', message: 'Elhamdulillah' },
    { emoji: '🕌', title: 'Svi namazi danas klanjani', message: 'Neka Allah primi' },
    { emoji: '🎉', title: 'Svih 5 namaza danas klanjano', message: 'Elhamdulillah' },
    { emoji: '🤍', title: 'Nastavi ovako', message: 'Svaki namaz se računa' },
    { emoji: '🌟', title: 'MašaAllah!', message: 'Svih 5 namaza danas ispunjeno' },
    { emoji: '🌸', title: 'Savršen dan ibadeta', message: 'Neka Allah blagoslovi tvoje napore' },
    { emoji: '☀️', title: 'Još jedan blagoslovljen dan', message: 'Svi namazi su klanjani' },
    { emoji: '💫', title: 'SubhanAllah!', message: 'Danas si pokazao pravu posvećenost' },
  ],

  // ------------------------------------------------------------
  // Македонски
  // ------------------------------------------------------------
  mk: [
    { emoji: '🤲', title: 'Нека Аллах ги прими твоите намази', message: 'Сите 5 намази денес исклањани' },
    { emoji: '✨', title: 'Денес се покажа упорен', message: 'Продолжи вака!' },
    { emoji: '🌙', title: 'Денешните намази се исклањани', message: 'Елхамдулилах' },
    { emoji: '🕌', title: 'Сите намази денес исклањани', message: 'Нека Аллах ги прими' },
    { emoji: '🎉', title: 'Сите 5 намази денес исклањани', message: 'Елхамдулилах' },
    { emoji: '🤍', title: 'Продолжи вака', message: 'Секој намаз е важен' },
    { emoji: '🌟', title: 'МашаАллах!', message: 'Сите 5 намази денес исполнети' },
    { emoji: '🌸', title: 'Совршен ден на ибадет', message: 'Нека Аллах ги благослови твоите напори' },
    { emoji: '☀️', title: 'Уште еден благословен ден', message: 'Сите намази исклањани' },
    { emoji: '💫', title: 'СубханАллах!', message: 'Денес се покажа посветен' },
  ],

  // ------------------------------------------------------------
  // Türkçe
  // ------------------------------------------------------------
  tr: [
    { emoji: '🤲', title: 'Allah namazlarını kabul etsin', message: 'Bugün 5 vakit namaz kıldın' },
    { emoji: '✨', title: 'Bugün kararlılığını gösterdin', message: 'Böyle devam et!' },
    { emoji: '🌙', title: 'Günün namazları kılındı', message: 'Elhamdülillah' },
    { emoji: '🕌', title: 'Tüm namazlar kılındı', message: 'Allah kabul etsin' },
    { emoji: '🎉', title: 'Bugün 5 vakit namaz kıldın', message: 'Elhamdülillah' },
    { emoji: '🤍', title: 'Böyle devam et', message: 'Her namaz değerlidir' },
    { emoji: '🌟', title: 'MaşaAllah!', message: 'Bugün 5 vakit namaz tamamlandı' },
    { emoji: '🌸', title: 'Mükemmel bir ibadet günü', message: 'Allah gayretini kabul etsin' },
    { emoji: '☀️', title: 'Bir başka mübarek gün', message: 'Tüm namazlar kılındı' },
    { emoji: '💫', title: 'SubhanAllah!', message: 'Bugün gerçek bir kararlılık gösterdin' },
  ],

  // ------------------------------------------------------------
  // Arabic
  // ------------------------------------------------------------
  ar: [
    { emoji: '🤲', title: 'تقبّل الله صلواتك', message: 'اكتملت الصلوات الخمس اليوم' },
    { emoji: '✨', title: 'أظهرت عزيمتك اليوم', message: 'واظب على ذلك' },
    { emoji: '🌙', title: 'صلوات اليوم مكتملة', message: 'الحمد لله' },
    { emoji: '🕌', title: 'أُتمّت جميع الصلوات', message: 'تقبّل الله منك' },
    { emoji: '🎉', title: 'أتممت الصلوات الخمس اليوم', message: 'الحمد لله' },
    { emoji: '🤍', title: 'واظب على ذلك', message: 'كل صلاة لها أثرها' },
    { emoji: '🌟', title: 'ما شاء الله!', message: 'اكتملت الصلوات الخمس اليوم' },
    { emoji: '🌸', title: 'يوم مبارك من العبادة', message: 'بارك الله في جهدك' },
    { emoji: '☀️', title: 'يوم مبارك آخر', message: 'جميع الصلوات مكتملة' },
    { emoji: '💫', title: 'سبحان الله!', message: 'أظهرت عزيمة حقيقية اليوم' },
  ],
};
