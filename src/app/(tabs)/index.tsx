import AppCard from "@/components/AppCard";
import AppError from "@/components/AppError";
import AppLoading from "@/components/AppLoading";
import AppTabScreen from "@/components/AppTabScreen";
import PrayerCountdownCard from "@/components/PrayerCountdownCard";
import PrayerIcon from "@/components/PrayerIcon";
import QuotesCarousel from "@/components/QuotesCarousel";
import QuranPlaying from "@/components/QuranPlaying";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { usePrayersStore } from "@/store/prayersStore";
import { usePrayersTrackingStore } from "@/store/prayersTrackingStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerEventType, PrayerType } from "@/types/notification.types";
import { PrayerName, PrayerTimeEntry, TRACKABLE_PRAYERS } from "@/types/prayer.types";
import { IconProps } from "@/types/types";
import { formatDateKey } from "@/utils/date";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);
    const locationReady = useLocationStore.getState().isReady;
    const prayerTimes = usePrayersStore((state) => state.prayerTimes);
    const prayersError = usePrayersStore((state) => state.prayersError);
    const prayersLoading = usePrayersStore((state) => state.isLoading);
    const notifReady = useNotificationsStore((state) => state.isReady);
    const prayers = useNotificationsStore((state) => state.prayers);
    const events = useNotificationsStore((state) => state.events);
    const tracking = usePrayersTrackingStore((state) => state.tracking);
    const markPrayed = usePrayersTrackingStore((state) => state.markPrayed);
    const unmarkPrayed = usePrayersTrackingStore((state) => state.unmarkPrayed);

    // Local state
    const [nextPrayerName, setNextPrayerName] = useState<PrayerName | null>(null);

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

    // ------------------------------------------------------------
    // Prayer notification icon
    // ------------------------------------------------------------
    const handlePrayerNotificationIcon = (prayerName: string) => {
        // Check if it's a prayer or event
        const prayerSettings = prayers?.[prayerName as PrayerType];
        const eventSettings = events?.[prayerName as PrayerEventType];

        // Use whichever is available (prayer or event), or default to disabled
        const settings = prayerSettings || eventSettings;
        const enabled = notificationPermission && settings?.enabled;

        if (!enabled)
            return (props: IconProps) => <MaterialCommunityIcons name="bell-off-outline" {...props} style={[props.style, { opacity: 0.3, paddingBottom: 1 }]} />;
        if (enabled && settings.offset === 0)
            return (props: IconProps) => <MaterialCommunityIcons name="bell-outline" {...props} style={[props.style, { opacity: 0.6, paddingBottom: 1 }]} />;
        if (enabled && settings.offset !== 0)
            return (props: IconProps) => <MaterialCommunityIcons name="bell-cog-outline" {...props} style={[props.style, { opacity: 0.6, paddingBottom: 1 }]} />;

        return (props: IconProps) => <Ionicons name="notifications-outline" {...props} />;
    };

    // ------------------------------------------------------------
    // Check if a prayer time has passed
    // ------------------------------------------------------------
    const isPrayerPast = (prayerTime: string): boolean => {
        const [hours, minutes] = prayerTime.split(':').map(Number);
        const now = new Date();
        const prayer = new Date();
        prayer.setHours(hours, minutes, 0, 0);
        return now > prayer;
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
                        onNextPrayerChange={setNextPrayerName}
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
                            const isLast = index === arr.length - 1;
                            const NotifIcon = handlePrayerNotificationIcon(prayerName);
                            const isTrackable = TRACKABLE_PRAYERS.includes(prayerName as PrayerName);
                            const isPast = isTrackable && isPrayerPast(prayerTime);
                            const isDayDone = isPrayerPast(prayerTimes.Isha);
                            const isNext = !isDayDone && nextPrayerName === prayerName;
                            const isPrayed = isTrackable && tracking[`${formatDateKey()}:${prayerName}`] === 'prayed';

                            return (
                                <View key={prayerName} style={!isLast && { marginBottom: 0 }}>
                                    {/* Prayer row card */}
                                    <TouchableOpacity
                                        delayPressIn={0}
                                        delayPressOut={0}
                                        activeOpacity={0.3}
                                        onPress={() => router.navigate(`/(modals)/prayerNotification?prayer=${prayerName}`)}
                                    >
                                        <View
                                            style={[
                                                styles.prayerRow,
                                                {
                                                    backgroundColor: isNext ? theme.accentLight : theme.card,
                                                    borderColor: isNext ? theme.accentLight : theme.borderCard
                                                }
                                            ]}
                                        >
                                            {/* Left: Tracking circle (trackable) or dash placeholder */}
                                            {isTrackable ? (
                                                <TouchableOpacity
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    disabled={!isPast}
                                                    onPress={() => isPrayed
                                                        ? unmarkPrayed(prayerName as PrayerName)
                                                        : markPrayed(prayerName as PrayerName)
                                                    }
                                                >
                                                    <Ionicons
                                                        name={isPrayed ? 'checkmark-circle' : 'ellipse-outline'}
                                                        size={22}
                                                        color={isPrayed ? theme.accent2 : theme.text2}
                                                        style={{ opacity: isPrayed ? 1 : 0.45 }}
                                                    />
                                                </TouchableOpacity>
                                            ) : (
                                                <Ionicons
                                                    name="remove"
                                                    size={22}
                                                    color={theme.text2}
                                                    style={{ opacity: 0.25 }}
                                                />
                                            )}

                                            {/* Prayer Name Text */}
                                            <Text style={[styles.prayerNameText, { color: isNext ? theme.accent : theme.text2 }]}>
                                                {tr.prayers[prayerName] || prayerName}
                                            </Text>

                                            {/* Prayer Name Icon */}
                                            <PrayerIcon name={prayerName} size={18} color={isNext ? theme.accent : theme.text2} opacity={0.7} />

                                            {/* Horizontal Spacer */}
                                            <View style={{ flex: 1 }} />

                                            {/* Prayer Time */}
                                            <Text style={[styles.prayerTimeText, { color: isNext ? theme.accent : theme.text2 }]}>
                                                {prayerTime}
                                            </Text>

                                            {/* Notification Icon */}
                                            <View style={[styles.notifIconContainer, { backgroundColor: theme.surfaceBg }]}>
                                                <NotifIcon size={20} color={theme.text2} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 6,
        borderWidth: 1.3,
        borderRadius: 12,
        gap: 10,
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