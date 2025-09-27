import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from '@/contexts/SettingsContext';
import { usePrayersContext } from '@/contexts/PrayersContext';
import useTranslation from "@/hooks/useTranslation";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import useNextPrayer from "@/hooks/useNextPrayer";
import LoadingScreen from "@/components/LoadingScreen";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { appSettings, settingsLoading, settingsError } = useSettingsContext();
    const { prayerTimes, prayersLoading, prayersError, refetchPrayerTimes, hasPrayerTimes } = usePrayersContext();
    const { nextPrayerName, prayerCountdown } = useNextPrayer(prayerTimes);
    const { scheduleTestNotification } = useNotificationsContext();

    // Show loading if either context is loading
    const isLoading = settingsLoading || prayersLoading;
    // Show error if either context has an error
    const hasError = settingsError || prayersError;

    // Handle prayer times refresh
    const handleRefresh = async () => {
        try {
            await refetchPrayerTimes();
        } catch (err) {
            console.warn("Prayer times refresh failed:", err);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <LoadingScreen
                message={settingsLoading ? tr("labels.loadingSettings") : tr("labels.loadingPrayers")}
                style={{ backgroundColor: theme.bg }}
            />
        );
    }

    // Error state
    if (hasError) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.noPrayerTimes")}</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.danger }]}
                    onPress={handleRefresh}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No location set
    if (!appSettings.locationPermission && !appSettings.location) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="location-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.locationSet")}</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={() => router.navigate("/(tabs)/settings")}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>{tr("labels.goToSettings")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No prayer times available
    if (!hasPrayerTimes) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="time-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.noPrayerTimes")}</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleRefresh}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={prayersLoading || settingsLoading}
                    onRefresh={handleRefresh}
                    tintColor={theme.accent}
                    colors={[theme.accent]}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            <SafeAreaView style={[styles.innerContainer, { backgroundColor: theme.bg }]}>
                {/* Timezone/Date */}
                <View style={styles.timeZone}>
                    <Text style={[styles.timeZoneTitle, { color: theme.text }]}>
                        {appSettings.timeZone?.title || new Date().toDateString()}
                    </Text>
                    <Text style={[styles.timeZoneSubTitle, { color: theme.placeholder }]}>
                        {appSettings.timeZone?.subTitle || ""}
                    </Text>
                    <Text style={[styles.timeZoneDate, { color: theme.placeholder }]}>
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </Text>
                </View>

                {/* Next prayer countdown */}
                {nextPrayerName && (
                    <Text style={[styles.countdown, { color: theme.placeholder }]}>
                        {prayerCountdown} » {nextPrayerName ? tr(`prayers.${nextPrayerName}`) : ""}
                    </Text>
                )}

                {/* Prayer times list - Using map instead of FlatList */}
                <View style={styles.prayersList}>
                    {Object.entries(prayerTimes || {}).map(([name, time]) => (
                        <View key={name} style={[styles.listContainer, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.prayerName, { color: theme.text2 }]}>
                                {tr(`prayers.${name}`) || name}
                            </Text>
                            <Text style={[styles.prayerTime, { color: theme.text2 }]}>
                                {time}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Just for Testing... */}
                {/* <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={scheduleTestNotification}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>Schedule Test Notification</Text>
                </TouchableOpacity> */}

            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        minHeight: '100%',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    timeZone: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 30,
    },
    timeZoneTitle: {
        fontSize: 24,
        fontWeight: "600",
    },
    timeZoneSubTitle: {
        fontSize: 16,
        fontWeight: "400",
        marginBottom: 4,
    },
    timeZoneDate: {
        fontSize: 16,
        fontWeight: "500",
    },
    countdown: {
        fontSize: 28,
        fontWeight: "600",
        marginTop: 20,
        marginBottom: 55,
    },
    prayersList: {
        width: "100%",
        marginBottom: 30,
    },
    listContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        width: "100%",
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomColor: '#ccc',
    },
    prayerName: {
        fontSize: 20,
        fontWeight: "500",
    },
    prayerTime: {
        fontSize: 19,
        fontWeight: "400",
    },
    errorBanner: {
        marginBottom: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});