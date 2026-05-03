// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export interface Verse {
  id: number;              // Verse number within the surah
  text: string;            // Arabic (Uthmani) text
  transliteration: string; // Bismillaahir Rahmaanir Raheem
}

export interface Ayah {
  number: number;          // global ayah number (1–6236)
  numberInSurah: number;   // ayah number within surah (1–N)
  text: string;            // text in the fetched language/edition
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
// Translation editions per language — alquran.cloud API
// Full list: https://api.alquran.cloud/v1/edition/language/{code}
// ------------------------------------------------------------
export const QURAN_TEXT_EDITIONS = {
  en: {
    sahih: "en.sahih",         // Saheeh International (default)
    yusufali: "en.yusufali",   // Abdullah Yusuf Ali
    pickthall: "en.pickthall", // Mohammed Marmaduke Pickthall
    asad: "en.asad",           // Muhammad Asad
    hilali: "en.hilali",       // Al-Hilali & Muhsin Khan
    itani: "en.itani",         // Clear Qur'an — Talal Itani
    maududi: "en.maududi",     // Abul Ala Maududi
  },
  de: {
    bubenheim: "de.bubenheim", // Bubenheim & Elyas (default)
    aburida: "de.aburida",     // Abu Rida Muhammad ibn Ahmad
    khoury: "de.khoury",       // Adel Theodor Khoury
    zaidan: "de.zaidan",       // Amir Zaidan
  },
  sq: {
    ahmeti: "sq.ahmeti",     // Sherif Ahmeti (default)
    mehdiu: "sq.mehdiu",     // Feti Mehdiu
    nahi: "sq.nahi",         // Hasan Efendi Nahi
  },
  tr: {
    diyanet: "tr.diyanet",   // Diyanet İşleri (default)
    vakfi: "tr.vakfi",       // Diyanet Vakfı
    yazir: "tr.yazir",       // Elmalılı Hamdi Yazır
    bulac: "tr.bulac",       // Ali Bulaç
    ates: "tr.ates",         // Süleyman Ateş
    yildirim: "tr.yildirim", // Suat Yıldırım
  },
} as const;

// ------------------------------------------------------------
// Fetch ayahs for a surah from alquran.cloud (aladhan.com)
// Called from quranStore.fetchAyahs() for non-Arabic languages
// Arabic reads directly from local JSON via getSurahById()
// ------------------------------------------------------------
export async function fetchAyahsFromApi(surahId: number, edition: string): Promise<Ayah[]> {
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
// Audio reciter editions
// ------------------------------------------------------------
export const AUDIO_EDITIONS = {
  alafasy: "ar.alafasy",               // Mishary Alafasy (default)
  azzahrani: "ar.abdulazizazzahrani",  // Abdulaziz Al-Zahrani
  thubaity: "ar.abdulbariaththubaity", // Abdul Bari Thubaity
  abdulbari: "ar.abdulbarimohammed",   // Abdul Bari Mohammed
  abdulbasit: "ar.abdulbasitmurattal", // Abdul Basit Murattal
} as const;

// ------------------------------------------------------------
// Audio CDN URL for a given surah id and edition
// ------------------------------------------------------------
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio-surah";
const BITRATE = 128;

export function getSurahAudioUrl(surahId: number, edition: string = AUDIO_EDITIONS.alafasy): string {
  return `${AUDIO_CDN}/${BITRATE}/${edition}/${surahId}.mp3`;
}