import { Button, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from '@/contexts/SettingsContext';
import { usePrayersContext } from '@/contexts/PrayersContext';
import useTranslation from "@/hooks/useTranslation";
import { testNotification } from "@/utils/testNotification";
import useNextPrayer from "@/hooks/useNextPrayer";
import AppLoading from "@/components/AppLoading";
import AppScreen from "@/components/AppScreen";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr, language } = useTranslation();
    const { appSettings, settingsLoading, settingsError } = useSettingsContext();
    const { prayerTimes, prayersLoading, prayersError, reloadPrayerTimes, hasPrayerTimes } = usePrayersContext();
    const { nextPrayerName, prayerCountdown } = useNextPrayer(prayerTimes);

    // Show loading if either context is loading
    const isLoading = settingsLoading || prayersLoading;
    // Show error if either context has an error
    const hasError = settingsError || prayersError;

    // ------------------------------------------------------------
    // Handle prayer times refresh
    // ------------------------------------------------------------
    const handleRefresh = async () => {
        try {
            await reloadPrayerTimes();
        } catch (err) {
            console.warn("Prayer times refresh failed:", err);
        }
    };

    // ------------------------------------------------------------
    // Prayer icon resolver
    // ------------------------------------------------------------
    const resolvePrayerIcon = (name) => {
        const p = String(name || "").toLowerCase();
        if (p.includes("imsak")) return { lib: 'Ionicons', name: 'time-outline' };
        if (p.includes("fajr")) return { lib: 'Ionicons', name: 'moon-outline' };
        if (p.includes("sunrise")) return { lib: 'MaterialCommunityIcons', name: 'weather-sunset-up' };
        if (p.includes("dhuhr")) return { lib: 'Ionicons', name: 'sunny' };
        if (p.includes("asr")) return { lib: 'Ionicons', name: 'partly-sunny-outline' };
        if (p.includes("maghrib")) return { lib: 'MaterialCommunityIcons', name: 'weather-sunset-down' };
        if (p.includes("isha")) return { lib: 'Ionicons', name: 'moon-sharp' };
        return "time-outline";
    };

    // Loading state
    if (isLoading) {
        return <AppLoading text={tr("labels.loading")} />
    }

    // Error state
    if (hasError) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.noPrayerTimes")}</Text>
                <TouchableOpacity
                    style={[styles.errorButton, { backgroundColor: theme.danger }]}
                    onPress={handleRefresh}>
                    <Text style={[styles.errorButtonText, { color: theme.white }]}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No location set
    if (!appSettings.locationPermission && !appSettings.location) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="location-outline" size={80} color={theme.danger} />
                </View>
                <Text style={[styles.errorText, { color: theme.warning }]}>{tr("labels.locationSet")}</Text>
                <TouchableOpacity
                    style={[styles.errorButton, { backgroundColor: theme.danger }]}
                    onPress={() => router.navigate("/(tabs)/SettingsScreen")}>
                    <Text style={[styles.errorButtonText, { color: theme.white }]}>{tr("labels.goToSettings")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No prayer times available
    if (!prayerTimes || !hasPrayerTimes) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="time-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.noPrayerTimes")}</Text>
                <TouchableOpacity
                    style={[styles.errorButton, { backgroundColor: theme.primary }]}
                    onPress={handleRefresh}>
                    <Text style={[styles.errorButtonText, { color: theme.white }]}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main Content
    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.bg }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={prayersLoading || settingsLoading}
                    onRefresh={handleRefresh}
                    tintColor={theme.accent}
                    colors={[theme.accent]}
                />
            }
        >
            <AppScreen>

                {/* Hero Header */}
                <View style={[styles.heroHeader, { backgroundColor: theme.card }]}>
                    {/* Date + Timezone */}
                    <View style={styles.heroLocale}>
                        <Text style={[styles.heroLocaleLabel, { color: theme.text2 }]}>
                            {new Date().toLocaleDateString(tr("labels.localeDate"), {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase())}
                        </Text>
                        <Text style={[styles.heroTimezone, { color: theme.placeholder }]}>
                            {appSettings.timeZone?.subTitle || ""}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: theme.divider2 }]} />

                    {/* Countdown Circle */}
                    {nextPrayerName && (
                        <View style={[styles.countdownCircle, { borderColor: theme.text2 }]}>
                            <Text style={[styles.countdownLabel, { color: theme.text2 }]}>
                                » {tr(`prayers.${nextPrayerName}`)} «
                            </Text>
                            <Text style={[styles.countdownTime, { color: theme.accent }]}>
                                {prayerCountdown.hours}<Text style={styles.countdownHms}>h </Text>
                                {prayerCountdown.minutes}<Text style={styles.countdownHms}>m </Text>
                                {prayerCountdown.seconds}<Text style={styles.countdownHms}>s</Text>
                            </Text>
                        </View>
                    )}
                </View>

                {/* Prayer Times */}
                <View style={styles.prayersList}>
                    {Object.entries(prayerTimes || {}).map(([name, time]) => {
                        const isNext = nextPrayerName === name;
                        const iconData = resolvePrayerIcon(name);
                        const IconComponent = iconData.lib === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
                        return (
                            <View
                                key={name}
                                style={[
                                    styles.prayerRow,
                                    { backgroundColor: theme.card },
                                    isNext && { borderWidth: 2, borderColor: theme.accent },
                                ]}
                            >
                                <View style={styles.prayerLeft}>
                                    <IconComponent
                                        name={iconData.name}
                                        size={24}
                                        color={isNext ? theme.accent : theme.text2}
                                    />
                                    <Text style={[styles.prayerName, { color: isNext ? theme.accent : theme.text }]}>
                                        {tr(`prayers.${name}`) || name}
                                    </Text>
                                </View>
                                <Text style={[styles.prayerTime, { color: isNext ? theme.accent : theme.text2 }]}>
                                    {time}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Debug utility */}
                {/* <View style={{ marginTop: 20 }}>
                    <Button title="Test Notifications" onPress={() => testNotification({ language, seconds: 5 })} />
                </View> */}

            </AppScreen>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 12,
    },
    heroHeader: {
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
        paddingVertical: 18,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    heroLocale: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 0,
    },
    heroLocaleLabel: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 3,
    },
    heroTimezone: {
        fontSize: 13,
        fontWeight: "400",
    },
    divider: {
        width: "85%",
        height: 1,
        marginVertical: 18,
    },
    countdownCircle: {
        width: 150,
        height: 150,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderRadius: 100,
    },
    countdownLabel: {
        fontSize: 18,
        fontWeight: "400",
        marginBottom: 3,
    },
    countdownTime: {
        fontSize: 24,
        fontWeight: "500",
    },
    countdownHms: {
        fontSize: 14,
        fontWeight: "400",
    },
    prayersList: {
        width: "100%",
        gap: 12,
    },
    prayerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    prayerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    prayerName: {
        fontSize: 18,
        fontWeight: "600",
        paddingLeft: 8,
    },
    prayerTime: {
        fontSize: 17,
        fontWeight: "500",
    },
    errorContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
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
    errorButton: {
        paddingVertical: 14,
        borderRadius: 12,
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
    },
    errorButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});