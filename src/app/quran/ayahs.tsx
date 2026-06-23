import AppError from '@/components/AppError';
import AppLayout from '@/components/AppLayout';
import AppLoading from '@/components/AppLoading';
import QuranAyahRow from '@/components/QuranAyahRow';
import { globalStyles } from '@/constants/styles';
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { Verse } from '@/types/quran.types';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, FlashListRef, ViewToken } from "@shopify/flash-list";
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AyahsScreen() {
  const { surahId, surahName, readingMode } = useLocalSearchParams();
  const surahIdNum = parseInt(surahId as string, 10);
  const surahNameStr = surahName as string;
  const mode = (readingMode as string) || "reading";

  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const tr = useLanguageStore((state) => state.tr);

  // Quran Store
  const ayahs = useQuranStore((state) => state.ayahs);
  const isLoadingAyahs = useQuranStore((state) => state.isLoadingAyahs);
  const isQuranReady = useQuranStore((state) => state.isQuranReady);
  const ayahsError = useQuranStore((state) => state.ayahsError);
  const lastReadSurahId = useQuranStore((state) => state.lastReadSurahId);
  const lastReadAyahId = useQuranStore((state) => state.lastReadAyahId);
  const lastKhatamSurahId = useQuranStore((state) => state.lastKhatamSurahId);
  const lastKhatamAyahId = useQuranStore((state) => state.lastKhatamAyahId);
  const arabicFontSize = useQuranStore((state) => state.arabicFontSize);
  const translationFontSize = useQuranStore((state) => state.translationFontSize);
  const selectedEditions = useQuranStore((state) => state.selectedEditions);
  const getSurahById = useQuranStore((state) => state.getSurahById);
  const fetchAyahs = useQuranStore((state) => state.fetchAyahs);
  const setLastRead = useQuranStore((state) => state.setLastRead);
  const setLastKhatam = useQuranStore((state) => state.setLastKhatam);
  const completeKhatam = useQuranStore((state) => state.completeKhatam);
  const favoriteAyahs = useQuranStore((state) => state.favoriteAyahs);
  const toggleAyahFavorite = useQuranStore((state) => state.toggleAyahFavorite);
  const isAyahFavorite = useQuranStore((state) => state.isAyahFavorite);

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

  // Safe area insets
  const insets = useSafeAreaInsets();
  const topInset = 12;
  const bottomInset = insets.bottom + 12;

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
  const renderAyahItem = useCallback(({ item }: { item: Verse }) => {
    // Arabic needs no translation — show transliteration instead
    const ayahTranslation = language === "ar" ? item.transliteration : (translationMap.get(item.id) ?? null);

    return (
      <QuranAyahRow
        surahId={surahIdNum}
        surahName={surahNameStr}
        verse={item}
        translation={ayahTranslation}
        theme={theme}
        arabicFontSize={arabicFontSize}
        translationFontSize={translationFontSize}
        isSelected={selectedAyah === item.id}
        isAyahFavorited={isAyahFavorite(surahIdNum, item.id)}
        onPress={() => {
          userInteractedRef.current = true;
          setSelectedAyah(item.id);
          if (mode === "reading") {
            setLastRead(surahIdNum, surahNameStr, item.id);
          } else {
            setLastKhatam(surahIdNum, surahNameStr, item.id);
          }
        }}
        onToggleAyahFavorite={() => toggleAyahFavorite({
          surahId: surahIdNum,
          surahName: surahNameStr,
          ayahId: item.id,
          arabicText: item.text,
          translation: ayahTranslation,
        })}
      />
    );
  }, [surahIdNum, surahNameStr, mode, theme, arabicFontSize, translationFontSize, selectedAyah, translationMap, setLastRead, setLastKhatam, favoriteAyahs, toggleAyahFavorite, isAyahFavorite]);

  // ------------------------------------------------------------
  // Footer: Next Surah button (or Complete Khatam on surah 114)
  // ------------------------------------------------------------
  const renderFooter = useCallback(() => {
    if (surahIdNum === 114) {
      if (mode !== "khatam") return null;

      return (
        <TouchableOpacity
          style={[styles.footerCard, { backgroundColor: `${theme.gold}18`, borderColor: theme.border }]}
          activeOpacity={0.6}
          onPress={() => {
            completeKhatam();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Show Khatam celebration modal
            useModalStore.getState().show({
              type: 'alert',
              component: (
                <View style={globalStyles.bannerContainer}>
                  <Text style={globalStyles.bannerEmoji}>📖</Text>
                  <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{tr.labels.khatamCompleteTitle}</Text>
                  <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.khatamCompleteMessage}</Text>
                </View>
              ),
              buttons: [{
                label: 'OK',
                action: 'ok',
                onPress: () => router.back(),
                buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
                labelStyle: { fontSize: 16, fontWeight: '600', color: theme.accent },
              }],
              celebrationAnimation: true,
            });
          }}
        >
          <View style={[styles.footerIcon, { backgroundColor: `${theme.gold}25` }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={theme.gold} />
          </View>
          <Text style={[styles.footerCardLabel, { color: theme.gold }]}>
            {tr.labels.khatamFinish}
          </Text>
        </TouchableOpacity>
      );
    }

    // For other surahs, show "Next Surah" button in both modes
    const nextSurah = getSurahById(surahIdNum + 1);
    if (!nextSurah) return null;

    return (
      // "Next Surah" Button
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
            pathname: "/quran/ayahs",
            params: {
              surahId: nextSurah.id,
              surahName: nextSurah.transliteration,
              readingMode: mode,
            },
          });
        }}
      >
        <View style={[styles.footerIcon, { backgroundColor: `${theme.gold}20` }]}>
          <Ionicons name="arrow-forward-circle-outline" size={22} color={theme.gold} />
        </View>
        <View style={styles.footerCardText}>
          <Text style={[styles.footerCardHint, { color: theme.text2 }]}>
            {tr.labels.nextSurah}
          </Text>
          <Text style={[styles.footerCardLabel, { color: theme.text }]}>
            {nextSurah.transliteration}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.gold} />
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
    <AppLayout>

      {/* Top Navigation bar */}
      <Stack.Screen
        options={{
          title: surahNameStr,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
              {/* Quran Settings Icon */}
              <TouchableOpacity
                delayPressIn={0}
                delayPressOut={0}
                activeOpacity={0.3}
                disabled={isLoadingAyahs}
                onPress={() => router.navigate('/(modals)/quranSettings')}
              >
                <Ionicons name="settings-outline" size={24} color={theme.text2} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* AYAHS List */}
      <FlashList
        ref={flashListRef}
        data={verses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderAyahItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }}
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

    </AppLayout>
  );
}

const styles = StyleSheet.create({
  // Footer Card
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