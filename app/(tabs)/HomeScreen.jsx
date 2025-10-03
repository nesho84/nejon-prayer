import { Button, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from '@/contexts/SettingsContext';
import { usePrayersContext } from '@/contexts/PrayersContext';
import useNextPrayer from "@/hooks/useNextPrayer";
import useTranslation from "@/hooks/useTranslation";
import { testNotification } from "@/utils/testNotification";
import AppLoading from "@/components/AppLoading";
import CountdownCircle from "@/components/CountdownCircle";
import { getDailyQuote } from "@/utils/dailyQuote";
import { useMemo } from "react";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr, language } = useTranslation();
    const { appSettings, settingsLoading, settingsError } = useSettingsContext();
    const { prayerTimes, prayersLoading, prayersError, reloadPrayerTimes, hasPrayerTimes } = usePrayersContext();
    const { nextPrayerName, nextPrayerTime, prayerCountdown, remainingSeconds, totalSeconds } = useNextPrayer(prayerTimes);

    // Local state
    const isLoading = settingsLoading || prayersLoading;
    const hasError = settingsError || prayersError;

    // Dynamic daily quote for the middle section
    const dailyMessage = useMemo(() => {
        return getDailyQuote(language, { random: true });
    }, [language]);

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
            style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
            contentContainerStyle={styles.scrollContent}
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

            {/* Hero Header */}
            <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
                {/* Date + Timezone */}
                <View style={styles.headerLocale}>
                    <Text style={[styles.headerLocaleLabel, { color: theme.text2 }]}>
                        {new Date().toLocaleDateString(tr("labels.localeDate"), {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase())}
                    </Text>
                    <Text style={[styles.headerTimezone, { color: theme.placeholder }]}>
                        {appSettings.timeZone?.subTitle || ""}
                    </Text>
                </View>

                {/* Divider */}
                <View style={[styles.headerDivider, { backgroundColor: theme.divider2 }]} />

                {/* Countdown Circle */}
                {nextPrayerName && (
                    <CountdownCircle
                        nextPrayerName={nextPrayerName}
                        prayerCountdown={prayerCountdown}
                        remainingSeconds={remainingSeconds}
                        totalSeconds={totalSeconds}
                        theme={theme}
                        tr={tr}
                        size={160}
                        strokeWidth={8}
                        backgroundColor={theme.border}
                        color={theme.accent}
                    />
                )}
            </View>

            {/* Dynamic middle section */}
            <View style={[styles.dynamicCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.dynamicCardText, { color: theme.text2 }]}>
                    {dailyMessage}
                </Text>
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
                                styles.prayerItem,
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

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingHorizontal: 12,
        paddingBottom: 14,
        gap: 8,
    },

    // Header Card
    headerCard: {
        alignItems: "center",
        padding: 16,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerLocale: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    headerLocaleLabel: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 3,
    },
    headerTimezone: {
        fontSize: 13,
        fontWeight: "400",
    },
    headerDivider: {
        width: "85%",
        height: 1,
        marginVertical: 18,
    },

    // Dynamic middle Card
    dynamicCard: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    dynamicCardText: {
        textAlign: "center",
        opacity: 0.6,
    },

    // Prayer List with card items
    prayersList: {
        width: "100%",
        gap: 8,
    },
    prayerItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
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

    // Error / Empty States
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