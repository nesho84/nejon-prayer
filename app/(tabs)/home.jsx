import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { loadSettings } from "@/hooks/storage";
import usePrayerNotifications from "@/hooks/usePrayerNotifications";
import usePrayerService from "@/hooks/usePrayerService";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
    // ThemeContext
    const { theme } = useTheme();
    // LanguageContext
    const { lang, currentLang } = useLanguage();

    // Notifications hook
    const {
        schedulePrayerNotifications,
        sendTestNotification,
        logScheduledNotifications
    } = usePrayerNotifications();

    const isFocused = useIsFocused();

    const [warning, setWarning] = useState(null);
    const [coords, setCoords] = useState(null);

    // Load coords once from saved settings
    useEffect(() => {
        (async () => {
            const saved = await loadSettings();
            if (saved?.coords) {
                setCoords(saved.coords);
            }
        })();
    }, []);

    // Prayer times hook for prayer times + next prayer countdown
    const {
        loadPrayerTimes,
        prayerTimes,
        nextPrayerName,
        nextPrayerTime,
        prayerCountdown,
        loading,
        timesError
    } = usePrayerService(coords?.latitude, coords?.longitude);

    // Schedule notifications when prayer times are ready
    useEffect(() => {
        if (prayerTimes) {
            schedulePrayerNotifications(prayerTimes);
        }
    }, [prayerTimes]);

    // Update warnings when screen is focused
    useEffect(() => {
        (async () => {
            // re-read storage on screen focus
            const saved = await loadSettings();
            setCoords(saved?.coords ?? null);

            // update warnings immediately
            if (!saved?.coords && !saved?.notifications) {
                setWarning(lang.tr("labels.warning1"));
            } else if (!saved?.coords) {
                setWarning(lang.tr("labels.warning2"));
            } else if (!saved?.notifications) {
                setWarning(lang.tr("labels.warning3"));
            } else {
                setWarning(null);
            }
        })();
    }, [isFocused]);

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
                {nextPrayerName && (
                    <Text style={{ ...styles.countdown, color: theme.secondaryText }}>
                        {prayerCountdown} » {nextPrayerName ? lang.tr(`prayers.${nextPrayerName}`) : ""}
                    </Text>
                )}

                {loading ? (
                    /* Loading text */
                    <Text style={{ color: "#a78d8dff", fontSize: 20, marginVertical: 20 }}>{lang.tr("labels.loading")}</Text>
                ) : timesError ? (
                    /* Prayer times error and retry */
                    <View style={{ marginTop: 20, alignItems: "center" }}>
                        <Text style={{ color: theme.primaryText, fontSize: 16, textAlign: "center", marginBottom: 16 }}>
                            {lang.tr("labels.noPrayerTimes")}
                        </Text>
                        <Button title={lang.tr("labels.retryFetch")} onPress={loadPrayerTimes} />
                    </View>
                ) : (
                    /* Prayer times list */
                    <FlatList
                        contentContainerStyle={{ padding: 20 }}
                        data={Object.entries(prayerTimes)}
                        keyExtractor={([name]) => name}
                        renderItem={({ item: [name, time] }) => (
                            <View style={styles.row}>
                                <Text style={{ ...styles.prayer, color: theme.primaryText }}>
                                    {lang.tr(`prayers.${name}`)}
                                </Text>
                                <Text style={{ ...styles.time, color: theme.primaryText }}>{time}</Text>
                            </View>
                        )}
                    />
                )}

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
});