import AppScreen from '@/components/AppScreen';
import QuranAyahRow from '@/components/QuranAyahRow';
import { useLanguageStore } from '@/store/languageStore';
import { FavoriteAyah } from '@/types/quran.types';
import { useQuranStore } from '@/store/quranStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AyahsFavoritesScreen() {
  // Stores
  const theme = useThemeStore((s) => s.theme);
  const tr = useLanguageStore((s) => s.tr);

  // Quran Store
  const favoriteAyahs = useQuranStore((s) => s.favoriteAyahs);
  const arabicFontSize = useQuranStore((s) => s.arabicFontSize);
  const translationFontSize = useQuranStore((s) => s.translationFontSize);
  const toggleAyahFavorite = useQuranStore((s) => s.toggleAyahFavorite);

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
    <AppScreen>

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
        <FlashList
          data={favoriteAyahs}
          keyExtractor={(item) => `${item.surahId}-${item.ayahId}`}
          renderItem={renderItem}
          contentContainerStyle={styles.ayahList}
          showsVerticalScrollIndicator={false}
        />
      )}

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  ayahList: {
    paddingBottom: 24,
  },
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
