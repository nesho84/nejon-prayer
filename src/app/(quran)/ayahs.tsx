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
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const QURAN_COLOR = "#d1a127";

export default function AyahsScreen() {
  const { surahId, surahName, readingMode } = useLocalSearchParams();
  const surahIdNum = parseInt(surahId as string, 10);
  const surahNameStr = surahName as string;
  const mode = (readingMode as string) || "reading";

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
  const lastKhatamSurahId = useQuranStore((s) => s.lastKhatamSurahId);
  const lastKhatamAyahId = useQuranStore((s) => s.lastKhatamAyahId);
  const arabicFontSize = useQuranStore((state) => state.arabicFontSize);
  const translationFontSize = useQuranStore((state) => state.translationFontSize);
  const selectedEditions = useQuranStore((s) => s.selectedEditions);
  const getSurahById = useQuranStore((s) => s.getSurahById);
  const fetchAyahs = useQuranStore((s) => s.fetchAyahs);
  const setLastRead = useQuranStore((s) => s.setLastRead);
  const setLastKhatam = useQuranStore((s) => s.setLastKhatam);
  const completeKhatam = useQuranStore((s) => s.completeKhatam);

  // Local state / refs
  const [selectedAyah, setSelectedAyah] = useState<number | null>(() => {
    if (mode === "reading") {
      return lastReadSurahId === surahIdNum ? lastReadAyahId : null;
    } else {
      return lastKhatamSurahId === surahIdNum ? lastKhatamAyahId : null;
    }
  });
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

    // FlashList will remount after fetch; re-enable scroll-to-last-read
    hasScrolledRef.current = false;

    fetchAyahs(surahIdNum);
  }, [isQuranReady, language, selectedEditions]);

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
      if (mode === "reading") {
        setLastRead(surahIdNum, surahNameStr, firstVisible.id);
      } else {
        setLastKhatam(surahIdNum, surahNameStr, firstVisible.id);
      }
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
        if (mode === "reading") {
          setLastRead(surahIdNum, surahNameStr, item.id);
        } else {
          setLastKhatam(surahIdNum, surahNameStr, item.id);
        }
      }}
    />
  ), [surahIdNum, surahNameStr, mode, theme, arabicFontSize, translationFontSize, selectedAyah, translationMap, setLastRead, setLastKhatam]);

  // ------------------------------------------------------------
  // Footer: Next Surah button (or Complete Khatam on surah 114)
  // ------------------------------------------------------------
  const renderFooter = useCallback(() => {
    if (surahIdNum === 114) {
      if (mode !== "khatam") return null;
      return (
        <TouchableOpacity
          style={[styles.footerCard, { backgroundColor: `${QURAN_COLOR}18`, borderColor: theme.border }]}
          activeOpacity={0.6}
          onPress={() => {
            completeKhatam();
            Alert.alert(
              tr.labels.khatamCompleteTitle,
              tr.labels.khatamCompleteMessage,
              [{ text: "OK", onPress: () => router.back() }]
            );
          }}
        >
          <View style={[styles.footerIcon, { backgroundColor: `${QURAN_COLOR}25` }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={QURAN_COLOR} />
          </View>
          <Text style={[styles.footerCardLabel, { color: QURAN_COLOR }]}>
            {tr.labels.khatamFinish}
          </Text>
        </TouchableOpacity>
      );
    }

    const nextSurah = getSurahById(surahIdNum + 1);
    if (!nextSurah) return null;

    return (
      <TouchableOpacity
        style={[styles.footerCard, { backgroundColor: theme.overlayLight, borderColor: theme.border }]}
        activeOpacity={0.6}
        onPress={() => {
          if (mode === "khatam") {
            const firstAyahId = nextSurah.verses?.[0]?.id ?? null;
            if (firstAyahId !== null) {
              setLastKhatam(nextSurah.id, nextSurah.transliteration, firstAyahId);
            }
          }
          router.replace({
            pathname: "/(quran)/ayahs",
            params: {
              surahId: nextSurah.id,
              surahName: nextSurah.transliteration,
              readingMode: mode,
            },
          });
        }}
      >
        <View style={[styles.footerIcon, { backgroundColor: `${QURAN_COLOR}20` }]}>
          <Ionicons name="arrow-forward-circle-outline" size={22} color={QURAN_COLOR} />
        </View>
        <View style={styles.footerCardText}>
          <Text style={[styles.footerCardHint, { color: theme.text2 }]}>
            {tr.labels.nextSurah}
          </Text>
          <Text style={[styles.footerCardLabel, { color: theme.text }]}>
            {nextSurah.transliteration}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={QURAN_COLOR} />
      </TouchableOpacity>
    );
  }, [surahIdNum, mode, theme, tr, getSurahById, setLastKhatam, completeKhatam]);

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
        ListFooterComponent={renderFooter}
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
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  footerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerCardText: {
    flex: 1,
  },
  footerCardHint: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerCardLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});