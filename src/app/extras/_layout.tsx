import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
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
                animation: "ios_from_right",
            }}
        >
            <Stack.Screen
                name="abdesi"
                options={{
                    title: tr.labels.abdes,
                    headerShown: true,
                }}
            />
            {/* Namazi Screen ('/namazi' folder) */}
            <Stack.Screen
                name="namazi/namazi-guide"
                options={{
                    title: tr.labels.namazGuideItem,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="namazi/namazi-table"
                options={{
                    title: tr.labels.namazTableItem,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="namazi/namazi-plus"
                options={{
                    title: tr.labels.namazPlusItem,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="tesbih"
                options={{
                    title: tr.labels.tesbih,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="ramazani"
                options={{
                    title: tr.labels.ramadan,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="holidays"
                options={{
                    title: tr.labels.holidays,
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="quotes"
                options={{
                    title: tr.labels.quotes,
                    headerShown: true,
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
