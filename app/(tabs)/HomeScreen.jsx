import { Button, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from '@/contexts/SettingsContext';
import { usePrayersContext } from '@/contexts/PrayersContext';
import useTranslation from "@/hooks/useTranslation";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import useNextPrayer from "@/hooks/useNextPrayer";
import LoadingScreen from "@/components/LoadingScreen";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { appSettings, settingsLoading, settingsError } = useSettingsContext();
    const { prayerTimes, prayersLoading, prayersError, reloadPrayerTimes, hasPrayerTimes } = usePrayersContext();
    const { nextPrayerName, prayerCountdown } = useNextPrayer(prayerTimes);
    const { scheduleTestNotification } = useNotificationsContext();

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
        return (
            <LoadingScreen
                message={settingsLoading ? tr("labels.loadingSettings") : tr("labels.loadingPrayers")}
                style={{ backgroundColor: theme.bg }}
            />
        );
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
                    style={[styles.button, { backgroundColor: theme.danger }]}
                    onPress={handleRefresh}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No location set
    if (!appSettings.locationPermission && !appSettings.location) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="location-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.locationSet")}</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={() => router.navigate("/(tabs)/settings")}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>{tr("labels.goToSettings")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No prayer times available
    if (!hasPrayerTimes) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.bg }]}>
                <View style={styles.errorBanner}>
                    <Ionicons name="time-outline" size={80} color={theme.primary} />
                </View>
                <Text style={[styles.errorText, { color: theme.text2 }]}>{tr("labels.noPrayerTimes")}</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleRefresh}>
                    <Text style={[styles.buttonText, { color: theme.white }]}>{tr("buttons.retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={prayersLoading || settingsLoading}
                    onRefresh={handleRefresh}
                    tintColor={theme.accent}
                    colors={[theme.accent]}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            <SafeAreaView style={[styles.innerContainer, { backgroundColor: theme.bg }]}>

                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Timezone & Date */}
                    <View style={styles.heroTimeZone}>
                        <Text style={[styles.timeZoneDate, { color: theme.text }]}>
                            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric", })}
                        </Text>
                        <Text style={[styles.timeZoneTitle, { color: theme.text2 }]}>
                            {appSettings.timeZone?.title || new Date().toDateString()}
                        </Text>
                        <Text style={[styles.timeZoneSubTitle, { color: theme.placeholder }]}>
                            {appSettings.timeZone?.subTitle || ""}
                        </Text>
                    </View>

                    {/* Next prayer countdown */}
                    {nextPrayerName && (
                        <Text style={[styles.heroCountdown, { color: theme.accent }]}>
                            {prayerCountdown} » {nextPrayerName ? tr(`prayers.${nextPrayerName}`) : ""}
                        </Text>
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
                                    { backgroundColor: theme.card, borderColor: theme.border },
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

                {/* <View style={{ marginTop: 20 }}>
                    <Button title="Test Notifications" onPress={scheduleTestNotification} />
                </View> */}

            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    innerContainer: {
        flex: 1,
        alignItems: "center",
        padding: 20,
    },
    heroCard: {
        width: "100%",
        alignItems: "center",
        borderRadius: 16,
        marginBottom: 32,
        paddingHorizontal: 18,
        paddingVertical: 24,
        borderWidth: 1,
    },
    heroTimeZone: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    timeZoneDate: {
        fontSize: 22,
        fontWeight: "600",
        marginBottom: 8,
    },
    timeZoneTitle: {
        fontSize: 18,
        marginBottom: 3,
    },
    timeZoneSubTitle: {
        fontSize: 13,
        fontWeight: "400",
    },
    heroCountdown: {
        fontSize: 28,
        fontWeight: "700",
        marginTop: 14,
        marginBottom: 6,
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
        paddingHorizontal: 18,
        borderRadius: 12,
        borderWidth: 1,
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
    countdown: {
        fontSize: 28,
        fontWeight: "600",
        marginTop: 20,
        marginBottom: 55,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});