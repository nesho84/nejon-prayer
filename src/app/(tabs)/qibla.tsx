import AppLayout from "@/components/AppLayout";
import QiblaCompass from "@/components/QiblaCompass";
import { globalStyles } from "@/constants/styles";
import { useLocationStore } from "@/store/locationStore";
import { useThemeStore } from "@/store/themeStore";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QiblaScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const isReady = useLocationStore((state) => state.isReady);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 4;
    const bottomInset = insets.bottom + 12;

    return (
        <AppLayout>
            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { paddingTop: topInset, paddingBottom: bottomInset }
                ]}
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
        </AppLayout>
    );
}

// Placeholder for future styles — kept intentionally
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const styles = StyleSheet.create({});
