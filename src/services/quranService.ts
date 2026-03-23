// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export interface Verse {
  id: number;              // Verse number within the surah
  text: string;            // Arabic (Uthmani) text
  transliteration: string; // Bismillaahir Rahmaanir Raheem
}

export interface Ayah {
  number: number;        // global ayah number (1–6236)
  numberInSurah: number; // ayah number within surah (1–N)
  text: string;          // text in the fetched language/edition
}

export interface Surah {
  id: number;              // 1–114
  name: string;            // Arabic: الفاتحة
  transliteration: string; // Al-Fatihah
  translation: string;     // English: The Opener
  type: string;            // meccan | medinan
  total_verses: number;    // Total verses in this surah
  verses?: Verse[];        // present in full quran, absent in surahs list
}

export type Quran = Surah[];

// ------------------------------------------------------------
// Load the full Quran from the local JSON asset
// Called once at app startup via quranStore.loadFullQuran()
// require() blocks JS thread briefly but only runs once
// ------------------------------------------------------------
export function loadQuranTransliterationJson(): Quran {
  return require("../../assets/data/quran_transliteration.json") as Quran;
}

// ------------------------------------------------------------
// Constants - Ayah translation edition identifiers — alquran.cloud API
// Full list: https://api.alquran.cloud/v1/edition/language/{code}
// ------------------------------------------------------------
// English
export const EDITION_EN_SAHIH = "en.sahih";         // Saheeh International
export const EDITION_EN_YUSUFALI = "en.yusufali";   // Abdullah Yusuf Ali
export const EDITION_EN_PICKTHALL = "en.pickthall"; // Mohammed Marmaduke Pickthall
export const EDITION_EN_ASAD = "en.asad";           // Muhammad Asad
export const EDITION_EN_HILALI = "en.hilali";       // Al-Hilali & Muhsin Khan
export const EDITION_EN_ITANI = "en.itani";         // Clear Qur'an — Talal Itani
export const EDITION_EN_MAUDUDI = "en.maududi";     // Abul Ala Maududi
// Deutsch (German)
export const EDITION_DE_BUBENHEIM = "de.bubenheim"; // Bubenheim & Elyas
export const EDITION_DE_ABURIDA = "de.aburida";     // Abu Rida Muhammad ibn Ahmad
export const EDITION_DE_KHOURY = "de.khoury";       // Adel Theodor Khoury
export const EDITION_DE_ZAIDAN = "de.zaidan";       // Amir Zaidan
// Shqip (Albanian)
export const EDITION_SQ_AHMETI = "sq.ahmeti"; // Sherif Ahmeti
export const EDITION_SQ_MEHDIU = "sq.mehdiu"; // Feti Mehdiu
export const EDITION_SQ_NAHI = "sq.nahi";     // Hasan Efendi Nahi
// Turkish
export const EDITION_TR_DIYANET = "tr.diyanet";   // Diyanet İşleri
export const EDITION_TR_VAKFI = "tr.vakfi";       // Diyanet Vakfı
export const EDITION_TR_YAZIR = "tr.yazir";       // Elmalılı Hamdi Yazır
export const EDITION_TR_BULAC = "tr.bulac";       // Ali Bulaç
export const EDITION_TR_ATES = "tr.ates";         // Süleyman Ateş
export const EDITION_TR_YILDIRIM = "tr.yildirim"; // Suat Yıldırım

// ------------------------------------------------------------
// Default edition per app language
// Change the value to switch translator for that language
// ------------------------------------------------------------
const AYAH_EDITIONS: Record<string, string> = {
  en: EDITION_EN_SAHIH,
  de: EDITION_DE_BUBENHEIM,
  sq: EDITION_SQ_AHMETI,
  tr: EDITION_TR_DIYANET,
};

// ------------------------------------------------------------
// Fetch ayahs for a surah from alquran.cloud
// Called from quranStore.fetchAyahs() for non-Arabic languages
// Arabic reads directly from local JSON via getSurahById()
// ------------------------------------------------------------
export async function fetchAyahsFromApi(surahId: number, language: string): Promise<Ayah[]> {
  const edition = AYAH_EDITIONS[language];

  if (!edition) {
    throw new Error(`No edition found for language: ${language}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahId}/${edition}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json.data.ayahs as Ayah[];
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Constants (Audio)
// ------------------------------------------------------------
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio-surah";
const BITRATE = 128;

export const EDITION_ALAFASY = "ar.alafasy";                // Mishary Alafasy
export const EDITION_AZZAHRANI = "ar.abdulazizazzahrani";   // Abdulaziz Al-Zahrani
export const EDITION_THUBAITY = "ar.abdulbariaththubaity";  // Abdul Bari Thubaity
export const EDITION_ABDULBARI = "ar.abdulbarimohammed";    // Abdul Bari Mohammed
export const EDITION_ABDULBASIT = "ar.abdulbasitmurattal";  // Abdul Basit Murattal

// ------------------------------------------------------------
// Audio CDN URL for a given surah id and edition
// ------------------------------------------------------------
export function getSurahAudioUrl(surahId: number, edition: string = EDITION_ALAFASY): string {
  return `${AUDIO_CDN}/${BITRATE}/${edition}/${surahId}.mp3`;
}