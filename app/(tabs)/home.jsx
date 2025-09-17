import LoadingScreen from "@/components/LoadingScreen";
import { usePrayersContext } from '@/contexts/PrayersContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useThemeContext } from "@/contexts/ThemeContext";
import useNextPrayer from "@/hooks/useNextPrayer";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import useTranslation from "@/hooks/useTranslation";
import { formatLocation, formatTimezone } from "@/utils/timeZone";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    const { theme } = useThemeContext();
    const { tr } = useTranslation();
    const { settings, settingsLoading, settingsError } = useSettingsContext();
    const { prayersTimes, prayersLoading, prayersError, refetchPrayersTimes, hasPrayersTimes } = usePrayersContext();
    const { nextPrayerName, prayerCountdown } = useNextPrayer(prayersTimes);
    const { schedulePrayerNotifications, sendTestNotification, logScheduledNotifications } = usePrayerNotifications();

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
        if (hasPrayersTimes && settings?.notifications) {
            schedulePrayerNotifications(prayersTimes);
        }
    }, [hasPrayersTimes, settings?.notifications]);

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

    // -------------------------------------------------------
    // Format location and timezone when location is available
    // --------------------------------------------------------
    useEffect(() => {
        if (!settings?.location || settingsLoading) {
            return;
        }

        (async () => {
            try {
                // Full human-readable string
                if (!hasPrayersTimes) {
                    const formatedAddress = await formatLocation(settings.location);
                    if (formatedAddress) {
                        setFullAddress(formatedAddress);
                    }
                }
                // User formatted timezone
                const formatedTimezone = await formatTimezone(settings.location);
                if (formatedTimezone) {
                    setTimezone(formatedTimezone);
                }
            } catch (error) {
                console.warn("Location formatting error:", error);
                // Set fallback for timezone so UI doesn't break
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
        // return <LoadingScreen message={tr("labels.loading")} />
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
                    {settingsError || prayersError}
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

                {/* Prayer times list  */}
                <FlatList
                    data={Object.entries(prayersTimes)}
                    keyExtractor={([name]) => name}
                    renderItem={({ item: [name, time] }) => (
                        <View style={styles.listContainer}>
                            <Text style={[styles.prayerName, { color: theme.primaryText }]}>
                                {tr(`prayers.${name}`)}
                            </Text>
                            <Text style={[styles.prayerTime, { color: theme.primaryText }]}>{time}</Text>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl refreshing={prayersLoading} onRefresh={handleRefresh} />
                    }
                    contentContainerStyle={{ padding: 20 }}
                    // Safety props for FlatList
                    removeClippedSubviews={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    // Handle empty data gracefully
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                                {tr("labels.noPrayerData") || "No prayer data available"}
                            </Text>
                        </View>
                    }
                />

                {/* Just for Testing... */}
                {/* <Button title="Send Test Notification" onPress={sendTestNotification} /> */}
                {/* <Button title="Log Scheduled Notifications" onPress={logScheduledNotifications} /> */}

            </View >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        padding: 8,
        alignItems: "center",
        justifyContent: "center",
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
        marginTop: 60,
        marginBottom: 30,
    },
    timeZoneTitle: {
        fontSize: 23,
        marginBottom: 6,
    },
    timeZoneSubTitle: {
        fontSize: 15,
        fontWeight: "300",
        color: '#666',
        marginBottom: 5,
    },
    timeZoneDate: {
        fontSize: 16,
        fontWeight: "500",
        color: '#666',
    },
    countdown: {
        fontSize: 26,
        fontWeight: "500",
        marginTop: 30,
        marginBottom: 45,
    },
    listContainer: {
        backgroundColor: "red",
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
        width: "100%",
        paddingVertical: 10,
    },
    prayerName: {
        fontSize: 18,
    },
    prayerTime: {
        fontSize: 18,
        fontWeight: "700",
    },
    warningBox: {
        padding: 8,
        backgroundColor: "#fdecea",
        borderWidth: 1,
        borderColor: "#f5c2c7",
        borderRadius: 4,
        marginVertical: 6,
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