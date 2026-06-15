import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLayout from "@/components/AppLayout";
import AppLoading from "@/components/AppLoading";
import HolidaysCard from "@/components/HolidaysCard";
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
import { useCallback, useEffect, useMemo, useState } from "react";
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

    // Local State
    const [refreshKey, setRefreshKey] = useState(0);

    // Prayers countdown state
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
    // Handle pull-to-refresh
    // ------------------------------------------------------------
    const handleOnRefresh = useCallback(async () => {
        // Trigger re-render for any child components using refreshKey
        setRefreshKey((prev) => prev + 1);

        // Reload prayer times
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
                onPress={handleOnRefresh}
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
                        onRefresh={handleOnRefresh}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
            >

                {/* 1. COUNTDOWN CARD */}
                <AppCard>
                    <PrayerCountdownCard
                        prevPrayer={prevPrayer}
                        nextPrayerName={nextPrayerName}
                        afterNextPrayer={afterNextPrayer}
                        prayerCountdown={prayerCountdown as PrayerCountdown}
                        remainingSeconds={remainingSeconds}
                        totalSeconds={totalSeconds}
                        size={155}
                        strokeWidth={6}
                        strokeColor={theme.border}
                        color={theme.accent}
                    />
                </AppCard>

                {/* 2. QUOTES Carousel CARD (Dynamic) */}
                <QuotesCarouselCard refreshKey={refreshKey} />
                {/* 3. Islamic HOLIDAYS Card (Dynamic) */}
                <HolidaysCard />
                {/* 4. QURAN Playing... CARD (Dynamic) */}
                <QuranPlaying />

                {/* 5. PRAYERS TIMES/LIST CARD */}
                <AppCard style={styles.prayersListContainer}>
                    {/* Prayers Date Header */}
                    <TouchableOpacity
                        style={[styles.prayersListHeader, { backgroundColor: 'rgba(0,0,0,0.02)' }]}
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
                        {/* Center: Date & Location/Timezone */}
                        <View style={styles.dateLocationRow}>
                            <Text style={[styles.dateInfoText, { color: theme.text2, opacity: 0.9 }]}>
                                {formattedDateHeader}
                            </Text>
                            <View style={styles.locationInfoRow}>
                                <MaterialIcons name="my-location" size={14} color={theme.accent} style={{ marginTop: 0.8 }} />
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

                {/* 6. PRAYER PROGRESS CARD */}
                <AppCard>
                    <PrayerProgressCard />
                </AppCard>

            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Quotes Card
    quotesCard: {
        paddingTop: 6,
        paddingBottom: 9,
        paddingHorizontal: 12,
    },

    // Prayers List Card
    prayersListContainer: {
        overflow: 'hidden',
    },
    // Prayer List - Header
    prayersListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    calendarLeftIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateLocationRow: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateInfoText: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    locationInfoRow: {
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
    chevronRightIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
});