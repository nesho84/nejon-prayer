import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useSettingsContext } from '@/contexts/SettingsContext';
import { usePrayersContext } from '@/contexts/PrayersContext';
import useNextPrayer from "@/hooks/useNextPrayer";
import useTranslation from "@/hooks/useTranslation";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import { formatLocation, formatTimezone } from "@/utils/timeZone";
import LoadingScreen from "@/components/LoadingScreen";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { settings, settingsLoading, settingsError } = useSettingsContext();
    const { prayersTimes, prayersLoading, prayersError, refetchPrayersTimes, hasPrayersTimes } = usePrayersContext();
    const { nextPrayerName, prayerCountdown } = useNextPrayer(prayersTimes);
    const { schedulePrayerNotifications, sendTestNotification, logScheduledNotifications } = usePrayerNotifications();

    // Local state
    const isFocused = useIsFocused();
    const [warning, setWarning] = useState(null);
    const [fullAddress, setFullAddress] = useState(null);
    const [timeZone, setTimezone] = useState(null);

    // Show loading if either context is loading
    const isLoading = settingsLoading || prayersLoading;
    // Show error if either context has an error
    const hasError = settingsError || prayersError;

    // --------------------------------------------------
    // Schedule notifications when prayer times are ready
    // --------------------------------------------------
    useEffect(() => {
        if (settings?.notifications && hasPrayersTimes) {
            schedulePrayerNotifications(prayersTimes);
        }
    }, [isFocused, prayersTimes, settings?.notifications]);

    // --------------------------------------------------
    // Schedule notifications and update warnings when screen is focused
    // --------------------------------------------------
    useEffect(() => {
        // Update warnings
        if (!settings?.location && !settings?.notifications) {
            setWarning(tr("labels.warning1"));
        } else if (!settings?.location) {
            setWarning(tr("labels.warning2"));
        } else if (!settings?.notifications) {
            setWarning(tr("labels.warning3"));
        } else {
            setWarning(null);
        }
    }, [isFocused]);

    // -------------------------------------------------------
    // Format location and timezone when location is available
    // --------------------------------------------------------
    useEffect(() => {
        if (!settings?.location || settingsLoading) return;
        (async () => {
            try {
                if (!hasPrayersTimes) {
                    const formatedAddress = await formatLocation(settings.location);
                    if (formatedAddress) setFullAddress(formatedAddress);
                }
                const formatedTimezone = await formatTimezone(settings.location);
                if (formatedTimezone) setTimezone(formatedTimezone);
            } catch (error) {
                console.warn("Location formatting error:", error);
                // Set fallback for timezone
                setTimezone({
                    title: new Date().toDateString(),
                    subTitle: "",
                    date: ""
                });
            }
        })();
    }, [settings?.location, settingsLoading, hasPrayersTimes]);

    // --------------------------------------------------
    // Handle refresh with better error handling
    // --------------------------------------------------
    const handleRefresh = async () => {
        try {
            await refetchPrayersTimes();
        } catch (error) {
            console.warn("Refresh failed:", error);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <LoadingScreen
                message={settingsLoading ? 'Loading settings...' : 'Loading prayer times...'}
                style={{ backgroundColor: theme.background }}
            />
        );
    }

    // Error state
    if (hasError) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={styles.errorText}>
                    {tr("labels.noPrayersTimes")}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No location set
    if (!settings.location) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={styles.messageText}>Welcome to Nejon-Prayer!</Text>
                <Text style={styles.subText}>Please set your location to view prayer times</Text>
                <TouchableOpacity style={styles.settingsButton} onPress={() => router.navigate("/(tabs)/settings")}>
                    <Text style={styles.settingsButtonText}>Go to Settings</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No prayer times available
    if (!hasPrayersTimes) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={styles.messageText}>No prayer times available for</Text>
                <Text style={styles.subText}>{fullAddress || 'your location'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                    <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main content
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
                <View style={styles.innerContainer}>

                    {/* Warnings box */}
                    {warning && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>{warning}</Text>
                        </View>
                    )}

                    {/* Current Timezone/Date */}
                    <View style={styles.timeZone}>
                        <Text style={[styles.timeZoneTitle, { color: theme.primaryText }]}>
                            {timeZone?.title || new Date().toDateString()}
                        </Text>
                        <Text style={[styles.timeZoneSubTitle, { color: theme.secondaryText }]}>
                            {timeZone?.subTitle || ""}
                        </Text>
                        <Text style={[styles.timeZoneDate, { color: theme.secondaryText }]}>
                            {timeZone?.date || ""}
                        </Text>
                    </View>

                    {/* Next prayer countdown */}
                    {nextPrayerName && (
                        <Text style={[styles.countdown, { color: theme.secondaryText }]}>
                            {prayerCountdown} » {nextPrayerName ? tr(`prayers.${nextPrayerName}`) : ""}
                        </Text>
                    )}

                    {/* Prayer times list - Using map instead of FlatList */}
                    <View style={styles.prayersList}>
                        {Object.entries(prayersTimes || {}).map(([name, time]) => (
                            <View key={name} style={[styles.listContainer, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.prayerName, { color: theme.primaryText }]}>
                                    {tr(`prayers.${name}`) || name}
                                </Text>
                                <Text style={[styles.prayerTime, { color: theme.primaryText }]}>
                                    {time}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Just for Testing... */}
                    {/* <Button title="Send Test Notification" onPress={sendTestNotification} /> */}
                    {/* <Button title="Log Scheduled Notifications" onPress={logScheduledNotifications} /> */}

                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        minHeight: '100%',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    timeZone: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 45,
    },
    timeZoneTitle: {
        fontSize: 23,
        marginBottom: 5,
    },
    timeZoneSubTitle: {
        fontSize: 15,
        fontWeight: "300",
        color: '#666',
        marginBottom: 4,
    },
    timeZoneDate: {
        fontSize: 16,
        fontWeight: "500",
        color: '#666',
    },
    countdown: {
        fontSize: 28,
        fontWeight: "500",
        marginTop: 30,
        marginBottom: 55,
    },
    listContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
        width: "100%",
        paddingVertical: 10,
    },
    prayerName: {
        fontSize: 18,
        fontWeight: "500",
    },
    prayerTime: {
        fontSize: 18,
        fontWeight: "400",
    },
    warningBox: {
        padding: 8,
        backgroundColor: "#fdecea",
        borderWidth: 1,
        borderColor: "#f5c2c7",
        borderRadius: 4,
        marginBottom: 30,
    },
    warningText: {
        color: "#856404",
        textAlign: "center",
        fontWeight: "500",
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
    messageText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    retryButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    settingsButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    settingsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});