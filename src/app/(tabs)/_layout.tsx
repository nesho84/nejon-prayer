import AdBanner from "@/components/AdBanner";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/js-tabs";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);

    // Safe area insets
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            tabBar={(props) => (
                <>
                    <AdBanner />
                    <BottomTabBar {...props} />
                </>
            )}
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
                        <MaterialDesignIcons name={focused ? "home" : "home-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="qibla"
                options={{
                    title: tr.labels.qibla,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialDesignIcons name={focused ? "compass" : "compass-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="quran-tab"
                options={{
                    title: tr.labels.read,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialDesignIcons name={focused ? "book-open-variant" : "book-open-variant-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: tr.labels.settings,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialDesignIcons name={focused ? "cog" : "cog-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="extras-tab"
                options={{
                    title: "More",
                    tabBarLabel: tr.labels.more,
                    tabBarIcon: ({ focused, color, size }) =>
                        <MaterialDesignIcons name={focused ? "apps" : "apps"} size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
