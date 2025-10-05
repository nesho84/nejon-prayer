import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs, useSegments } from "expo-router";
import { useThemeContext } from "@/contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import { MaterialCommunityIcons as McIcons } from "@expo/vector-icons";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const segments = useSegments();

    // Hide tab bar if we're deeper than 2 levels in "more"
    const hideTabBar = segments[0] === "(tabs)" && segments[1] === "more" && segments[2];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.tabActive,
                tabBarStyle: {
                    backgroundColor: theme.bg,
                    height: insets.bottom + 53,
                    elevation: 0,
                    display: hideTabBar ? 'none' : 'flex',
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
                    title: "Qibla",
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
                name="about"
                options={{
                    // href: null,
                    title: tr("labels.about"),
                    tabBarIcon: ({ focused, color, size }) =>
                        <McIcons name={focused ? "information" : "information-outline"} size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More",
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) =>
                        <McIcons name={focused ? "apps" : "apps"} size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
