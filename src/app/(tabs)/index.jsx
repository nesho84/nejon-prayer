import { Alert, Button, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "@/context/ThemeContext";
import { useAppContext } from '@root/src/context/AppContext';
import { usePrayersContext } from '@/context/PrayersContext';
import useNextPrayer from "@/hooks/useNextPrayer";
import useTranslation from "@/hooks/useTranslation";
import AppTabScreen from "@root/src/components/AppTabScreen";
import AppLoading from "@/components/AppLoading";
import AppError from "@/components/AppError";
import AppCard from "@/components/AppCard";
import CountdownCircle from "@/components/CountdownCircle";
import { testNotification, debugChannelsAndScheduled } from "@/utils/notifTest";
import QuoteCarousel from "@root/src/components/QuoteCarousel";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr, language } = useTranslation();
    const {
        appSettings,
        deviceSettings,
        isReady: settingsReady,
        isLoading: settingsLoading,
        settingsError,
        saveAppSettings
    } = useAppContext();

    const {
        prayerTimes,
        isReady: prayersReady,
        isLoading: prayersLoading,
        prayersError,
        reloadPrayerTimes,
    } = usePrayersContext();

    const {
        nextPrayerName,
        prayerCountdown,
        remainingSeconds,
        totalSeconds
    } = useNextPrayer(prayerTimes);

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
    // Prayer icon resolver
    // ------------------------------------------------------------
    const resolvePrayerIcon = (prayerName) => {
        const p = String(prayerName || "").toLowerCase();
        if (p.includes("imsak")) return { lib: 'Ionicons', name: 'time-outline' };
        if (p.includes("fajr")) return { lib: 'Ionicons', name: 'moon-outline' };
        if (p.includes("sunrise")) return { lib: 'MaterialCommunityIcons', name: 'weather-sunset-up' };
        if (p.includes("dhuhr")) return { lib: 'Ionicons', name: 'sunny' };
        if (p.includes("asr")) return { lib: 'Ionicons', name: 'partly-sunny-outline' };
        if (p.includes("maghrib")) return { lib: 'MaterialCommunityIcons', name: 'weather-sunset-down' };
        if (p.includes("isha")) return { lib: 'Ionicons', name: 'moon-sharp' };
        return "time-outline";
    };

    // ------------------------------------------------------------
    // Prayer icon state
    // ------------------------------------------------------------
    const isNotificationEnabled = (prayerName) => {
        return deviceSettings.notificationPermission && appSettings.notificationsConfig?.prayers?.[prayerName];
    };

    // ------------------------------------------------------------
    // Toggle prayer notification
    // ------------------------------------------------------------
    const togglePrayerNotification = async (prayerName) => {
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

        // Save appSettings
        await saveAppSettings({
            notificationsConfig: {
                ...appSettings.notificationsConfig,
                prayers: {
                    ...appSettings.notificationsConfig.prayers,
                    [prayerName]: !appSettings.notificationsConfig.prayers?.[prayerName],
                },
            },
        });
    };

    // Loading state: settings
    if (!settingsReady || settingsLoading || !prayersReady || prayersLoading) {
        return <AppLoading text={tr("labels.loading")} />;
    }

    // Settings error
    // ------------------------------------------------------------
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

    // Main Content
    return (
        <AppTabScreen>
            {/* Notifications Debug utility */}
            {/* <Button title="Test Notifications" onPress={() => testNotification({ appSettings, seconds: 10 })} /> */}
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
                                            <IconComponent name={iconData.name} size={22} color={isNext ? theme.accent : theme.text2} />
                                            <Text style={[styles.prayerNameText, { color: isNext ? theme.accent : theme.text }]}>
                                                {tr(`prayers.${name}`) || name}
                                            </Text>
                                        </View>

                                        {/* Prayer Time */}
                                        <View style={styles.prayerTimeSection}>
                                            <Text style={[styles.prayerTimeText, { color: isNext ? theme.accent : theme.text }]}>
                                                {time}
                                            </Text>

                                            {/* Prayer Time Icon (Notification on/off) */}
                                            {(!name.includes("Imsak") && !name.includes("Sunrise"))
                                                ? <Ionicons
                                                    name={isNotificationEnabled(name) ? "notifications-outline" : "notifications-off-outline"}
                                                    size={22}
                                                    color={theme.text2}
                                                    style={{ opacity: isNotificationEnabled(name) ? 0.5 : 0.3 }}
                                                    onPress={() => togglePrayerNotification(name)}
                                                />
                                                : <Ionicons
                                                    name={"information-circle-outline"}
                                                    size={22}
                                                    color={theme.text2}
                                                    style={{ opacity: 0.5 }}
                                                />
                                            }
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

            </ScrollView>
        </AppTabScreen>
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
        paddingVertical: 16,
    },

    // Quotes Card
    quotesCard: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },

    // Prayer Card
    prayerCard: {
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
        paddingVertical: 13,
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
});