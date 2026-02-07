import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { Stack } from "expo-router";

export default function ExtrasLayout() {
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
                name="abdesi"
                options={{
                    title: tr.labels.abdes,
                    headerShown: true
                }}
            />
            <Stack.Screen
                name="namazi"
                options={{
                    title: tr.labels.namaz,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="tesbih"
                options={{
                    title: tr.labels.tesbih,
                    headerShown: true
                }}
            />
            <Stack.Screen
                name="ramazani"
                options={{
                    title: tr.labels.ramadan,
                    headerShown: true
                }}
            />
            <Stack.Screen
                name="about"
                options={{
                    title: tr.labels.about,
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
