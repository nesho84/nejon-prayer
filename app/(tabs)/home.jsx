import LoadingScreen from "@/components/LoadingScreen";
import { usePrayersContext } from '@/contexts/PrayersContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useThemeContext } from "@/contexts/ThemeContext";
import useNextPrayer from "@/hooks/useNextPrayer";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import useTranslation from "@/hooks/useTranslation";
import { formatTimezone, reverseGeocode } from "@/utils/timeZone";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { settings, settingsLoading, settingsError } = useSettingsContext();
    const { prayersTimes, prayersLoading, prayersError, refetchPrayersTimes, hasPrayersTimes } = usePrayersContext();
    const { nextPrayerName, prayerCountdown } = useNextPrayer(prayersTimes);

    // Notifications hook
    const {
        schedulePrayerNotifications,
        sendTestNotification,
        logScheduledNotifications
    } = usePrayerNotifications();

    const isFocused = useIsFocused();
    const [warning, setWarning] = useState(null);
    const [address, setAddress] = useState(null);

    // Show loading if either context is loading
    const isLoading = settingsLoading || prayersLoading;
    // Show error if either context has an error
    const hasError = settingsError || prayersError;

    // --------------------------------------------------
    // Schedule notifications when prayer times are ready
    // --------------------------------------------------
    // useEffect(() => {
    //     if (prayersTimes) {
    //         schedulePrayerNotifications(prayersTimes);
    //     }
    // }, [prayersTimes]);

    // --------------------------------------------------
    // Update warnings when screen is focused
    // --------------------------------------------------
    useEffect(() => {
        // update warnings
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

    // Reverse geocode to get human-readable address
    useEffect(() => {
        (async () => {
            const fullAddress = await reverseGeocode(settings.location);
            setAddress(fullAddress);
        })();
    }, [settings.location]);

    // Loading state
    if (isLoading) {
        // return <LoadingScreen message={tr("labels.loading")} />
        return (
            <LoadingScreen
                message={settingsLoading ? 'Loading settings...' : 'Loading prayer times...'}
                styling={{ backgroundColor: theme.background }}
            />
        );
    }

    // Error state
    if (hasError) {
        return (
            <View style={{ ...styles.centerContainer, backgroundColor: theme.background }}>
                <Text style={styles.errorText}>
                    {tr("labels.noPrayersTimes")}
                    {settingsError || prayersError}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={refetchPrayersTimes}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No location set
    if (!settings.location) {
        return (
            <View style={{ ...styles.centerContainer, backgroundColor: theme.background }}>
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
            <View style={{ ...styles.centerContainer, backgroundColor: theme.background }}>
                <Text style={styles.messageText}>No prayer times available for</Text>
                <Text style={styles.subText}>{address || 'your location'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refetchPrayersTimes}>
                    <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ ...styles.container, backgroundColor: theme.background }}>
            <View style={styles.inner}>

                {/* Warnings box */}
                {warning && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>{warning}</Text>
                    </View>
                )}

                {/* Current date */}
                <Text style={{ ...styles.date, color: theme.primaryText }}>
                    {formatTimezone(settings.location)}
                </Text>

                {/* Next prayer countdown */}
                {nextPrayerName && (
                    <Text style={{ ...styles.countdown, color: theme.secondaryText }}>
                        {prayerCountdown} » {nextPrayerName ? tr(`prayers.${nextPrayerName}`) : ""}
                    </Text>
                )}

                {/* Prayer times list  */}
                <FlatList
                    contentContainerStyle={{ padding: 20 }}
                    data={Object.entries(prayersTimes)}
                    keyExtractor={([name]) => name}
                    renderItem={({ item: [name, time] }) => (
                        <View style={styles.row}>
                            <Text style={{ ...styles.prayer, color: theme.primaryText }}>
                                {tr(`prayers.${name}`)}
                            </Text>
                            <Text style={{ ...styles.time, color: theme.primaryText }}>{time}</Text>
                        </View>
                    )}
                />

                {/* Just for Testing... */}
                {/* <Button title="Send Test Notification" onPress={sendTestNotification} /> */}
                {/* <Button title="Log Scheduled Notifications" onPress={logScheduledNotifications} /> */}

            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    date: {
        fontSize: 20,
        color: "#000",
        marginTop: 100,
        marginBottom: 38,
    },
    countdown: {
        fontSize: 26,
        fontWeight: "500",
        marginBottom: 30,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
    },
    prayer: {
        fontSize: 18,
    },
    time: {
        fontSize: 18,
        fontWeight: "700",
    },
    warningBox: {
        padding: 8,
        backgroundColor: "#fdecea",
        borderWidth: 1,
        borderColor: "#f5c2c7",
        borderRadius: 4
    },
    warningText: {
        color: "#856404",
        textAlign: "center",
        fontWeight: "500",
    },

    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        padding: 20,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    locationText: {
        fontSize: 16,
        color: 'white',
        opacity: 0.8,
        marginTop: 5,
    },
    listContainer: {
        padding: 10,
    },
    prayerTime: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
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
        margin: 20,
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