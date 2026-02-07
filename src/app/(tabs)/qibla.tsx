import { ScrollView, StyleSheet } from "react-native";
import { useAppContext } from "@/context/AppContext";
import AppTabScreen from "@/components/AppTabScreen";
import QiblaCompass from "@/components/QiblaCompass";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";

export default function QiblaScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);

    // Contexts
    const { appSettings, settingsLoading } = useAppContext();

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
