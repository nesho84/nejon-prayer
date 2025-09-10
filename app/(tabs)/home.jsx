import { useLanguage } from "@/context/LanguageContext";
import { fetchPrayerTimes } from "@/hooks/api";
import { loadSettings } from "@/hooks/storage";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import useTheme from "@/hooks/useTheme";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Home() {
    const { theme } = useTheme();
    // LanguageContext
    const { lang } = useLanguage();
    const isFocused = useIsFocused();
    const intervalRef = useRef(null);
    const { scheduleDailyPrayerNotifications, sendTestNotification, logScheduledNotifications } = usePrayerNotifications();

    const [warning, setWarning] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState(null);
    const [countdown, setCountdown] = useState("");
    const [fetchError, setFetchError] = useState(false);

    // On mount: load settings, fetch prayer times, schedule notifications, start interval to update next prayer
    useEffect(() => {
        // fetch once immediately
        loadPrayerTimes();

        const interval = setInterval(() => {
            if (intervalRef.current) updateNextPrayer(intervalRef.current);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Load prayer times
    const loadPrayerTimes = async () => {
        setFetchError(false);

        const saved = await loadSettings();
        if (!saved || !saved.coords) return;

        try {
            const times = await fetchPrayerTimes(saved.coords.latitude, saved.coords.longitude);
            if (!times) {
                console.log("Failed to fetch prayer times or no data returned");

                setFetchError(true);
                return;
            }

            setPrayerTimes(times);
            intervalRef.current = times;

            if (saved.notifications) await scheduleDailyPrayerNotifications(times);

            updateNextPrayer(times);
        } catch (err) {
            console.error("Failed fetching prayer times:", err);
            setFetchError(true);
        }
    };

    // On Screen focus: reload settings to update warnings
    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (!saved) return;

            // set warning based on explicit boolean values
            if (!saved?.coords && !saved?.notifications) {
                setWarning(lang("labels.warning1"));
            } else if (!saved?.coords) {
                setWarning(lang("labels.warning2"));
            } else if (!saved?.notifications) {
                setWarning(lang("labels.warning3"));
            } else {
                setWarning(null);
            }
        })();
    }, [isFocused]);

    // Update next prayer and countdown
    function updateNextPrayer(times) {
        if (!times) return;

        const now = new Date();
        let upcomingTime = nextPrayerTime; // local copy for countdown

        // Only recalc nextPrayer if it's null or has passed
        if (!nextPrayerTime || nextPrayerTime <= now) {
            let upcoming = null;

            Object.entries(times).forEach(([name, time]) => {
                const [hour, minute] = time.split(":").map((x) => parseInt(x, 10));
                const prayerDate = new Date();
                prayerDate.setHours(hour, minute, 0, 0);

                if (prayerDate > now && !upcoming) {
                    upcoming = { name, time: prayerDate };
                }
            });

            if (!upcoming) {
                // No more prayers today → use tomorrow's Fajr
                const fajrTime = times["Fajr"];
                if (fajrTime) {
                    const [hour, minute] = fajrTime.split(":").map(x => parseInt(x, 10));
                    const tomorrowFajr = new Date();
                    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
                    tomorrowFajr.setHours(hour, minute, 0, 0);
                    upcoming = { name: "Fajr", time: tomorrowFajr };
                }
            }
            if (upcoming) {
                setNextPrayer(upcoming.name);
                setNextPrayerTime(upcoming.time);
                upcomingTime = upcoming.time;
            } else {
                setNextPrayer(null);
                setNextPrayerTime(null);
                upcomingTime = null;
            }
        }
        if (upcomingTime) {
            const diff = upcomingTime - now;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
            setCountdown("No more prayers today");
        }
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
                <Text style={{ ...styles.date, color: theme.primaryText }}>{new Date().toDateString()}</Text>

                {/* Next prayer countdown */}
                {nextPrayer && (
                    <Text style={{ ...styles.countdown, color: theme.secondaryText }}>
                        {countdown} » {nextPrayer ? lang(`prayers.${nextPrayer}`) : ""}
                    </Text>
                )}

                {/* Prayer times list */}
                {fetchError ? (
                    <View style={{ marginTop: 20, alignItems: "center" }}>
                        <Text style={{ color: theme.primaryText, fontSize: 16, textAlign: "center", marginBottom: 16 }}>
                            {lang("labels.noPrayerTimes")}
                        </Text>
                        <Button title={lang("labels.retryFetch")} onPress={loadPrayerTimes} />
                    </View>
                ) : prayerTimes ? (
                    <FlatList
                        contentContainerStyle={{ padding: 20 }}
                        data={Object.entries(prayerTimes)}
                        keyExtractor={([name]) => name}
                        renderItem={({ item: [name, time] }) => (
                            <View style={styles.row}>
                                <Text style={{ ...styles.prayer, color: theme.primaryText }}>
                                    {lang(`prayers.${name}`)}
                                </Text>
                                <Text style={{ ...styles.time, color: theme.primaryText }}>{time}</Text>
                            </View>
                        )}
                    />
                ) : (
                    <Text style={{ color: theme.primaryText, fontSize: 16, marginTop: 20 }}>
                        {lang("labels.loading")}
                    </Text>
                )}

                {/* <Button title="Log Scheduled Notifications" onPress={logScheduledNotifications} /> */}

                {/* <Button title="Send Test Notification" onPress={sendTestNotification} /> */}

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
});