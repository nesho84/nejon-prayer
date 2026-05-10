import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppTabScreen from "@/components/AppTabScreen";
import PrayerCountdownCard from "@/components/PrayerCountdownCard";
import PrayerIcon from "@/components/PrayerIcon";
import PrayerNotifIcon from "@/components/PrayerNotifIcon";
import QuotesCarousel from "@/components/QuotesCarousel";
import QuranPlaying from "@/components/QuranPlaying";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { usePrayersStore } from "@/store/prayersStore";
import { usePrayersTrackingStore } from "@/store/prayersTrackingStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerName, PrayerTimeEntry, TRACKABLE_PRAYERS } from "@/types/prayer.types";
import { formatDateKey, isPrayerPast } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const language = useLanguageStore((state) => state.language);
    const tr = useLanguageStore((state) => state.tr);
    const locationPermission = useDeviceSettingsStore((state) => state.locationPermission);
    const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);
    const locationReady = useLocationStore.getState().isReady;
    const prayerTimes = usePrayersStore((state) => state.prayerTimes);
    const prayersError = usePrayersStore((state) => state.prayersError);
    const prayersLoading = usePrayersStore((state) => state.isLoading);
    const notifReady = useNotificationsStore((state) => state.isReady);
    const tracking = usePrayersTrackingStore((state) => state.tracking);
    const markPrayed = usePrayersTrackingStore((state) => state.markPrayed);
    const unmarkPrayed = usePrayersTrackingStore((state) => state.unmarkPrayed);

    // Local state
    const [currentPrayerName, setCurrentPrayerName] = useState<PrayerName | null>(null);

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
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                await Updates.fetchUpdateAsync();
                Updates.reloadAsync();
            }
        };
        checkForUpdates();
    }, []);

    // ------------------------------------------------------------
    // Handle prayer times refresh
    // ------------------------------------------------------------
    const handlePrayersRefresh = async () => {
        try {
            await usePrayersStore.getState().loadPrayerTimes();
        } catch (err) {
            console.warn("Prayer times refresh failed:", err);
        }
    };

    // Loading state
    if (!deviceSettingsReady || !locationReady || prayersLoading || !notifReady) {
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
        <AppTabScreen>

            {/* Notifications Test */}
            {/* {__DEV__ && <NotificationTester seconds={10} />} */}

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
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

                {/* 1. LOCATION HEADER */}
                <View style={styles.locationRow}>
                    <View style={styles.locationLeft}>
                        <Ionicons name="location-outline" size={18} color={theme.accent} />
                        <Text style={[styles.locationText, { color: theme.text2 }]}>
                            {timeZone?.location || "Location"}
                        </Text>
                    </View>
                </View>

                {/* 2. COUNTDOWN CARD */}
                <AppCard style={styles.countdownCard}>
                    <PrayerCountdownCard
                        prayerTimes={prayerTimes}
                        onCurrentPrayerChange={setCurrentPrayerName}
                        size={160}
                        strokeWidth={6}
                        strokeColor={theme.border}
                        color={theme.accent}
                    />
                </AppCard>

                {/* 3. QUOTES Carousel CARD */}
                <AppCard style={styles.quotesCard}>
                    <QuotesCarousel language={language} />
                </AppCard>

                {/* 3.1 QURAN Playing... CARD */}
                <QuranPlaying />

                {/* 4. PRAYERS CARD */}
                <AppCard style={styles.prayersCard}>

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
                            <Text style={[styles.dateHeaderText, { color: theme.text }]}>
                                {new Date().toLocaleDateString(tr.labels.localeDate, {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase())}
                            </Text>
                            <Text style={[styles.prayersTimezoneInfo, { color: theme.text2 }]}>
                                {timeZone?.zoneName || ""} • {timeZone?.offset || ""}
                            </Text>
                        </View>
                        {/* Right: Chevron icon */}
                        <View style={styles.chevronRightIcon}>
                            <Ionicons name="chevron-forward" size={22} color={theme.text} style={{ opacity: 0.5 }} />
                        </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[styles.fullDivider, { backgroundColor: theme.divider2 }]} />

                    {/* Prayers List */}
                    <View style={styles.prayersRowContainer}>
                        {(Object.entries(prayerTimes) as PrayerTimeEntry[]).map(([prayerName, prayerTime], index, arr) => {
                            const isTrackable = TRACKABLE_PRAYERS.includes(prayerName as PrayerName);
                            const isPast = isTrackable && isPrayerPast(prayerTime);
                            const isCurrent = currentPrayerName === prayerName;
                            const isLast = index === arr.length - 1;
                            const isPrayed = isTrackable && tracking[`${formatDateKey()}:${prayerName}`] === 'prayed';

                            return (
                                <View key={prayerName} style={!isLast && { marginBottom: 0 }}>
                                    {/* Prayer row card */}
                                    <View
                                        style={[
                                            styles.prayerRow,
                                            {
                                                backgroundColor: isCurrent ? theme.accentLight : theme.card,
                                                borderColor: isCurrent ? theme.accentLight : theme.borderCard
                                            }
                                        ]}
                                    >
                                        {/* Left: mark/unmark area (trackable) or plain view (non-trackable) */}
                                        {isTrackable ? (
                                            <TouchableOpacity
                                                style={styles.prayerRowLeft}
                                                delayPressIn={0}
                                                delayPressOut={0}
                                                activeOpacity={0.3}
                                                hitSlop={8}
                                                onPress={() => {
                                                    if (!isPast && !isCurrent) return;
                                                    isPrayed ? unmarkPrayed(prayerName as PrayerName) : markPrayed(prayerName as PrayerName)
                                                }}
                                            >
                                                {/* Left: Tracking circle */}
                                                <Ionicons
                                                    name={isPrayed ? 'checkmark-circle' : 'ellipse-outline'}
                                                    size={22}
                                                    color={isPrayed ? theme.accent2 : theme.text2}
                                                    style={{ opacity: isPrayed ? 1 : 0.45 }}
                                                />
                                                {/* Prayer Name Text */}
                                                <Text style={[styles.prayerNameText, { color: isCurrent ? theme.accent : theme.text2 }]}>
                                                    {tr.prayers[prayerName] || prayerName}
                                                </Text>
                                                {/* Prayer Name Icon */}
                                                <PrayerIcon name={prayerName} size={18} color={isCurrent ? theme.accent : theme.text2} opacity={0.7} />
                                                {/* Horizontal Spacer */}
                                                <View style={{ flex: 1 }} />
                                                {/* Prayer Time */}
                                                <Text style={[styles.prayerTimeText, { color: isCurrent ? theme.accent : theme.text2 }]}>
                                                    {prayerTime}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.prayerRowLeft}>
                                                {/* Left: Dash placeholder */}
                                                <Ionicons
                                                    name="remove"
                                                    size={22}
                                                    color={theme.text2}
                                                    style={{ opacity: 0.25 }}
                                                />
                                                {/* Prayer Name Text */}
                                                <Text style={[styles.prayerNameText, { color: theme.text2 }]}>
                                                    {tr.prayers[prayerName] || prayerName}
                                                </Text>
                                                {/* Prayer Name Icon */}
                                                <PrayerIcon name={prayerName} size={18} color={theme.text2} opacity={0.7} />
                                                {/* Horizontal Spacer */}
                                                <View style={{ flex: 1 }} />
                                                {/* Prayer Time */}
                                                <Text style={[styles.prayerTimeText, { color: theme.text2 }]}>
                                                    {prayerTime}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Right: Notification Icon → opens modal */}
                                        <TouchableOpacity
                                            style={styles.notifIconTouchable}
                                            delayPressIn={0}
                                            delayPressOut={0}
                                            activeOpacity={0.3}
                                            hitSlop={8}
                                            onPress={() => router.navigate(`/(modals)/prayerNotification?prayer=${prayerName}`)}
                                        >
                                            <View style={[styles.notifIconContainer, { backgroundColor: theme.surfaceBg }]}>
                                                <PrayerNotifIcon prayerName={prayerName} size={20} color={theme.text2} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                </AppCard>

            </ScrollView>
        </AppTabScreen >
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 8,
        gap: 12,
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

    // Countdown Card
    countdownCard: {
        paddingVertical: 10,
        paddingHorizontal: 8,
    },

    // Quotes Card
    quotesCard: {
        paddingTop: 9,
        paddingBottom: 11,
        paddingHorizontal: 12,
    },

    // Prayers Card
    prayersCard: {
        overflow: 'hidden',
    },
    // Prayer Card - Date Header
    prayersDateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    dateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    prayersTimezoneInfo: {
        fontSize: 12,
        opacity: 0.7,
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
    fullDivider: {
        height: 2.5,
        width: '100%',
    },
    // Prayers List
    prayersRowContainer: {
        paddingTop: 10,
        paddingBottom: 14,
        paddingHorizontal: 7,
        gap: 7,
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        paddingHorizontal: 6,
        borderWidth: 1.3,
        borderRadius: 12,
        gap: 10,
    },
    prayerRowLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 5,
    },
    prayerNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    prayerNameText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
    },
    prayerTimeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    prayerTimeText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 4,
        letterSpacing: 0.5,
    },

    // Notification Icon
    notifIconTouchable: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
    },
    notifIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    prayerDivider: {
        height: 1,
        marginHorizontal: 12,
    },
});