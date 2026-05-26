jest.mock('@/store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { TRANSLATIONS } from '@/constants/translations/translations';
import { useLanguageStore } from '@/store/languageStore';

beforeEach(() => {
  useLanguageStore.setState({ language: 'en', tr: TRANSLATIONS.en, isReady: false });
});

describe('languageStore — setLanguage', () => {
  it('starts with language "en" and matching translations', () => {
    const { language, tr } = useLanguageStore.getState();
    expect(language).toBe('en');
    expect(tr).toEqual(TRANSLATIONS.en);
  });

  it('sets language to "de" and updates tr to German translations', () => {
    useLanguageStore.getState().setLanguage('de');
    const { language, tr } = useLanguageStore.getState();
    expect(language).toBe('de');
    expect(tr).toEqual(TRANSLATIONS.de);
  });

  it('sets language to "ar" and updates tr to Arabic translations', () => {
    useLanguageStore.getState().setLanguage('ar');
    const { language, tr } = useLanguageStore.getState();
    expect(language).toBe('ar');
    expect(tr).toEqual(TRANSLATIONS.ar);
  });

  it('tr always reflects the current language', () => {
    const languages = ['en', 'de', 'fr', 'sq', 'bs', 'mk', 'tr', 'ar'] as const;
    for (const lang of languages) {
      useLanguageStore.getState().setLanguage(lang);
      expect(useLanguageStore.getState().tr).toEqual(TRANSLATIONS[lang]);
    }
  });
});
