import { useMemo } from "react";
import { Button, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import { useSettingsContext } from '@/context/SettingsContext';
import { usePrayersContext } from '@/context/PrayersContext';
import useNextPrayer from "@/hooks/useNextPrayer";
import useTranslation from "@/hooks/useTranslation";
import { getDailyQuote } from "@/utils/dailyQuote";
import AppScreen from "@/components/AppScreen";
import AppLoading from "@/components/AppLoading";
import AppCard from "@/components/AppCard";
import CountdownCircle from "@/components/CountdownCircle";
import { testNotification } from "@/utils/testNotification";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr, language } = useTranslation();
    const { appSettings, deviceSettings, settingsLoading, settingsError } = useSettingsContext();
    const { prayerTimes, prayersLoading, prayersError, reloadPrayerTimes, hasPrayerTimes } = usePrayersContext();
    const { nextPrayerName, nextPrayerTime, prayerCountdown, remainingSeconds, totalSeconds } = useNextPrayer(prayerTimes);

    // Local state
    const isLoading = settingsLoading || prayersLoading;
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
    // Dynamic daily quote for the middle section
    // ------------------------------------------------------------
    const dailyMessage = useMemo(() => {
        return getDailyQuote(language, { random: true });
    }, [language]);

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
                    onPress={() => router.navigate("/(tabs)/settings")}>
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
        <AppScreen>
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

                {/* 1. LOCATION HEADER */}
                <View style={styles.locationRow}>
                    <View style={styles.locationLeft}>
                        <Ionicons name="location-outline" size={18} color={theme.accent} />
                        <Text style={[styles.locationText, { color: theme.text2 }]}>
                            {appSettings.timeZone?.location || "Location"}
                        </Text>
                    </View>
                </View>

                {/* 2. COUNTDOWN CIRCLE CARD */}
                <AppCard style={styles.countdownCard}>
                    {nextPrayerName && (
                        <CountdownCircle
                            nextPrayerName={nextPrayerName}
                            prayerCountdown={prayerCountdown}
                            remainingSeconds={remainingSeconds}
                            totalSeconds={totalSeconds}
                            theme={theme}
                            tr={tr}
                            size={160}
                            strokeWidth={6}
                            strokeColor={theme.border}
                            color={theme.accent}
                        />
                    )}
                </AppCard>

                {/* 3. QUOTES/MESSAGE CARD */}
                <AppCard style={styles.quotesCard}>
                    <View style={styles.quotesHeader}>
                        <View style={[styles.decorativeLine, { backgroundColor: theme.accent }]} />
                        <Ionicons name="book-outline" size={18} color={theme.accent} />
                        <View style={[styles.decorativeLine, { backgroundColor: theme.accent }]} />
                    </View>
                    <Text style={[styles.quotesText, { color: theme.text2 }]}>
                        {dailyMessage}
                    </Text>
                </AppCard>

                {/* 4. PRAYER TIMES CARD */}
                <AppCard style={styles.prayerCard}>
                    {/* Date Header */}
                    <View style={styles.dateHeader}>
                        <Text style={[styles.dateText, { color: theme.text }]}>
                            {new Date().toLocaleDateString(tr("labels.localeDate"), {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase())}
                        </Text>
                        <Text style={[styles.timezoneInfo, { color: theme.text2 }]}>
                            {appSettings.timeZone?.zoneName || ""} • {appSettings.timeZone?.offset || ""}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={[styles.fullDivider, { backgroundColor: theme.divider }]} />

                    {/* Prayer Times */}
                    <View style={styles.prayerTable}>
                        {Object.entries(prayerTimes || {}).map(([name, time], index) => {
                            const isNext = nextPrayerName === name;
                            const iconData = resolvePrayerIcon(name);
                            const IconComponent = iconData.lib === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
                            const isLast = index === Object.entries(prayerTimes || {}).length - 1;

                            return (
                                <View key={name}>
                                    <View
                                        style={[
                                            styles.prayerRow,
                                            isNext && [
                                                styles.prayerRowActive,
                                                { backgroundColor: theme.accentLight, borderColor: theme.accentLight }
                                            ]
                                        ]}
                                    >
                                        {/* Prayer Name */}
                                        <View style={styles.prayerNameSection}>
                                            <IconComponent name={iconData.name} size={20} color={isNext ? theme.accent : theme.text2} />
                                            <Text style={[styles.prayerNameText, { color: isNext ? theme.accent : theme.text }]}>
                                                {tr(`prayers.${name}`) || name}
                                            </Text>
                                        </View>

                                        {/* Prayer Time */}
                                        <View style={styles.prayerTimeSection}>
                                            <Text style={[styles.prayerTimeText, { color: isNext ? theme.accent : theme.text }]}>
                                                {time}
                                            </Text>
                                            <Ionicons
                                                name={deviceSettings.notificationPermission ? "notifications-outline" : "notifications-off-outline"}
                                                size={20}
                                                color={theme.text2}
                                                style={{ opacity: 0.5 }}
                                            />
                                        </View>
                                    </View>

                                    {/* Prayer Divider */}
                                    {!isLast && (
                                        <View style={[styles.prayerDivider, { backgroundColor: theme.divider2 }]} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </AppCard>

                {/* Debug utility */}
                {/* <View style={{ marginTop: 20 }}>
                    <Button title="Test Notifications" onPress={() => testNotification({ language, seconds: 5 })} />
                </View> */}

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
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },

    // Location Row
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 15,
        fontWeight: '500',
    },
    refreshButton: {
        padding: 4,
    },

    // Countdown Card
    countdownCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },

    // Quotes Card
    quotesCard: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    quotesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    decorativeLine: {
        height: 1,
        flex: 1,
        opacity: 0.3,
    },
    quotesText: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.75,
    },

    // Prayer Card
    prayerCard: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    // Prayer Card - Date Header
    dateHeader: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    timezoneInfo: {
        fontSize: 12,
        opacity: 0.7,
    },
    fullDivider: {
        height: 1,
        width: '100%',
    },
    // Prayer Table
    prayerTable: {
        paddingVertical: 8,
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    prayerRowActive: {
        borderLeftWidth: 3,
        borderRightWidth: 3,
        marginVertical: 3,
        paddingHorizontal: 15,
    },
    prayerNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    prayerNameText: {
        fontSize: 16,
        fontWeight: '500',
    },
    prayerTimeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    prayerTimeText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    prayerDivider: {
        height: 1,
        marginHorizontal: 18,
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