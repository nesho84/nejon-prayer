import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import { MaterialCommunityIcons as McIcons } from "@expo/vector-icons";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useThemeContext();
    const { tr } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.tabActive,
                tabBarLabelStyle: { fontSize: 11 },
                tabBarInactiveTintColor: theme.tabInactive,
                tabBarStyle: {
                    backgroundColor: theme.bg,
                    height: insets.bottom + 54,
                    elevation: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: tr("labels.home"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <McIcons name={focused ? "home" : "home-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="qibla"
                options={{
                    title: tr("labels.qibla"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <McIcons name={focused ? "compass" : "compass-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: tr("labels.settings"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <McIcons name={focused ? "cog" : "cog-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More",
                    tabBarLabel: tr("labels.more"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <McIcons name={focused ? "apps" : "apps"} size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
