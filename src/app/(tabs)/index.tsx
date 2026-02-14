import { useState, useEffect } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import * as Updates from "expo-updates";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import useNextPrayer from "@/hooks/useNextPrayer";
import AppTabScreen from "@/components/AppTabScreen";
import AppLoading from "@/components/AppLoading";
import AppError from "@/components/AppError";
import AppCard from "@/components/AppCard";
import CountdownCircle from "@/components/CountdownCircle";
import QuoteCarousel from "@/components/QuoteCarousel";
import { testNotification, debugChannelsAndScheduled } from "@/utils/notifTest";
import PrayerModal from "@/components/PrayerModal";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { PrayerCountdown, PrayerName, PrayerTimeEntry } from "@/types/prayer.types";
import { PrayerType, PrayerSettings, PrayerEventType, EventSettings } from "@/types/notification.types";
import { IconProps } from "@/types/types";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { usePrayersStore } from "@/store/prayersStore";
import { useNotificationsStore } from "@/store/notificationsStore";

export default function HomeScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const language = useLanguageStore((state) => state.language);
    const tr = useLanguageStore((state) => state.tr);
    const locationPermission = useDeviceSettingsStore((state) => state.locationPermission);
    const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
    const deviceSettingsReady = useDeviceSettingsStore((state) => state.isReady);
    const deviceSettingsError = useDeviceSettingsStore((state) => state.deviceSettingsError);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);
    const locationReady = useLocationStore.getState().isReady;
    const prayerTimes = usePrayersStore((state) => state.prayerTimes);
    const prayersError = usePrayersStore((state) => state.prayersError);
    const prayersLoading = usePrayersStore((state) => state.isLoading);
    const notifReady = useNotificationsStore((state) => state.isReady);
    const notifLoading = useNotificationsStore((state) => state.isLoading);
    const notifSettings = useNotificationsStore((state) => state.notifSettings);
    const prayers = useNotificationsStore((state) => state.prayers);
    const events = useNotificationsStore((state) => state.events);

    // Next prayer countdown
    const {
        nextPrayerName,
        prayerCountdown,
        remainingSeconds,
        totalSeconds
    } = useNextPrayer(prayerTimes);

    // Local State
    const [prayerModalVisible, setPrayerModalVisible] = useState(false);
    const [selectedPrayerName, setSelectedPrayerName] = useState<PrayerName | null>(null);

    // ------------------------------------------------------------
    // Load prayer times on mount
    // ------------------------------------------------------------
    useEffect(() => {
        if (!deviceSettingsReady || !locationReady) return;

        // Load prayer times
        usePrayersStore.getState().loadPrayerTimes();

    }, [deviceSettingsReady, locationReady, location]);

    // ------------------------------------------------------------
    // Check for expo OTA updates on mount
    // ------------------------------------------------------------
    useEffect(() => {
        if (__DEV__) return; // Skip in dev mode

        const checkForUpdates = async () => {
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                await Updates.fetchUpdateAsync();

                Alert.alert(
                    "Update available",
                    "The app was updated. Restart now?",
                    [
                        { text: "Later", style: "cancel" },
                        {
                            text: "Restart",
                            onPress: () => Updates.reloadAsync(),
                        },
                    ]
                );
            }
        };

        checkForUpdates();
    }, []);

    // ------------------------------------------------------------
    // Handle prayer times refresh
    // ------------------------------------------------------------
    const handlePrayersRefresh = async () => {
        try {
            await usePrayersStore.getState().reloadPrayerTimes();
        } catch (err) {
            console.warn("Prayer times refresh failed:", err);
        }
    };

    // ------------------------------------------------------------
    // Handle Prayers Modal
    // ------------------------------------------------------------
    const openPrayersModal = (prayerName: PrayerName) => {
        setPrayerModalVisible(true);
        setSelectedPrayerName(prayerName);
    };

    // ------------------------------------------------------------
    // Prayer name icon
    // ------------------------------------------------------------
    const handlePrayerNameIcon = (prayerName: string) => {
        const pn = prayerName.toLowerCase();

        if (pn.includes("imsak")) return (props: IconProps) => <Ionicons name="time-outline" {...props} />;
        if (pn.includes("fajr")) return (props: IconProps) => <Ionicons name="moon-outline" {...props} />;
        if (pn.includes("sunrise")) return (props: IconProps) => <MaterialCommunityIcons name="weather-sunset-up" {...props} />;
        if (pn.includes("dhuhr")) return (props: IconProps) => <Ionicons name="sunny" {...props} />;
        if (pn.includes("asr")) return (props: IconProps) => <Ionicons name="partly-sunny-outline" {...props} />;
        if (pn.includes("maghrib")) return (props: IconProps) => <MaterialCommunityIcons name="weather-sunset-down" {...props} />;
        if (pn.includes("isha")) return (props: IconProps) => <Ionicons name="moon-sharp" {...props} />;

        return (props: IconProps) => <Ionicons name="time-outline" {...props} />;
    };

    // ------------------------------------------------------------
    // Prayer notification icon
    // ------------------------------------------------------------
    const handlePrayerNotificationIcon = (prayerName: string) => {
        // Check if it's a prayer or event
        const prayerSettings = prayers?.[prayerName as PrayerType];
        const eventSettings = events?.[prayerName as PrayerEventType];

        // Use whichever exists
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
    // Toggle prayer notification
    // ------------------------------------------------------------
    const handlePrayerSettingsModal = (prayerName: PrayerName, settings: PrayerSettings | EventSettings) => {
        // Check system notifications first
        if (!notificationPermission) {
            Alert.alert(
                tr.labels.notificationsDisabled,
                tr.labels.notificationsDisabledMessage,
                [
                    { text: tr.buttons.cancel, style: "cancel" },
                    {
                        text: tr.labels.goToSettings,
                        onPress: () => router.navigate("/(tabs)/settings")
                    },
                ],
                { cancelable: true }
            );
            return;
        }

        // Determine if this is a prayer or event
        const isPrayer = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(prayerName);
        const isEvent = ['Imsak', 'Sunrise'].includes(prayerName);

        // Save to appropriate store method with destructured values
        if (isPrayer) {
            const { enabled, offset, sound } = settings as PrayerSettings;
            useNotificationsStore.getState().setPrayer(prayerName as PrayerType, enabled, offset, sound);
        } else if (isEvent) {
            const { enabled, offset, sound } = settings as EventSettings;
            useNotificationsStore.getState().setEvent(prayerName as PrayerEventType, enabled, offset, sound);
        }
    };

    // Loading state
    if (!deviceSettingsReady || !locationReady || prayersLoading || !notifReady || notifLoading) {
        return <AppLoading text={tr.labels.loading} />;
    }

    // Device Settings error
    if (deviceSettingsError) {
        return (
            <AppError
                icon="alert-circle-outline"
                iconColor={theme.danger}
                message={deviceSettingsError || tr.labels.deviceSettingsError}
                buttonText={tr.labels.goToSettings}
                buttonColor={theme.primary}
                onPress={() => router.navigate("/(tabs)/settings")}
            />
        );
    }

    // No location set
    if (!locationPermission || !location) {
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
            {/* Notifications Test utility */}
            <TouchableOpacity style={{ borderWidth: 1, borderColor: theme.danger, padding: 6, marginBottom: 8 }}
                onPress={() => testNotification({ options: { language, location }, notifSettings, seconds: 10 })}>
                <Text style={{ color: theme.text }}>Test Notifications</Text>
            </TouchableOpacity>

            {/* Notifications Debug utility */}
            <TouchableOpacity
                style={{ borderWidth: 1, borderColor: theme.danger, padding: 6, marginBottom: 8 }}
                onPress={debugChannelsAndScheduled}>
                <Text style={{ color: theme.text }}>Debug Notifications</Text>
            </TouchableOpacity>

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

                {/* 2. COUNTDOWN CIRCLE CARD */}
                <AppCard style={styles.countdownCard}>
                    {nextPrayerName && (
                        <CountdownCircle
                            nextPrayerName={nextPrayerName}
                            prayerCountdown={prayerCountdown as PrayerCountdown}
                            remainingSeconds={remainingSeconds}
                            totalSeconds={totalSeconds}
                            size={160}
                            strokeWidth={6}
                            strokeColor={theme.border}
                            color={theme.accent}
                        />
                    )}
                </AppCard>

                {/* 3. QUOTES Carousel CARD */}
                <AppCard style={styles.quotesCard}>
                    <QuoteCarousel language={language} />
                </AppCard>

                {/* 4. PRAYERS CARD */}
                <AppCard style={styles.prayersCard}>
                    {/* Prayers Date Header */}
                    <View style={styles.prayersDateHeader}>
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

                    {/* Divider */}
                    <View style={[styles.fullDivider, { backgroundColor: theme.divider }]} />

                    {/* Prayers List */}
                    <View style={styles.prayersRowContainer}>
                        {(Object.entries(prayerTimes) as PrayerTimeEntry[]).map(([prayerName, prayerTime], index) => {
                            const isNext = nextPrayerName === prayerName;
                            const isLast = index === Object.entries(prayerTimes).length - 1;
                            const NameIcon = handlePrayerNameIcon(prayerName);
                            const NotifIcon = handlePrayerNotificationIcon(prayerName);

                            return (
                                <View key={prayerName}>
                                    {/* Prayer row */}
                                    <TouchableOpacity activeOpacity={0.3} onPress={() => openPrayersModal(prayerName)}>
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
                                                {/* Prayer Name Icon */}
                                                <NameIcon size={22} color={isNext ? theme.accent : theme.text2} />
                                                <Text style={[styles.prayerNameText, { color: isNext ? theme.accent : theme.text }]}>
                                                    {tr.prayers[prayerName] || prayerName}
                                                </Text>
                                            </View>

                                            {/* Prayer Time */}
                                            <View style={styles.prayerTimeSection}>
                                                <Text style={[styles.prayerTimeText, { color: isNext ? theme.accent : theme.text }]}>
                                                    {prayerTime}
                                                </Text>
                                                {/* Prayer Time Icon */}
                                                <NotifIcon size={22} color={theme.text} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Prayer Divider */}
                                    {!isLast && (
                                        <View style={[styles.prayerDivider, { backgroundColor: theme.divider2 }]} />
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Prayer Notifications settings Modal */}
                    {selectedPrayerName && (
                        <PrayerModal
                            visible={prayerModalVisible}
                            setVisible={setPrayerModalVisible}
                            header={selectedPrayerName}
                            selectedValue={
                                prayers[selectedPrayerName as PrayerType] ||
                                events[selectedPrayerName as PrayerEventType] ||
                                { enabled: false, offset: 0, sound: '' }
                            }
                            onSelect={(selectedSettings) => handlePrayerSettingsModal(selectedPrayerName, selectedSettings)}
                        />
                    )}
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

    // Countdown Card
    countdownCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
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
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
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
    fullDivider: {
        height: 1,
        width: '100%',
    },
    // Prayers List
    prayersRowContainer: {
        paddingTop: 8,
        paddingBottom: 16,
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
        paddingHorizontal: 12,
    },
    prayerRowActive: {
        borderLeftWidth: 3,
        borderRightWidth: 3,
        marginVertical: 2,
        paddingHorizontal: 10,
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
        marginHorizontal: 12,
    },
});