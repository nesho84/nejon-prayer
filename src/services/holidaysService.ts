import { ALL_HOLIDAYS, HOLIDAY_CONFIG, HOLIDAY_HIJRI_DATES, HolidayName, UPCOMING_HOLIDAYS, UpcomingHoliday, YearlyHolidays } from "@/types/holiday.types";

interface AladhanGToHResponse {
  data: { hijri: { year: string } };
}

interface AladhanHolidayDay {
  hijri: {
    day: string;
    month: { number: number };
    holidays: string[];
  };
  gregorian: { date: string }; // "DD-MM-YYYY"
}

interface AladhanHolidaysResponse {
  data?: AladhanHolidayDay[];
}

// ------------------------------------------------------------
// Fetch all Islamic holidays for a given Hijri year
// ------------------------------------------------------------
async function fetchHolidaysForHijriYear(hijriYear: number): Promise<AladhanHolidayDay[]> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://api.aladhan.com/v1/islamicHolidaysByHijriYear/${hijriYear}`, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AladhanHolidaysResponse = await response.json();

    if (!result?.data) {
      throw new Error("Invalid API response structure");
    }

    return result.data;

  } catch (err) {
    console.warn(`❌ [holidaysService] Failed to fetch holidays for Hijri year ${hijriYear}:`, err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Fetch and normalize all known holidays for the current and next
// Hijri year. Fetched once per year — covers the full Gregorian
// year ahead. Returns a map keyed by HolidayName:
// { ramadan_start: ["2027-02-08", "2028-01-28"], ... }
// ------------------------------------------------------------
export async function getYearlyHolidays(): Promise<{ holidays: YearlyHolidays; complete: boolean }> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    // Get current Hijri year
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 10000);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();

    const gToHRes = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`, { signal: controller.signal });

    // gToH network call resolved — clear its 10s abort timer now so it can't
    // fire (a no-op) while the three year fetches below run on their own timeouts.
    clearTimeout(timeout);

    if (!gToHRes.ok) {
      throw new Error(`HTTP error! status: ${gToHRes.status}`);
    }

    const gToHData: AladhanGToHResponse = await gToHRes.json();
    const hijriYear = parseInt(gToHData.data.hijri.year);

    // Fetch all holidays for the previous, current and next Hijri year
    // (prev covers Jan–Jun holidays that fall in the current Gregorian year)
    const results = await Promise.allSettled([
      fetchHolidaysForHijriYear(hijriYear - 1),
      fetchHolidaysForHijriYear(hijriYear),
      fetchHolidaysForHijriYear(hijriYear + 1),
    ]);

    // If every year failed, treat it as a hard failure — don't cache an empty map
    if (results.every((r) => r.status === "rejected")) {
      throw new Error("All Hijri-year holiday fetches failed");
    }

    const [prevYear, thisYear, nextYear] = results.map((r) =>
      r.status === "fulfilled" ? r.value : []
    );

    // Complete only when all three Hijri years resolved — drives whether the
    // store locks in the year or retries on next launch
    const complete = results.every((r) => r.status === "fulfilled");

    // Normalize into a map keyed by HolidayName, matching by Hijri month/day
    const yearlyHolidays: YearlyHolidays = {};
    const currentGregorianYear = now.getFullYear();

    [...prevYear, ...thisYear, ...nextYear].forEach((day) => {
      const hijriMonth = day.hijri.month.number;
      const hijriDay = Number(day.hijri.day);

      // Find which known holiday matches this Hijri date
      const match = ALL_HOLIDAYS.find((name) =>
        HOLIDAY_HIJRI_DATES[name].month === hijriMonth &&
        HOLIDAY_HIJRI_DATES[name].day === hijriDay
      );

      if (!match) return;

      // Convert "DD-MM-YYYY" → "YYYY-MM-DD"
      const [d, m, y] = day.gregorian.date.split("-");
      const gregorianDate = `${y}-${m}-${d}`;
      const gregYear = parseInt(y);

      // Only keep dates from the current or next Gregorian year
      if (gregYear < currentGregorianYear || gregYear > currentGregorianYear + 1) return;

      // Append to the holiday's date list (skip duplicates from the overlapping Hijri-year fetches)
      if (!yearlyHolidays[match]) {
        yearlyHolidays[match] = [];
      }
      const dates = yearlyHolidays[match];
      if (!dates.includes(gregorianDate)) {
        dates.push(gregorianDate);
      }
    });

    console.log(`✅ [holidaysService] Normalized holidays for Hijri ${hijriYear - 1}-${hijriYear + 1} (Gregorian ${currentGregorianYear}-${currentGregorianYear + 1})`);

    return { holidays: yearlyHolidays, complete };

  } catch (err) {
    console.warn("❌ [holidaysService] Failed to fetch yearly holidays:", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ------------------------------------------------------------
// Find a holiday's next occurrence on or after today
// ------------------------------------------------------------
export function getHolidayDate(yearlyHolidays: YearlyHolidays, name: HolidayName, today: string): string | null {
  const dates = yearlyHolidays[name] ?? [];
  return dates.filter((date) => date >= today).sort()[0] ?? null;
}

// ------------------------------------------------------------
// Find the next upcoming holiday within its showFromDays window
// ------------------------------------------------------------
export function getNextHoliday(yearlyHolidays: YearlyHolidays, today: string): UpcomingHoliday | null {
  let closest: UpcomingHoliday | null = null;

  for (const name of UPCOMING_HOLIDAYS) {
    const config = HOLIDAY_CONFIG[name];
    const gregorianDate = getHolidayDate(yearlyHolidays, name, today);
    if (!gregorianDate) continue;

    const diffTime = new Date(gregorianDate).getTime() - new Date(today).getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntil >= 1 && daysUntil <= config.showFromDays) {
      if (!closest || daysUntil < closest.daysUntil) {
        closest = { name, gregorianDate, daysUntil };
      }
    }
  }

  return closest;
}
