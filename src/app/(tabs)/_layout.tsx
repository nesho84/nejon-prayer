import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";

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
                name="settings"
                options={{
                    title: tr.labels.settings,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialCommunityIcons name={focused ? "cog" : "cog-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
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
