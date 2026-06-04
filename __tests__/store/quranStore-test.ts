jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/services/quranService', () => ({
  fetchAyahsFromApi: jest.fn(),
  loadQuranTransliterationJson: jest.fn(),
  QURAN_TEXT_EDITIONS: {
    en: { sahih: 'en.sahih' },
    de: { bubenheim: 'de.bubenheim' },
    fr: { hamidullah: 'fr.hamidullah' },
    sq: { ahmeti: 'sq.ahmeti' },
    bs: { korkut: 'bs.korkut' },
    mk: { sahih: 'mk.sahih' },
    tr: { diyanet: 'tr.diyanet' },
  },
}));

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: { getState: jest.fn() },
}));

import { fetchAyahsFromApi, loadQuranTransliterationJson } from '@/services/quranService';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { FavoriteAyah } from '@/types/quran.types';

const mockFetchAyahs = fetchAyahsFromApi as jest.Mock;
const mockLoadQuran = loadQuranTransliterationJson as jest.Mock;
const mockLanguageGetState = (useLanguageStore as any).getState as jest.Mock;

const MOCK_SURAH = { id: 1, name: 'Al-Fatiha', verses: [{ id: 1, text: 'Bismillah' }] };
const MOCK_AYAHS = [{ id: 1, text: 'Ayah 1' }, { id: 2, text: 'Ayah 2' }];

beforeEach(() => {
  jest.clearAllMocks();
  useQuranStore.setState({
    quran: null, surahs: null, quranError: null, isQuranReady: false,
    ayahs: null, isLoadingAyahs: false, ayahsError: null,
    lastReadSurahId: null, lastReadSurahName: null, lastReadAyahId: null,
    lastKhatamSurahId: null, lastKhatamSurahName: null, lastKhatamAyahId: null,
    khatamCount: 0, favoriteAyahs: [],
    arabicFontSize: 26, translationFontSize: 18,
  });
  mockLanguageGetState.mockReturnValue({ language: 'en' });
});

describe('quranStore — loadFullQuran', () => {
  it('loads quran and derives surahs list (without verses)', () => {
    mockLoadQuran.mockReturnValue([MOCK_SURAH]);
    useQuranStore.getState().loadFullQuran();
    const { quran, surahs, isQuranReady, quranError } = useQuranStore.getState();
    expect(quran).toEqual([MOCK_SURAH]);
    expect(surahs).toHaveLength(1);
    expect((surahs![0] as any).verses).toBeUndefined();
    expect(isQuranReady).toBe(true);
    expect(quranError).toBeNull();
  });

  it('sets quranError when loadQuranTransliterationJson throws', () => {
    mockLoadQuran.mockImplementation(() => { throw new Error('file missing'); });
    useQuranStore.getState().loadFullQuran();
    expect(useQuranStore.getState().quranError).toBeTruthy();
    expect(useQuranStore.getState().isQuranReady).toBe(true);
  });
});

describe('quranStore — fetchAyahs', () => {
  it('skips API call when language is "ar"', async () => {
    mockLanguageGetState.mockReturnValue({ language: 'ar' });
    await useQuranStore.getState().fetchAyahs(1);
    expect(mockFetchAyahs).not.toHaveBeenCalled();
  });

  it('calls fetchAyahsFromApi and stores ayahs for non-Arabic language', async () => {
    mockFetchAyahs.mockResolvedValue(MOCK_AYAHS);
    await useQuranStore.getState().fetchAyahs(1);
    expect(mockFetchAyahs).toHaveBeenCalledTimes(1);
    expect(useQuranStore.getState().ayahs).toEqual(MOCK_AYAHS);
    expect(useQuranStore.getState().isLoadingAyahs).toBe(false);
  });

  it('sets ayahsError when fetchAyahsFromApi throws', async () => {
    mockFetchAyahs.mockRejectedValue(new Error('network error'));
    await useQuranStore.getState().fetchAyahs(1);
    expect(useQuranStore.getState().ayahsError).toBeTruthy();
    expect(useQuranStore.getState().isLoadingAyahs).toBe(false);
  });
});

describe('quranStore — reading position', () => {
  it('setLastRead stores surah and ayah position', () => {
    useQuranStore.getState().setLastRead(2, 'Al-Baqara', 5);
    const { lastReadSurahId, lastReadSurahName, lastReadAyahId } = useQuranStore.getState();
    expect(lastReadSurahId).toBe(2);
    expect(lastReadSurahName).toBe('Al-Baqara');
    expect(lastReadAyahId).toBe(5);
  });

  it('setLastKhatam stores khatam position', () => {
    useQuranStore.getState().setLastKhatam(3, 'Al-Imran', 10);
    expect(useQuranStore.getState().lastKhatamSurahId).toBe(3);
    expect(useQuranStore.getState().lastKhatamAyahId).toBe(10);
  });

  it('completeKhatam increments khatamCount and resets position', () => {
    useQuranStore.getState().setLastKhatam(114, 'An-Nas', 6);
    useQuranStore.getState().completeKhatam();
    expect(useQuranStore.getState().khatamCount).toBe(1);
    expect(useQuranStore.getState().lastKhatamSurahId).toBeNull();
  });
});

describe('quranStore — favorites', () => {
  const FAV: FavoriteAyah = { surahId: 1, ayahId: 1, arabicText: 'Bismillah', surahName: 'Al-Fatiha', translation: null };

  it('toggleAyahFavorite adds an ayah when not present', () => {
    useQuranStore.getState().toggleAyahFavorite(FAV);
    expect(useQuranStore.getState().favoriteAyahs).toHaveLength(1);
  });

  it('toggleAyahFavorite removes an ayah when already present', () => {
    useQuranStore.getState().toggleAyahFavorite(FAV);
    useQuranStore.getState().toggleAyahFavorite(FAV);
    expect(useQuranStore.getState().favoriteAyahs).toHaveLength(0);
  });

  it('isAyahFavorite returns true for a saved ayah', () => {
    useQuranStore.getState().toggleAyahFavorite(FAV);
    expect(useQuranStore.getState().isAyahFavorite(1, 1)).toBe(true);
  });

  it('isAyahFavorite returns false for an unsaved ayah', () => {
    expect(useQuranStore.getState().isAyahFavorite(99, 99)).toBe(false);
  });
});

describe('quranStore — setQuranSettings', () => {
  it('updates arabicFontSize', () => {
    useQuranStore.getState().setQuranSettings({ arabicFontSize: 32 });
    expect(useQuranStore.getState().arabicFontSize).toBe(32);
  });

  it('updates translationFontSize without touching arabicFontSize', () => {
    useQuranStore.getState().setQuranSettings({ translationFontSize: 20 });
    expect(useQuranStore.getState().translationFontSize).toBe(20);
    expect(useQuranStore.getState().arabicFontSize).toBe(26);
  });
});