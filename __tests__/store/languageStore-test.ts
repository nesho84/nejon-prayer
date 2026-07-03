import { GLOBAL_TR } from '@/constants/translations/global.tr';
import { useLanguageStore } from '@/store/languageStore';

jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

beforeEach(() => {
  useLanguageStore.setState({ language: 'en', tr: GLOBAL_TR.en, isReady: false });
});

describe('languageStore — setLanguage', () => {
  it('starts with language "en" and matching translations', () => {
    const { language, tr } = useLanguageStore.getState();
    expect(language).toBe('en');
    expect(tr).toEqual(GLOBAL_TR.en);
  });

  it('sets language to "de" and updates tr to German translations', () => {
    useLanguageStore.getState().setLanguage('de');
    const { language, tr } = useLanguageStore.getState();
    expect(language).toBe('de');
    expect(tr).toEqual(GLOBAL_TR.de);
  });

  it('tr always reflects the current language across every supported language', () => {
    const languages = ['en', 'de', 'fr', 'sq', 'bs', 'mk', 'tr', 'ar'] as const;
    for (const lang of languages) {
      useLanguageStore.getState().setLanguage(lang);
      expect(useLanguageStore.getState().tr).toEqual(GLOBAL_TR[lang]);
    }
  });
});
