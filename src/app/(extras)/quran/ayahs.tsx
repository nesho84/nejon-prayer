import AppError from '@/components/AppError';
import AppLoading from '@/components/AppLoading';
import AppScreen from '@/components/AppScreen';
import QuranAyahRow from '@/components/QuranAyahRow';
import { Verse } from '@/services/quranService';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, FlashListRef, ViewToken } from "@shopify/flash-list";
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function AyahsScreen() {
  const { surahId, surahName } = useLocalSearchParams();
  const surahIdNum = parseInt(surahId as string, 10);
  const surahNameStr = surahName as string;

  // Stores
  const theme = useThemeStore((s) => s.theme);
  const tr = useLanguageStore((s) => s.tr);
  const language = useLanguageStore((s) => s.language);

  // Quran Store
  const ayahs = useQuranStore((s) => s.ayahs);
  const isLoadingAyahs = useQuranStore((s) => s.isLoadingAyahs);
  const isQuranReady = useQuranStore((s) => s.isQuranReady);
  const ayahsError = useQuranStore((s) => s.ayahsError);
  const lastReadSurahId = useQuranStore((s) => s.lastReadSurahId);
  const lastReadAyahId = useQuranStore((s) => s.lastReadAyahId);
  const arabicFontSize = useQuranStore((state) => state.arabicFontSize);
  const translationFontSize = useQuranStore((state) => state.translationFontSize);
  const getSurahById = useQuranStore((s) => s.getSurahById);
  const fetchAyahs = useQuranStore((s) => s.fetchAyahs);
  const setLastRead = useQuranStore((s) => s.setLastRead);

  // Local state / refs
  const [selectedAyah, setSelectedAyah] = useState<number | null>(
    lastReadSurahId === surahIdNum ? lastReadAyahId : null
  );
  const flashListRef = useRef<FlashListRef<Verse>>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrolledRef = useRef(false);
  const userInteractedRef = useRef(false);

  // Arabic verses — always from local JSON
  const verses = getSurahById(surahIdNum)?.verses ?? [];

  // Translation keyed by verse number for fast lookup
  const translationMap = useMemo(() =>
    new Map(ayahs?.map((a) => [a.numberInSurah, a.text])),
    [ayahs]);

  // ------------------------------------------------------------
  // Fetch translation when ready or language changes (skipped for Arabic)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isQuranReady || language === "ar") return;
    fetchAyahs(surahIdNum);
  }, [isQuranReady, language]);

  // ------------------------------------------------------------
  // Scroll to the last-read ayah
  // ------------------------------------------------------------
  const scrollToAyah = useCallback(() => {
    if (!selectedAyah) return;

    const index = verses.findIndex(v => v.id === selectedAyah);
    if (index === -1) return;

    flashListRef.current?.scrollToIndex({ index, animated: false });
  }, [selectedAyah, verses]);

  // ------------------------------------------------------------
  // Handle viewable items change to update last read only after user interaction
  // ------------------------------------------------------------
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<Verse>[] }) => {
    if (!userInteractedRef.current) return; // <-- do nothing until user scrolls or taps

    const firstVisible = viewableItems[0]?.item;
    if (!firstVisible) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      // setSelectedAyah(firstVisible.id); // <-- optional: update selected on scroll
      setLastRead(surahIdNum, surahNameStr, firstVisible.id);
    }, 200);
  }).current;

  // ------------------------------------------------------------
  // Render a single ayah row
  // ------------------------------------------------------------
  const renderAyahItem = useCallback(({ item }: { item: Verse }) => (
    <QuranAyahRow
      surahId={surahIdNum}
      surahName={surahNameStr}
      verse={item}
      translation={translationMap.get(item.id) ?? null}
      theme={theme}
      arabicFontSize={arabicFontSize}
      translationFontSize={translationFontSize}
      isSelected={selectedAyah === item.id}
      onPress={() => {
        userInteractedRef.current = true;
        setSelectedAyah(item.id);
        setLastRead(surahIdNum, surahNameStr, item.id);
      }}
    />
  ), [surahIdNum, surahNameStr, theme, arabicFontSize, translationFontSize, selectedAyah, translationMap, setLastRead]);

  // Loading state
  if (isLoadingAyahs) {
    return <AppLoading text={tr.labels.loading} />;
  }

  // Error state
  if (ayahsError) {
    return (
      <AppError
        message={tr.labels.quranAyahsError}
        buttonText={tr.buttons.retry}
        onPress={() => fetchAyahs(surahIdNum)}
      />
    );
  }

  return (
    <AppScreen>
      {/* Top Navigation bar */}
      <Stack.Screen
        options={{
          title: surahNameStr,
          headerRight: () => (
            <TouchableOpacity
              delayPressIn={0}
              delayPressOut={0}
              activeOpacity={0.3}
              disabled={isLoadingAyahs}
              onPress={() => router.navigate('/(modals)/quranSettings')}
            >
              <Ionicons name="settings-outline" size={24} color={theme.text2} />
            </TouchableOpacity>
          ),
        }}
      />

      <FlashList
        ref={flashListRef}
        data={verses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderAyahItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        contentContainerStyle={styles.ayahList}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => userInteractedRef.current = true}
        onLayout={() => {
          if (hasScrolledRef.current) return;
          scrollToAyah();
          setTimeout(() => scrollToAyah(), 200);
          hasScrolledRef.current = true;
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  ayahList: {
    paddingBottom: 24,
  },
});