import { ScrollView, StyleSheet } from "react-native";
import AppTabScreen from "@/components/AppTabScreen";
import QiblaCompass from "@/components/QiblaCompass";
import { useThemeStore } from "@/store/themeStore";
import { useLocationStore } from "@/store/locationStore";

export default function QiblaScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const isReady = useLocationStore((state) => state.isReady);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);

    return (
        <AppTabScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                <QiblaCompass
                    loading={!isReady}
                    latitude={location?.latitude}
                    longitude={location?.longitude}
                    timeZone={timeZone?.location}
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
