import { StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import AppScreen from "@/components/AppScreen";
import QiblaCompass from "@/components/QiblaCompass";

export default function QiblaScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { appSettings, deviceSettings, settingsLoading } = useSettingsContext();

    return (
        <AppScreen>
            <View style={[styles.content, { backgroundColor: theme.bg }]}>
                <QiblaCompass
                    loading={settingsLoading}
                    locationPermission={deviceSettings.locationPermission}
                    latitude={appSettings.location?.latitude}
                    longitude={appSettings.location?.longitude}
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
