import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { Stack } from 'expo-router';
import React from 'react';

export default function QuranLayout() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen
        name="surahs"
        options={{
          title: tr.labels.quranSurahs,
          headerShown: true,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="ayahs"
        options={{
          title: tr.labels.ayahs,
          headerShown: true,
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}