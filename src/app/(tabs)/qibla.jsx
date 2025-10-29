import { ScrollView, StyleSheet } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";
import { useSettingsContext } from "@/context/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import AppTabScreen from "@root/src/components/AppTabScreen";
import QiblaCompass from "@/components/QiblaCompass";

export default function QiblaScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { appSettings, settingsLoading } = useSettingsContext();

    return (
        <AppTabScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                <QiblaCompass
                    loading={settingsLoading}
                    latitude={appSettings.location?.latitude}
                    longitude={appSettings.location?.longitude}
                    timeZone={appSettings.timeZone?.location}
                    tr={tr}
                    bgColor={theme.bg}
                    color={theme.primary}
                    textColor={theme.text}
                />

            </ScrollView>
        </AppTabScreen>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },
});
