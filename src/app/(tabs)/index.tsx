import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLayout from "@/components/AppLayout";
import AppLoading from "@/components/AppLoading";
import PrayerCountdownCard from "@/components/PrayerCountdownCard";
import PrayerProgressCard from "@/components/PrayerProgressCard";
import PrayersList from "@/components/PrayersList";
import QuotesCarouselCard from "@/components/QuotesCarouselCard";
import QuranPlaying from "@/components/QuranPlaying";
import { globalStyles } from "@/constants/styles";
import useNextPrayer from "@/hooks/useNextPrayer";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { usePrayersStore } from "@/store/prayersStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerCountdown } from "@/types/prayer.types";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const locationPermission = useDeviceSettingsStore((state) => state.locationPermission);
    const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);
    const locationReady = useLocationStore((state) => state.isReady);
    const prayerTimes = usePrayersStore((state) => state.prayerTimes);
    const prayerTimesDate = usePrayersStore((state) => state.prayerTimesDate);
    const prayersError = usePrayersStore((state) => state.prayersError);
    const prayersLoading = usePrayersStore((state) => state.isLoading);
    const notifReady = useNotificationsStore((state) => state.isReady);

    // Next prayer countdown state
    const {
        prevPrayer,
        currentPrayerName,
        nextPrayerName,
        afterNextPrayer,
        prayerCountdown,
        remainingSeconds,
        totalSeconds
    } = useNextPrayer(prayerTimes);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 4;
    const bottomInset = insets.bottom + 12;

    // ------------------------------------------------------------
    // Load prayer times on mount
    // ------------------------------------------------------------
    useEffect(() => {
        if (!deviceSettingsReady || !locationReady) return;

        usePrayersStore.getState().loadPrayerTimes();

    }, [deviceSettingsReady, locationReady]);

    // ------------------------------------------------------------
    // Check for expo OTA updates on mount
    // ------------------------------------------------------------
    useEffect(() => {
        if (__DEV__) return; // Skip in dev mode
        const checkForUpdates = async () => {
            try {
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    Updates.reloadAsync();
                }
            } catch {
                // Network unavailable or EAS unreachable — silently ignore
            }
        };
        checkForUpdates();
    }, []);

    // ------------------------------------------------------------
    // Handle prayer times refresh
    // ------------------------------------------------------------
    const handlePrayersRefresh = useCallback(async () => {
        try {
            await usePrayersStore.getState().loadPrayerTimes();
        } catch (err) {
            console.warn("Prayer times refresh failed:", err);
        }
    }, []);

    // ------------------------------------------------------------
    // Formatted date string for the prayers date header
    // ------------------------------------------------------------
    const formattedDateHeader = useMemo(() => {
        return new Date(prayerTimesDate + 'T00:00:00').toLocaleDateString(tr.labels.localeDate, {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase());
    }, [tr, prayerTimesDate]);

    // Loading state
    if (!deviceSettingsReady || !locationReady || (prayersLoading && !prayerTimes) || !notifReady) {
        return <AppLoading text={tr.labels.loading} />;
    }

    // No location set
    if (!locationPermission && !location) {
        return (
            <AppError
                icon="location-outline"
                iconColor={theme.danger}
                message={tr.labels.locationSet}
                buttonText={tr.labels.goToSettings}
                buttonColor={theme.danger}
                onPress={() => router.navigate("/(tabs)/settings")}
            />
        );
    }

    // Prayer times error
    if (!prayerTimes || prayersError) {
        return (
            <AppError
                icon="time-outline"
                iconColor={theme.danger}
                message={prayersError || tr.labels.prayersError}
                buttonText={tr.buttons.retry}
                buttonColor={theme.danger}
                onPress={handlePrayersRefresh}
            />
        );
    }

    // Main Content
    return (
        <AppLayout>

            {/* Notifications Test */}
            {/* {__DEV__ && <NotificationTester seconds={10} />} */}

            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[
                    globalStyles.scrollContent,
                    { paddingTop: topInset, paddingBottom: bottomInset }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={prayersLoading}
                        onRefresh={handlePrayersRefresh}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
            >

                {/* 1. COUNTDOWN CARD */}
                <AppCard style={styles.countdownCard}>
                    <PrayerCountdownCard
                        prevPrayer={prevPrayer}
                        nextPrayerName={nextPrayerName}
                        afterNextPrayer={afterNextPrayer}
                        prayerCountdown={prayerCountdown as PrayerCountdown}
                        remainingSeconds={remainingSeconds}
                        totalSeconds={totalSeconds}
                        size={158}
                        strokeWidth={6}
                        strokeColor={theme.border}
                        color={theme.accent}
                    />
                </AppCard>

                {/* 3. QUOTES Carousel CARD */}
                <AppCard style={styles.quotesCard}>
                    <QuotesCarouselCard />
                </AppCard>

                {/* 3.1 QURAN Playing... CARD */}
                <QuranPlaying />

                {/* 4. PRAYERS LIST CARD */}
                <AppCard style={styles.prayersListCard}>

                    {/* Prayers Date Header */}
                    <TouchableOpacity
                        style={[styles.prayersDateHeader, { backgroundColor: 'rgba(0,0,0,0.02)' }]}
                        delayPressIn={0}
                        delayPressOut={0}
                        activeOpacity={0.3}
                        disabled={!prayerTimes}
                        onPress={() => router.navigate('/(modals)/prayerTimings')}
                    >
                        {/* Left: Calendar icon */}
                        <View style={styles.calendarLeftIcon}>
                            <Ionicons name="calendar-outline" size={22} color={theme.text} style={{ opacity: 0.6 }} />
                        </View>

                        {/* Center: Date & Timezone Container */}
                        <View style={styles.dateContainer}>
                            <Text style={[styles.dateHeaderText, { color: theme.text2 }]}>
                                {formattedDateHeader}
                            </Text>
                            <View style={styles.locationInfo}>
                                <MaterialIcons name="my-location" size={14} color={theme.accent} style={{ marginTop: 0.7 }} />
                                <Text style={[styles.locationInfoText, { color: theme.text2 }]} numberOfLines={1} ellipsizeMode="tail">
                                    {timeZone?.location || "Location"}
                                </Text>
                            </View>
                        </View>

                        {/* Right: Chevron icon */}
                        <View style={styles.chevronRightIcon}>
                            <Ionicons name="chevron-forward" size={22} color={theme.text} style={{ opacity: 0.5 }} />
                        </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[globalStyles.fullDivider, { backgroundColor: theme.divider2 }]} />

                    {/* Prayers List */}
                    <PrayersList
                        prayerTimes={prayerTimes}
                        prayerTimesDate={prayerTimesDate}
                        currentPrayerName={currentPrayerName}
                    />

                </AppCard>

                {/* 5. PRAYER PROGRESS CARD */}
                <AppCard style={styles.progressCard}>
                    <PrayerProgressCard />
                </AppCard>

            </ScrollView>
        </AppLayout >
    );
}

const styles = StyleSheet.create({
    // Countdown Card
    countdownCard: {
        paddingVertical: 10,
        paddingHorizontal: 8,
    },

    // Quotes Card
    quotesCard: {
        paddingTop: 6,
        paddingBottom: 9,
        paddingHorizontal: 12,
    },

    // Prayers List Card
    prayersListCard: {
        overflow: 'hidden',
    },

    // Prayer Card - Date Header
    prayersDateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateHeaderText: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 4,
    },
    prayersTimezoneInfo: {
        fontSize: 12,
        opacity: 0.7,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '100%',
        opacity: 0.7,
        gap: 5,
    },
    locationInfoText: {
        fontSize: 13,
        letterSpacing: 0.3,
    },
    calendarLeftIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronRightIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Prayers Progress Card
    progressCard: {
        paddingVertical: 12,
        paddingHorizontal: 12,
    }
});