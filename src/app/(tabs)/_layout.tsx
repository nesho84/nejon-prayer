import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: theme.bg },
                tabBarActiveTintColor: theme.tabActive,
                tabBarLabelStyle: { fontSize: 11 },
                tabBarInactiveTintColor: theme.tabInactive,
                tabBarStyle: {
                    backgroundColor: theme.bg,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                    height: insets.bottom + 55,
                    elevation: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: tr.labels.home,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="qibla"
                options={{
                    title: tr.labels.qibla,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "compass" : "compass-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="quran-tab"
                options={{
                    title: tr.labels.read ?? "Read",
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "book-open-variant" : "book-open-variant-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: tr.labels.settings,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "cog" : "cog-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="extras-tab"
                options={{
                    title: "More",
                    tabBarLabel: tr.labels.more,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "apps" : "apps"} size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
