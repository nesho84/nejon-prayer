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

export type FavoriteAyah = {
  surahId: number;
  surahName: string;
  ayahId: number;          // verse number within the surah
  arabicText: string;      // stored at save time — works offline
  translation: string | null; // stored at save time, null if Arabic language
}
