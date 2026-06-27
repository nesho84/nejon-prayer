import AppLayout from '@/components/AppLayout';
import QuranAyahRow from '@/components/QuranAyahRow';
import { useLanguageStore } from '@/store/languageStore';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { FavoriteAyah } from '@/types/quran.types';
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AyahsFavoritesScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Quran Store
  const favoriteAyahs = useQuranStore((state) => state.favoriteAyahs);
  const arabicFontSize = useQuranStore((state) => state.arabicFontSize);
  const translationFontSize = useQuranStore((state) => state.translationFontSize);
  const toggleAyahFavorite = useQuranStore((state) => state.toggleAyahFavorite);

  // Safe area insets
  const insets = useSafeAreaInsets();
  const topInset = 12;
  const bottomInset = insets.bottom + 12;

  // ------------------------------------------------------------
  // Render a single favorite ayah row
  // ------------------------------------------------------------
  const renderItem = useCallback(({ item }: { item: FavoriteAyah }) => (
    <QuranAyahRow
      surahId={item.surahId}
      surahName={item.surahName}
      verse={{ id: item.ayahId, text: item.arabicText, transliteration: '' }}
      translation={item.translation}
      theme={theme}
      arabicFontSize={arabicFontSize}
      translationFontSize={translationFontSize}
      isSelected={false}
      isAyahFavorited={true}
      onPress={() => { }}
      onToggleAyahFavorite={() => toggleAyahFavorite({
        surahId: item.surahId,
        surahName: item.surahName,
        ayahId: item.ayahId,
        arabicText: item.arabicText,
        translation: item.translation,
      })}
    />
  ), [theme, arabicFontSize, translationFontSize, toggleAyahFavorite]);

  return (
    <AppLayout>

      {/* Navigation bar */}
      <Stack.Screen
        options={{
          title: tr.labels.ayahsFavorites,
          headerRight: () => (
            <TouchableOpacity
              delayPressIn={0}
              delayPressOut={0}
              activeOpacity={0.3}
              onPress={() => router.navigate('/(modals)/quranSettings')}
            >
              <Ionicons name="settings-outline" size={24} color={theme.text2} />
            </TouchableOpacity>
          ),
        }}
      />

      {favoriteAyahs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={52} color={theme.gold} style={{ opacity: 0.45 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{tr.labels.noAyahsFavorites}</Text>
          <Text style={[styles.emptyDesc, { color: theme.text2 }]}>{tr.labels.ayahsFavoritesDesc}</Text>
        </View>
      ) : (
        // AYAHS List
        <FlashList
          data={favoriteAyahs}
          keyExtractor={(item) => `${item.surahId}-${item.ayahId}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }}
          showsVerticalScrollIndicator={false}
        />
      )}

    </AppLayout>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
});
