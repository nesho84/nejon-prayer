export interface Surah {
  number: number;
  name: string;            // Arabic name: الفاتحة
  englishName: string;     // International: Al-Fatiha
  numberOfAyahs: number;
  revelationType: string;  // Meccan / Medinan
  firstAyah: string;       // Arabic text of first ayah (preview)
}

interface RawSurah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface AyahResponse {
  data: {
    ayahs: Array<{ text: string }>;
  };
}

interface SurahListResponse {
  data: RawSurah[];
}

const BASE_URL = "https://api.alquran.cloud/v1";
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio-surah";
const BITRATE = "128"; // 128kbps quality
const EDITION = "ar.alafasy"; // Mishary Alafasy

// Fetch all 114 surahs + first ayah Arabic preview
export async function fetchAllSurahs(): Promise<Surah[]> {
  const [surahListRes, firstAyahsRes] = await Promise.all([
    fetch(`${BASE_URL}/surah`),
    fetch(`${BASE_URL}/juz/1/quran-uthmani`), // Juz 1 covers the first ayahs of multiple surahs
  ]);

  if (!surahListRes.ok) throw new Error("Failed to fetch surah list");

  const surahList: SurahListResponse = await surahListRes.json();

  // Fetch first ayah for each surah in parallel (batched to avoid rate limiting)
  const firstAyahs = await fetchFirstAyahsForAllSurahs();

  return surahList.data.map((surah) => ({
    number: surah.number,
    name: surah.name,
    englishName: surah.englishName,
    numberOfAyahs: surah.numberOfAyahs,
    revelationType: surah.revelationType,
    firstAyah: firstAyahs[surah.number] ?? "",
  }));
}

// Fetch first ayah text for all surahs (using editions endpoint for each surah number)
async function fetchFirstAyahsForAllSurahs(): Promise<Record<number, string>> {
  // Fetch all ayahs at once using the full quran endpoint for uthmani script
  const res = await fetch(`${BASE_URL}/quran/quran-uthmani`);
  if (!res.ok) throw new Error("Failed to fetch Quran text");

  const data = await res.json();
  const result: Record<number, string> = {};

  // data.data.surahs is an array of surahs, each with ayahs array
  for (const surah of data.data.surahs) {
    if (surah.ayahs && surah.ayahs.length > 0) {
      result[surah.number] = surah.ayahs[0].text;
    }
  }

  return result;
}

// Returns the CDN audio URL for a given surah number — no API call needed
export function getSurahAudioUrl(surahNumber: number): string {
  return `${AUDIO_CDN}/${BITRATE}/${EDITION}/${surahNumber}.mp3`;
}