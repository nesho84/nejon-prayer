import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from "@/contexts/SettingsContext";
import useTranslation from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import AppScreen from "@/components/AppScreen";
import QiblaCompass from "@/components/QiblaCompass";

export default function QiblaScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { appSettings, deviceSettings, settingsLoading } = useSettingsContext();

    return (
        <AppScreen>
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* <View style={[styles.content, { backgroundColor: theme.bg }]}>
                    <QiblaCompass
                        loading={settingsLoading}
                        locationPermission={deviceSettings.locationPermission}
                        latitude={appSettings.location?.latitude}
                        longitude={appSettings.location?.longitude}
                        timeZone={appSettings.timeZone?.location}
                        tr={tr}
                        color={theme.primary}
                        backgroundColor={theme.bg}
                        textColor={theme.text}
                    />
                </View> */}

                <Ionicons name="add-circle-outline" size={100} color={theme.placeholder} style={{ marginBottom: 24 }} />
                <Text style={[styles.desc, { color: theme.placeholder }]}>
                    Comming Soon...
                </Text>

            </ScrollView>
        </AppScreen>
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
        paddingTop: 32,
        paddingBottom: 20,
        gap: 16,
    },
});
