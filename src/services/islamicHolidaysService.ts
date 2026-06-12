import {
  ISLAMIC_HOLIDAYS,
  IslamicHolidayDates,
  IslamicHolidayType,
  UpcomingIslamicHoliday
} from "@/types/islamic-holidays.types";

interface AladhanGToHResponse {
  data: {
    hijri: {
      year: string;
    };
  };
}

interface AladhanHToGResponse {
  data: {
    gregorian: {
      date: string; // "08-02-2027"
    };
  };
}

// ------------------------------------------------------------
// Get current Hijri year from AlAdhan API
// ------------------------------------------------------------
async function getCurrentHijriYear(): Promise<number> {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get JSON response
    const result: AladhanGToHResponse = await response.json();

    // Validate response structure
    if (!result?.data?.hijri?.year) {
      throw new Error("Invalid gToH response structure");
    }

    return parseInt(result.data.hijri.year);
  } catch (err) {
    console.warn("❌ [islamicHolidaysService] Failed to fetch Hijri year:", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Convert a Hijri date to Gregorian ISO string "YYYY-MM-DD"
// If resulting date is already in the past, re-fetches for hijriYear + 1
// ------------------------------------------------------------
async function hijriToGregorian(hijriDay: number, hijriMonth: number, hijriYear: number): Promise<string> {
  const dd = String(hijriDay).padStart(2, "0");
  const mm = String(hijriMonth).padStart(2, "0");
  const today = new Date().toISOString().split("T")[0];

  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.aladhan.com/v1/hToG/${dd}-${mm}-${hijriYear}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get JSON response
    const result: AladhanHToGResponse = await response.json();

    // Validate response structure
    if (!result?.data?.gregorian?.date) {
      throw new Error("Invalid hToG response structure");
    }

    // Convert "08-02-2027" → "2027-02-08"
    const [d, m, y] = result.data.gregorian.date.split("-");
    const isoDate = `${y}-${m}-${d}`;

    // If date already passed, re-fetch for next Hijri year
    if (isoDate < today) {
      // console.log(`🔄 [islamicHolidaysService] ${dd}-${mm}-${hijriYear} already passed, fetching for ${hijriYear + 1}`);
      return hijriToGregorian(hijriDay, hijriMonth, hijriYear + 1);
    }

    return isoDate;
  } catch (err) {
    console.warn(`❌ [islamicHolidaysService] Failed to convert ${dd}-${mm}-${hijriYear}:`, err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Fetch all Islamic holiday Gregorian dates — called once per year
// ------------------------------------------------------------
export async function fetchIslamicHolidayDates(): Promise<IslamicHolidayDates> {
  try {
    const hijriYear = await getCurrentHijriYear();

    const entries = await Promise.all(
      ISLAMIC_HOLIDAYS.map(async (holiday) => {
        const gregorianDate = await hijriToGregorian(holiday.hijriDay, holiday.hijriMonth, hijriYear);
        return [holiday.type, gregorianDate] as [IslamicHolidayType, string];
      })
    );

    const holidayDates = Object.fromEntries(entries) as IslamicHolidayDates;

    console.log("✅ [islamicHolidaysService] Fetched Islamic holiday dates:", holidayDates);

    return holidayDates;
  } catch (err) {
    console.warn("❌ [islamicHolidaysService] Failed to fetch holiday dates:", err);
    throw err;
  }
}

// ------------------------------------------------------------
// Detect next upcoming holiday within its showFromDays window
// Returns null if no holiday is approaching soon
// ------------------------------------------------------------
export function getNextIslamicHoliday(holidayDates: IslamicHolidayDates, today: string): UpcomingIslamicHoliday | null {
  let closest: UpcomingIslamicHoliday | null = null;

  for (const holiday of ISLAMIC_HOLIDAYS) {
    const gregorianDate = holidayDates[holiday.type];
    const diffTime = new Date(gregorianDate).getTime() - new Date(today).getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntil >= 1 && daysUntil <= holiday.showFromDays) {
      if (!closest || daysUntil < closest.daysUntil) {
        closest = { type: holiday.type, gregorianDate, daysUntil };
      }
    }
  }

  return closest;
}