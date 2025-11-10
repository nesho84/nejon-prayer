import { useState } from "react";
import { Alert, Button, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import { useAppContext } from '@/context/AppContext';
import { usePrayersContext } from '@/context/PrayersContext';
import { useNotificationsContext } from "@/context/NotificationsContext";
import useNextPrayer from "@/hooks/useNextPrayer";
import useTranslation from "@/hooks/useTranslation";
import AppTabScreen from "@/components/AppTabScreen";
import AppLoading from "@/components/AppLoading";
import AppError from "@/components/AppError";
import AppCard from "@/components/AppCard";
import CountdownCircle from "@/components/CountdownCircle";
import QuoteCarousel from "@/components/QuoteCarousel";
import { testNotification, debugChannelsAndScheduled } from "@/utils/notifTest";
import PrayerModal from "@/components/PrayerModal";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { language, tr } = useTranslation();
    const {
        appSettings,
        deviceSettings,
        isReady: settingsReady,
        isLoading: settingsLoading,
        settingsError
    } = useAppContext();

    const {
        prayerTimes,
        isReady: prayersReady,
        isLoading: prayersLoading,
        prayersError,
        reloadPrayerTimes
    } = usePrayersContext();

    const {
        nextPrayerName,
        prayerCountdown,
        remainingSeconds,
        totalSeconds
    } = useNextPrayer(prayerTimes);

    const {
        notifSettings,
        isReady: notifReady,
        isLoading: notifLoading,
        notifError,
        savePrayerNotifSettings
    } = useNotificationsContext();

    // Local State
    const [prayerModalVisible, setPrayerModalVisible] = useState(false);
    const [selectedPrayer, setSelectedPrayer] = useState(null);

    // ------------------------------------------------------------
    // Handle prayer times refresh
    // ------------------------------------------------------------
    const handlePrayersRefresh = async () => {
        try {
            await reloadPrayerTimes();
        } catch (err) {
            console.warn("Prayer times refresh failed:", err);
        }
    };

    // ------------------------------------------------------------
    // Handle Prayers Modal
    // ------------------------------------------------------------
    const openPrayersModal = (prayerName) => {
        setPrayerModalVisible(true);
        setSelectedPrayer(prayerName);
    };

    // ------------------------------------------------------------
    // Prayer name icon
    // ------------------------------------------------------------
    const handlePrayerNameIcon = (prayerName) => {
        const pn = String(prayerName || "").toLowerCase();

        if (pn.includes("imsak")) return (props) => <Ionicons name="time-outline" {...props} />;
        if (pn.includes("fajr")) return (props) => <Ionicons name="moon-outline" {...props} />;
        if (pn.includes("sunrise")) return (props) => <MaterialCommunityIcons name="weather-sunset-up" {...props} />;
        if (pn.includes("dhuhr")) return (props) => <Ionicons name="sunny" {...props} />;
        if (pn.includes("asr")) return (props) => <Ionicons name="partly-sunny-outline" {...props} />;
        if (pn.includes("maghrib")) return (props) => <MaterialCommunityIcons name="weather-sunset-down" {...props} />;
        if (pn.includes("isha")) return (props) => <Ionicons name="moon-sharp" {...props} />;

        return (props) => <Ionicons name="time-outline" {...props} />;
    };

    // ------------------------------------------------------------
    // Prayer notification icon
    // ------------------------------------------------------------
    const handlePrayerNotificationIcon = (prayerName) => {
        const pst = notifSettings?.prayers?.[prayerName];
        const enabled = deviceSettings.notificationPermission && pst?.enabled;

        if (!enabled)
            return (props) => <Ionicons name="notifications-off-outline" {...props} style={[props.style, { opacity: 0.3 }]} />;
        if (enabled && pst.offset === 0)
            return (props) => <Ionicons name="notifications-outline" {...props} style={[props.style, { opacity: 0.6 }]} />;
        if (enabled && pst.offset !== 0)
            return (props) => <Ionicons name="timer-outline" {...props} style={[props.style, { opacity: 0.6 }]} />;

        return (props) => <Ionicons name="notifications-outline" {...props} />;
    };

    // ------------------------------------------------------------
    // Toggle prayer notification
    // ------------------------------------------------------------
    const handlePrayerNotification = (selected, prayerName) => {
        // Check system notifications first
        if (!deviceSettings.notificationPermission) {
            Alert.alert(
                tr("labels.notificationsDisabled"),
                tr("labels.notificationsDisabledMessage"),
                [
                    { text: tr ? tr("buttons.cancel") : "Cancel", style: "cancel" },
                    {
                        text: tr("labels.goToSettings"),
                        onPress: () => router.navigate("/(tabs)/settings")
                    },
                ],
                { cancelable: true }
            );
            return;
        }

        // Save notifSettings
        // selected = { enabled: boolean, offset: number }
        savePrayerNotifSettings(prayerName, selected);
    };

    // Loading contexts state
    if (!settingsReady || settingsLoading || !prayersReady || prayersLoading || !notifReady || notifLoading) {
        return <AppLoading text={tr("labels.loading")} />;
    }

    // console.log(notifSettings);

    // Settings error
    if (settingsError) {
        return (
            <AppError
                icon="alert-circle-outline"
                iconColor={theme.danger}
                message={settingsError || tr("labels.settingsError")}
                buttonText={tr("labels.goToSettings")}
                buttonColor={theme.primary}
                onPress={() => router.navigate("/(tabs)/settings")}
            />
        );
    }

    // No location set
    if (!appSettings.locationPermission && !appSettings.location) {
        return (
            <AppError
                icon="location-outline"
                iconColor={theme.danger}
                message={tr("labels.locationSet")}
                buttonText={tr("labels.goToSettings")}
                buttonColor={theme.danger}
                onPress={() => router.navigate("/(tabs)/settings")}
            />
        );
    }

    // Prayer times error
    if (prayersError || !prayerTimes) {
        return (
            <AppError
                icon="time-outline"
                iconColor={theme.danger}
                message={prayersError || tr("labels.prayersError")}
                buttonText={tr("buttons.retry")}
                buttonColor={theme.danger}
                onPress={handlePrayersRefresh}
            />
        );
    }

    // Notifications Settings error
    if (notifError) {
        return (
            <AppError
                icon="alert-circle-outline"
                iconColor={theme.danger}
                message={settingsError || tr("labels.settingsError")}
                buttonText={tr("labels.goToSettings")}
                buttonColor={theme.primary}
                onPress={() => router.navigate("/(tabs)/settings")}
            />
        );
    }

    // Main Content
    return (
        <AppTabScreen>
            {/* Notifications Debug utility */}
            {/* <Button title="Test Notifications" onPress={() => testNotification({ appSettings, notifSettings, seconds: 10 })} /> */}
            {/* <Button title="Debug Notifications" onPress={debugChannelsAndScheduled} /> */}

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={prayersLoading || settingsLoading}
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

                {/* 3. QUOTES Carousel CARD */}
                <AppCard style={styles.quotesCard}>
                    <QuoteCarousel language={language} />
                </AppCard>

                {/* 4. PRAYERS CARD */}
                <AppCard style={styles.prayersCard}>
                    {/* Prayers Date Header */}
                    <View style={styles.prayersDateHeader}>
                        <Text style={[styles.dateHeaderText, { color: theme.text }]}>
                            {new Date().toLocaleDateString(tr("labels.localeDate"), {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase())}
                        </Text>
                        <Text style={[styles.prayersTimezoneInfo, { color: theme.text2 }]}>
                            {appSettings.timeZone?.zoneName || ""} • {appSettings.timeZone?.offset || ""}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={[styles.fullDivider, { backgroundColor: theme.divider }]} />

                    {/* Prayers List */}
                    <View style={styles.prayersRowContainer}>
                        {Object.entries(prayerTimes).map(([prayerName, prayerTime], index) => {
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
                                                    {tr(`prayers.${prayerName}`) || prayerName}
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
                    <PrayerModal
                        visible={prayerModalVisible}
                        setVisible={setPrayerModalVisible}
                        header={selectedPrayer}
                        theme={theme}
                        tr={tr}
                        selectedValue={notifSettings.prayers[selectedPrayer]}
                        onSelect={(selected) => handlePrayerNotification(selected, selectedPrayer)}
                    />
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