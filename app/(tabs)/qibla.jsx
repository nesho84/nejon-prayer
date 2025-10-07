import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import AppScreen from "@/components/AppScreen";
import QiblaCompass from "@/components/QiblaCompass";

export default function QiblaScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const {
        appSettings,
        deviceSettings,
        settingsLoading,
        settingsError,
        saveAppSettings,
        reloadAppSettings
    } = useSettingsContext();

    // Local state
    const [refreshKey, setRefreshKey] = useState(0);

    // Reset component every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setRefreshKey(prev => prev + 1);
        }, [])
    );

    return (
        <AppScreen>
            <View style={[styles.content, { backgroundColor: theme.bg }]}>
                <QiblaCompass
                    key={refreshKey} // Force remount on focus
                    color={theme.primary}
                    backgroundColor={theme.bg}
                    textColor={theme.text}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
});
