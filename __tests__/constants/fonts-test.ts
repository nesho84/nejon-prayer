import { DEFAULT_QURAN_FONT, getQuranFont, QURAN_FONTS, QuranFontKey } from '@/constants/fonts';

describe('getQuranFont', () => {
  it('falls back to the default definition for undefined', () => {
    // users persisted before this setting existed have no stored key
    expect(getQuranFont(undefined)).toBe(QURAN_FONTS[DEFAULT_QURAN_FONT]);
  });

  it('falls back to the default definition for an unknown key', () => {
    expect(getQuranFont('nope' as QuranFontKey)).toBe(QURAN_FONTS[DEFAULT_QURAN_FONT]);
  });

  it('returns the matching definition for every known key', () => {
    (Object.keys(QURAN_FONTS) as QuranFontKey[]).forEach((key) => {
      expect(getQuranFont(key).key).toBe(key);
    });
  });
});

describe('QURAN_FONTS families', () => {
  it('leaves the system font on the platform default', () => {
    expect(getQuranFont('system').family).toBeUndefined();
  });

  it('defines a family for both embedded fonts', () => {
    expect(getQuranFont('uthmani').family).toBe('KFGQPCUthmanicScriptHAFS');
    expect(getQuranFont('amiri').family).toBe('AmiriQuran-Regular');
  });

  it('matches a real file in assets/fonts', () => {
    // Android resolves fontFamily from the filename, iOS from the font's PostScript
    // name — they only agree when both equal the basename. A rename here fails
    // silently on device (the font just falls back), so pin it in a test.
    const fs = require('fs');
    const path = require('path');
    const fontsDir = path.join(process.cwd(), 'assets/fonts');
    const basenames = fs.readdirSync(fontsDir).map((file: string) => path.parse(file).name);

    Object.values(QURAN_FONTS).forEach(({ key, family }) => {
      if (key === DEFAULT_QURAN_FONT) return;
      expect(basenames).toContain(family);
    });
  });
});

describe('QURAN_FONTS metrics', () => {
  it('keeps the system line-height ratio at the shipped 1.85', () => {
    // changing this re-lays out the reader for every existing user on upgrade
    expect(getQuranFont('system').lineHeightRatio).toBe(1.85);
  });

  it('scales the chosen size per font', () => {
    const base = 20;
    expect(base * getQuranFont('system').sizeScale).toBe(20);
    expect(base * getQuranFont('uthmani').sizeScale).toBe(20);
    expect(base * getQuranFont('amiri').sizeScale).toBeCloseTo(23);
  });

  it('derives line height from the scaled size, not the raw size', () => {
    const amiri = getQuranFont('amiri');
    const scaled = 20 * amiri.sizeScale;
    expect(scaled * amiri.lineHeightRatio).toBeCloseTo(48.3);
  });
});
