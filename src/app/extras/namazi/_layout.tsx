import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { Stack } from "expo-router";

export default function NamaziLayout() {
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
        name="namazi-guide"
        options={{
          title: tr.labels.namaz,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="namazi-plus"
        options={{
          title: tr.labels.namaz,
          headerShown: true,
        }}
      />
    </Stack>
  );
}
