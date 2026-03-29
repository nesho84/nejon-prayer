import AppCard from "@/components/AppCard";
import AppLoading from "@/components/AppLoading";
import ModalSheet, { ModalSheetRef } from "@/components/ModalSheet";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { usePrayersStore } from "@/store/prayersStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerTimeEntry, PrayerTimes } from "@/types/prayer.types";
import { IconProps } from "@/types/types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrayersSettingsScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);

    // Local state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [prayerTimesByDate, setPrayerTimesByDate] = useState<PrayerTimes | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Refs
    const ModalSheetRef = useRef<ModalSheetRef>(null);

    // Edge case checks for year boundaries (for better UX when navigating with arrows)
    const isFirstDayOfYear = selectedDate.getMonth() === 0 && selectedDate.getDate() === 1;
    const isLastDayOfYear = selectedDate.getMonth() === 11 && selectedDate.getDate() === 31;

    // ------------------------------------------------------------
    // Get yearly prayer times from prayers store for the selected date
    // ------------------------------------------------------------
    const fetchPrayerTimesForDate = async (date: Date) => {
        if (!location) return;

        setIsLoading(true);
        try {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            const dateKey = `${y}-${m}-${d}`;

            // Simulate a short random loading delay for better UX (0, 100, ..., 800 ms)
            const randomDelay = Math.floor(Math.random() * 9) * 100;
            // console.log(randomDelay);
            await new Promise((resolve) => setTimeout(resolve, randomDelay));

            const times = await usePrayersStore.getState().getPrayerTimesForDate(dateKey);
            setPrayerTimesByDate(times);
        } catch (err) {
            console.warn("⚠️ [prayerTimings] Failed to get prayer times:", err);
            setPrayerTimesByDate(null);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------
    // When date changes (arrows or picker)
    // ------------------------------------------------------------
    useEffect(() => {
        if (location) {
            fetchPrayerTimesForDate(selectedDate);
        }
    }, [selectedDate, location]);

    // ------------------------------------------------------------
    // Change date by offset
    // ------------------------------------------------------------
    const changeDate = (dayOffset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + dayOffset);

        if (newDate.getFullYear() !== new Date().getFullYear()) return;

        setSelectedDate(newDate);
    };

    // ------------------------------------------------------------
    // Handle date picker change
    // ------------------------------------------------------------
    const onDateChange = (event: any, date?: Date) => {
        // Android: always close the modal dialog immediately
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (event.type === 'dismissed' || !date) return;

        // Only update if the date actually changed
        if (
            date.getFullYear() !== selectedDate.getFullYear() ||
            date.getMonth() !== selectedDate.getMonth() ||
            date.getDate() !== selectedDate.getDate()
        ) {
            setSelectedDate(date);
        }

        // iOS: close only after a valid date is confirmed
        if (Platform.OS === 'ios') {
            setShowDatePicker(false);
        }
    };

    // ------------------------------------------------------------
    // Check if selected date is today
    // ------------------------------------------------------------
    const isToday = () => {
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    };

    // ------------------------------------------------------------
    // Handle close
    // ------------------------------------------------------------
    const handleClose = () => {
        ModalSheetRef.current?.close();
    }

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
    // Compute prayer entries (cleaner approach)
    // ------------------------------------------------------------
    const prayerEntries = prayerTimesByDate
        ? (Object.entries(prayerTimesByDate) as PrayerTimeEntry[])
        : [];

    // Fixed Footer with Close/Today buttons
    const FixedFooter = () => {
        return (
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                >
                    <Text style={[styles.buttonText, { color: theme.text2 }]}>
                        {tr.buttons.cancel}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.todayButton,
                        { backgroundColor: isToday() ? theme.overlay : theme.accent2 }
                    ]}
                    onPress={() => setSelectedDate(new Date())}
                    disabled={isToday()}
                >
                    <Ionicons name="today" size={20} color={isToday() ? theme.placeholder : theme.text} />
                    <Text style={[styles.buttonText, { color: isToday() ? theme.placeholder : theme.text }]}>
                        {tr.buttons.today}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Main Content
    return (
        <ModalSheet
            ref={ModalSheetRef}
            size="xlx"
            colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}
            footer={<FixedFooter />}
        >

            <View style={styles.container}>
                {/* Prayer Times Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerTitle, { color: theme.accent }]}>
                        {tr.labels.calendarTitle}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text2, opacity: 0.7 }]}>
                        {tr.labels.calendarSubtitle}
                    </Text>
                </View>

                {/* DATE PICKER CARD */}
                <AppCard>
                    <View style={styles.datePickerContainer}>
                        {/* Left Arrow */}
                        <TouchableOpacity
                            onPress={() => changeDate(-1)}
                            style={styles.arrowButton}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="chevron-back" size={28} color={isFirstDayOfYear ? theme.placeholder : theme.accent} />
                        </TouchableOpacity>

                        {/* Date Input (tap for calendar picker) */}
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.dateInput, {
                                backgroundColor: theme.overlay,
                                borderColor: theme.divider
                            }]}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.accent} />
                            <Text style={[styles.dateInputText, { color: theme.text }]}>
                                {selectedDate.toLocaleDateString(tr.labels.localeDate, {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase())}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={theme.text2} />
                        </TouchableOpacity>

                        {/* DATE PICKER */}
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                minimumDate={new Date(new Date().getFullYear(), 0, 1)}
                                maximumDate={new Date(new Date().getFullYear(), 11, 31)}
                            />
                        )}

                        {/* Right Arrow */}
                        <TouchableOpacity
                            onPress={() => changeDate(1)}
                            style={styles.arrowButton}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="chevron-forward" size={28} color={isLastDayOfYear ? theme.placeholder : theme.accent} />
                        </TouchableOpacity>
                    </View>
                </AppCard>

                {/* PRAYER TIMES CARD */}
                <AppCard style={styles.prayersCard}>
                    {/* Timezone Container */}
                    <View style={styles.timezoneContainer}>
                        <View style={styles.timezoneInfo}>
                            <Ionicons name="globe-outline" size={17} color={theme.text2} style={{ marginTop: 2 }} />
                            <Text style={[styles.timezoneTitle, { color: theme.text2 }]}>
                                {timeZone?.location || ""}
                            </Text>
                        </View>
                        <Text style={[styles.timezoneSubtitle, { color: theme.text2 }]}>
                            {timeZone?.zoneName || ""} • {timeZone?.offset || ""}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={[styles.fullDivider, { backgroundColor: theme.divider }]} />

                    {/* Prayers List */}
                    <View style={styles.prayersRowContainer}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <AppLoading inline={true} text={tr.labels.loading} style={{ backgroundColor: 'transparent' }} />
                            </View>
                        ) : prayerEntries.length > 0 ? (
                            prayerEntries.map(([prayerName, prayerTime], index) => {
                                const isLast = index === prayerEntries.length - 1;
                                const NameIcon = handlePrayerNameIcon(prayerName);

                                return (
                                    <View key={prayerName}>
                                        {/* Prayer row */}
                                        <View style={styles.prayerRow}>
                                            {/* Prayer Name */}
                                            <View style={styles.prayerNameSection}>
                                                <NameIcon size={22} color={theme.text2} />
                                                <Text style={[styles.prayerNameText, { color: theme.text }]}>
                                                    {tr.prayers[prayerName] || prayerName}
                                                </Text>
                                            </View>

                                            {/* Prayer Time */}
                                            <View style={styles.prayerTimeSection}>
                                                <Text style={[styles.prayerTimeText, { color: theme.text }]}>
                                                    {prayerTime}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Prayer Divider */}
                                        {!isLast && (
                                            <View style={[styles.prayerDivider, { backgroundColor: theme.divider2 }]} />
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.noDataContainer}>
                                <Ionicons name="calendar-outline" size={48} color={theme.text2} />
                                <Text style={[styles.noDataText, { color: theme.text2 }]}>
                                    {tr.labels.prayersError}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.overlay, marginTop: 8 }]}
                                    onPress={() => fetchPrayerTimesForDate(selectedDate)}
                                >
                                    <Ionicons name="refresh" size={18} color={theme.text} />
                                    <Text style={[styles.buttonText, { color: theme.text }]}>
                                        {tr.buttons.retry || "Retry"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </AppCard>
            </View>

        </ModalSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 8,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 14,
    },

    // Header styles
    headerContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 6,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },

    // Date Picker Card
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 10,
    },
    arrowButton: {
        padding: 8,
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    dateInputText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Prayers Card
    prayersCard: {
        overflow: 'hidden',
    },
    timezoneContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    timezoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        gap: 8,
    },
    timezoneTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    timezoneSubtitle: {
        fontSize: 13,
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
        paddingHorizontal: 16,
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

    // Loading State
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 12,
    },

    // No Data State
    noDataContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 16,
    },
    noDataText: {
        fontSize: 14,
        textAlign: 'center',
    },

    // Footer styles
    footer: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: 6,
        gap: 6,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
    },
    todayButton: {},
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});