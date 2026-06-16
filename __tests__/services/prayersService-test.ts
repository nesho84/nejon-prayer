
import { getMethodForCountry, getYearlyPrayerTimes } from '@/services/prayersService';
import { AppLocation } from '@/types/location.types';

// ------------------------------------------------------------
// Minimal Aladhan API response factory
// ------------------------------------------------------------
function makeAladhanResponse(dateStr: string, timings: Record<string, string>) {
  return {
    data: {
      '1': [
        {
          timings,
          date: { gregorian: { date: dateStr } },
        },
      ],
    },
  };
}

const VALID_LOCATION: AppLocation = { latitude: 48.2, longitude: 16.37 };

// ------------------------------------------------------------
// getMethodForCountry
// ------------------------------------------------------------
describe('getMethodForCountry', () => {
  it('returns 13 for Turkey (Diyanet)', () => {
    expect(getMethodForCountry('TR')).toBe(13);
  });

  it('returns 5 for Egypt', () => {
    expect(getMethodForCountry('EG')).toBe(5);
  });

  it('returns 2 for USA (ISNA)', () => {
    expect(getMethodForCountry('US')).toBe(2);
  });

  it('returns 4 for Saudi Arabia (Umm Al-Qura)', () => {
    expect(getMethodForCountry('SA')).toBe(4);
  });

  it('returns 3 (MWL fallback) for an unknown country code', () => {
    expect(getMethodForCountry('XX')).toBe(3);
  });

  it('returns 3 (MWL fallback) for an empty string', () => {
    expect(getMethodForCountry('')).toBe(3);
  });
});

// ------------------------------------------------------------
// getYearlyPrayerTimes
// ------------------------------------------------------------
describe('getYearlyPrayerTimes', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  it('converts Aladhan date format "DD-MM-YYYY" to ISO "YYYY-MM-DD"', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeAladhanResponse('01-03-2026', {
          Imsak: '05:00', Fajr: '05:20', Sunrise: '06:45',
          Dhuhr: '12:30', Asr: '15:40', Maghrib: '18:15', Isha: '19:30',
        }),
    });

    const result = await getYearlyPrayerTimes(VALID_LOCATION, 2026, 'AT');
    expect(Object.keys(result)).toContain('2026-03-01');
  });

  it('strips timezone suffix from prayer times e.g. "06:10 (CET)" → "06:10"', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeAladhanResponse('15-01-2026', {
          Imsak: '05:00 (CET)', Fajr: '05:20 (CET)', Sunrise: '06:45 (CET)',
          Dhuhr: '12:30 (CET)', Asr: '15:40 (CET)', Maghrib: '18:15 (CET)', Isha: '19:30 (CET)',
        }),
    });

    const result = await getYearlyPrayerTimes(VALID_LOCATION, 2026, 'AT');
    const day = result['2026-01-15'];
    expect(day.Fajr).toBe('05:20');
    expect(day.Isha).toBe('19:30');
  });

  it('returns all 7 prayer keys for a day', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeAladhanResponse('10-06-2026', {
          Imsak: '03:10', Fajr: '03:30', Sunrise: '05:10',
          Dhuhr: '13:00', Asr: '17:00', Maghrib: '21:00', Isha: '23:10',
        }),
    });

    const result = await getYearlyPrayerTimes(VALID_LOCATION, 2026, 'DE');
    const day = result['2026-06-10'];
    expect(Object.keys(day)).toEqual(['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
  });

  it('throws when coordinates are not numbers', async () => {
    const bad = { latitude: 'bad', longitude: 16.37 } as unknown as AppLocation;
    await expect(getYearlyPrayerTimes(bad, 2026, 'AT')).rejects.toThrow('Invalid location coordinates');
  });

  it('throws on non-OK HTTP response', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getYearlyPrayerTimes(VALID_LOCATION, 2026, 'AT')).rejects.toThrow('HTTP error! status: 500');
  });

  it('throws when API response is missing data field', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }), // no data field
    });
    await expect(getYearlyPrayerTimes(VALID_LOCATION, 2026, 'AT')).rejects.toThrow('Invalid API response structure');
  });
});
