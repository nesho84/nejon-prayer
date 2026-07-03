import { fetchAyahsFromApi, getSurahAudioUrl, QURAN_TEXT_EDITIONS } from '@/services/quranService';
import { Ayah } from '@/types/quran.types';

const MOCK_AYAHS: Ayah[] = [
  { number: 1, numberInSurah: 1, text: 'In the name of Allah' },
  { number: 2, numberInSurah: 2, text: 'Praise be to Allah' },
];

describe('fetchAyahsFromApi', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns parsed ayahs on a successful response', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ayahs: MOCK_AYAHS } }),
    });

    const result = await fetchAyahsFromApi(1, 'en.sahih');
    expect(result).toEqual(MOCK_AYAHS);
  });

  it('calls the correct API URL', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ayahs: MOCK_AYAHS } }),
    });

    await fetchAyahsFromApi(2, 'de.bubenheim');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.alquran.cloud/v1/surah/2/de.bubenheim',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('throws on non-OK HTTP response', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(fetchAyahsFromApi(1, 'en.sahih')).rejects.toThrow('HTTP error! status: 404');
  });
});

describe('QURAN_TEXT_EDITIONS', () => {
  it('has an English sahih edition', () => {
    expect(QURAN_TEXT_EDITIONS.en.sahih).toBe('en.sahih');
  });

  it('has a Turkish diyanet edition', () => {
    expect(QURAN_TEXT_EDITIONS.tr.diyanet).toBe('tr.diyanet');
  });

  it('has a German bubenheim edition', () => {
    expect(QURAN_TEXT_EDITIONS.de.bubenheim).toBe('de.bubenheim');
  });
});

describe('getSurahAudioUrl', () => {
  it('returns the correct CDN URL for a surah', () => {
    expect(getSurahAudioUrl(1)).toBe(
      'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3'
    );
  });

  it('uses the provided edition when specified', () => {
    expect(getSurahAudioUrl(36, 'ar.abdulbasitmurattal')).toContain('ar.abdulbasitmurattal');
  });
});