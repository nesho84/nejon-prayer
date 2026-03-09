// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export interface Verse {
  id: number;              // Verse number within the surah
  text: string;            // Arabic (Uthmani) text
  transliteration: string; // Bismillaahir Rahmaanir Raheem
}

export interface Surah {
  id: number;              // 1–114
  name: string;            // Arabic: الفاتحة
  transliteration: string; // Al-Fatihah
  translation: string;     // English: The Opener
  type: string;            // meccan | medinan
  total_verses: number;
  verses?: Verse[];        // present in full quran, absent in surahs list
  firstVerse?: Verse;      // present in surahs list, absent in full quran
}

export type Quran = Surah[];

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio-surah";
const BITRATE = 128;

export const EDITION_ALAFASY = "ar.alafasy";                // Mishary Alafasy
export const EDITION_AZZAHRANI = "ar.abdulazizazzahrani";   // Abdulaziz Al-Zahrani
export const EDITION_THUBAITY = "ar.abdulbariaththubaity";  // Abdul Bari Thubaity
export const EDITION_ABDULBARI = "ar.abdulbarimohammed";    // Abdul Bari Mohammed
export const EDITION_ABDULBASIT = "ar.abdulbasitmurattal";  // Abdul Basit Murattal

// ------------------------------------------------------------
// Load the full Quran from the local JSON asset
// Called once at app startup via quranStore.loadFullQuran()
// require() blocks JS thread briefly but only runs once
// ------------------------------------------------------------
export function loadQuranTransliterationJson(): Quran {
  return require("../../assets/data/quran_transliteration.json") as Quran;
}

// ------------------------------------------------------------
// Audio CDN URL for a given surah id and edition
// ------------------------------------------------------------
export function getSurahAudioUrl(surahId: number, edition: string = EDITION_ALAFASY): string {
  return `${AUDIO_CDN}/${BITRATE}/${edition}/${surahId}.mp3`;
}