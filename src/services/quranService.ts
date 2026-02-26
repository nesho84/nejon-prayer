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
const EDITION1 = "ar.alafasy"; // Mishary Alafasy
const EDITION2 = "ar.abdulazizazzahrani"; // Abdulaziz Al-Zahrani
const EDITION3 = "ar.abdulbariaththubaity"; // Abdul Bari Thubaity
const EDITION4 = "ar.abdulbarimohammed"; // Abdul Bari Mohammed
const EDITION5 = "ar.abdulbasitmurattal"; // Abdul Basit Murattal

// ------------------------------------------------------------
// Fetch all 114 surahs from api.alquran.cloud + first ayah Arabic preview
// ------------------------------------------------------------
export async function fetchAllSurahs(): Promise<Surah[]> {
  try {
    // Fetch with AbortController (10s timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Fetch surah list and first ayahs in parallel
    const [surahListRes, firstAyahsRes] = await Promise.all([
      fetch(`${BASE_URL}/surah`, { signal: controller.signal }),
      // Juz 1 covers the first ayahs of multiple surahs
      fetch(`${BASE_URL}/juz/1/quran-uthmani`, { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    if (!surahListRes.ok) throw new Error(`Failed to fetch surah list: ${surahListRes.status}`);
    if (!firstAyahsRes.ok) throw new Error(`Failed to fetch first ayahs: ${firstAyahsRes.status}`);

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

  } catch (err) {
    console.warn("❌ [quranService] API fetch error: ", err);
    throw err;
  }
}

// ------------------------------------------------------------
// Fetch first ayah text for all surahs (using editions endpoint for each surah number)
// ------------------------------------------------------------
async function fetchFirstAyahsForAllSurahs(): Promise<Record<number, string>> {
  try {
    // Fetch with AbortController (10s timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Fetch all ayahs at once using the full quran endpoint for uthmani script
    const response = await fetch(`${BASE_URL}/quran/quran-uthmani`, { signal: controller.signal });
    clearTimeout(timeout);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`Failed to fetch Quran text: ${response.status}`);
    }

    // Get the results
    const data = await response.json();
    const result: Record<number, string> = {};

    // data.data.surahs is an array of surahs, each with ayahs array
    for (const surah of data.data.surahs) {
      if (surah.ayahs && surah.ayahs.length > 0) {
        result[surah.number] = surah.ayahs[0].text;
      }
    }

    return result;

  } catch (err) {
    console.warn("❌ [quranService] API fetch error: ", err);
    throw err;
  }
}

// ------------------------------------------------------------
// Returns the CDN audio URL for a given surah number — no API call needed
// ------------------------------------------------------------
export function getSurahAudioUrl(surahNumber: number): string {
  return `${AUDIO_CDN}/${BITRATE}/${EDITION1}/${surahNumber}.mp3`;
}