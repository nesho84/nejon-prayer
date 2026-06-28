import AppCard from "@/components/AppCard";
import AppLoading from "@/components/AppLoading";
import ModalSheet, { ModalSheetRef } from "@/components/ModalSheet";
import PrayerIcon from "@/components/PrayerIcon";
import { globalStyles } from "@/constants/styles";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { usePrayersStore } from "@/store/prayersStore";
import { usePrayersTrackingStore } from "@/store/prayersTrackingStore";
import { useThemeStore } from "@/store/themeStore";
import { MAIN_PRAYERS, PrayerName, PrayerTimeEntry, PrayerTimes } from "@/types/prayer.types";
import { isTimePast, toDateKey } from "@/utils/datetime";
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrayersSettingsScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const location = useLocationStore((state) => state.location);
    const timeZone = useLocationStore((state) => state.timeZone);
    const tracking = usePrayersTrackingStore((state) => state.tracking);
    const markPrayed = usePrayersTrackingStore((state) => state.markPrayed);
    const unmarkPrayed = usePrayersTrackingStore((state) => state.unmarkPrayed);

    // Route params — optional date from calendar tap
    const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

    // Local state
    const [selectedDate, setSelectedDate] = useState(() => {
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            const [y, m, d] = dateParam.split('-').map(Number);
            return new Date(y, m - 1, d);
        }
        return new Date();
    });
    const [prayerTimesByDate, setPrayerTimesByDate] = useState<PrayerTimes | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Refs
    const ModalSheetRef = useRef<ModalSheetRef>(null);

    // Derived date info
    const selectedDateKey = toDateKey(selectedDate);
    const todayKey = toDateKey();
    const isSelectedPastDay = selectedDateKey < todayKey;
    const isSelectedToday = selectedDateKey === todayKey;

    // Edge case checks for year boundaries (for better UX when navigating with arrows)
    const isFirstDayOfYear = selectedDate.getMonth() === 0 && selectedDate.getDate() === 1;
    const isLastDayOfYear = selectedDate.getMonth() === 11 && selectedDate.getDate() === 31;

    // ------------------------------------------------------------
    // Get yearly prayer times from prayers store for the selected date
    // ------------------------------------------------------------
    const getPrayerTimesForDate = async (date: Date) => {
        if (!location) return;

        setIsLoading(true);
        try {
            const dateKey = toDateKey(date);

            // Simulate a short random loading delay for better UX
            const randomDelay = Math.floor(Math.random() * 5) * 100; // 0-400ms
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
            // Intentional: refetch prayer times when the selected date/location changes.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            getPrayerTimesForDate(selectedDate);
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
    const onDateChange = (event: DateTimePickerChangeEvent, date?: Date) => {
        if (!date) return;

        // Android: always close the modal dialog immediately
        if (Platform.OS === 'android') setShowDatePicker(false);

        // Only update if the date actually changed
        if (
            date.getFullYear() !== selectedDate.getFullYear() ||
            date.getMonth() !== selectedDate.getMonth() ||
            date.getDate() !== selectedDate.getDate()
        ) {
            setSelectedDate(date);
        }

        // iOS: close only after a valid date is confirmed
        if (Platform.OS === 'ios') setShowDatePicker(false);
    };

    // ------------------------------------------------------------
    // Check if selected date is today
    // ------------------------------------------------------------
    const isToday = () => isSelectedToday;

    // ------------------------------------------------------------
    // Handle marking/unmarking prayers as prayed
    // ------------------------------------------------------------
    const handleMark = useCallback(async (prayerName: PrayerName, isPrayed: boolean, isPast: boolean) => {
        if (!isPast) return;

        isPrayed
            ? unmarkPrayed(prayerName as PrayerName, selectedDateKey)
            : await markPrayed(prayerName as PrayerName, selectedDateKey);
    }, [markPrayed, unmarkPrayed, selectedDateKey]);

    // ------------------------------------------------------------
    // Handle close
    // ------------------------------------------------------------
    const handleClose = () => {
        ModalSheetRef.current?.close();
    }

    // ------------------------------------------------------------
    // Compute prayer entries (cleaner approach)
    // ------------------------------------------------------------
    const prayerEntries = prayerTimesByDate
        ? (Object.entries(prayerTimesByDate) as PrayerTimeEntry[])
        : [];

    // Fixed Footer with Cancel/Today buttons — a plain element, not a component
    // declared in render (avoids re-creating a component type every render)
    const fixedFooter = (
        <View style={[globalStyles.modalFooter, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
            {/* Cancel Button */}
            <TouchableOpacity style={globalStyles.modalButton} onPress={handleClose}>
                <Text style={[globalStyles.modalButtonText, { color: theme.text2 }]}>
                    {tr.buttons.cancel}
                </Text>
            </TouchableOpacity>
            {/* Action Button */}
            <TouchableOpacity
                style={[
                    globalStyles.modalButton,
                    { backgroundColor: theme.overlay, opacity: isToday() ? 0.6 : 1 }
                ]}
                onPress={() => setSelectedDate(new Date())}
                disabled={isToday()}
            >
                <Ionicons name="today" size={16} color={isToday() ? theme.placeholder : theme.accent} />
                <Text style={[globalStyles.modalButtonText, { color: isToday() ? theme.placeholder : theme.accent }]}>
                    {tr.buttons.today}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Main Content
    return (
        <ModalSheet
            ref={ModalSheetRef}
            size="xxl"
            colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}
            footer={fixedFooter}
        >

            <View style={globalStyles.modalContainer}>
                {/* Prayer Times Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerTitle, { color: theme.accent }]}>
                        {tr.labels.calendarTitle}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
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
                                backgroundColor: theme.overlayLight,
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
                                minimumDate={new Date(new Date().getFullYear(), 0, 1)}
                                maximumDate={new Date(new Date().getFullYear(), 11, 31)}
                                onValueChange={onDateChange}
                                onDismiss={() => setShowDatePicker(false)}
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
                <AppCard style={styles.prayersListContainer}>
                    {/* Location & Timezone */}
                    <View style={[styles.prayersListHeader, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                        <View style={styles.locationInfoRow}>
                            <Ionicons name="globe-outline" size={17} color={theme.accent} style={{ marginLeft: -10 }} />
                            <Text style={[styles.locationInfoText, { color: theme.text2 }]} numberOfLines={1} ellipsizeMode="tail">
                                {timeZone?.location || ""}
                            </Text>
                        </View>
                        <Text style={[styles.timezoneInfoText, { color: theme.text2 }]}>
                            {timeZone?.zoneName || ""} • {timeZone?.offset || ""}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={[globalStyles.fullDivider, { backgroundColor: theme.divider2 }]} />

                    {/* Prayers List */}
                    <View style={styles.prayersRowContainer}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <AppLoading inline={true} text={tr.labels.loading} style={{ backgroundColor: 'transparent' }} />
                            </View>
                        ) : prayerEntries.length > 0 ? (
                            prayerEntries.map(([prayerName, prayerTime], index) => {
                                const isLast = index === prayerEntries.length - 1;
                                const isTrackable = MAIN_PRAYERS.includes(prayerName as PrayerName);
                                const isPast = isTrackable && (isSelectedPastDay || (isSelectedToday && isTimePast(prayerTime)));
                                const isPrayed = isTrackable && tracking[selectedDateKey]?.[prayerName as PrayerName] === 'prayed';

                                return (
                                    <View key={prayerName}>
                                        {/* Mark/unmark area (trackable) or plain view (non-trackable) */}
                                        <View style={styles.prayerRow}>
                                            {isTrackable ? (
                                                <TouchableOpacity
                                                    style={styles.prayerRowLeft}
                                                    activeOpacity={0.3}
                                                    delayPressIn={0}
                                                    delayPressOut={0}
                                                    hitSlop={8}
                                                    onPress={() => {
                                                        handleMark(prayerName as PrayerName, isPrayed, isPast);
                                                    }}
                                                >
                                                    {/* Left: Tracking circle */}
                                                    <Ionicons
                                                        name={isPrayed ? 'checkmark-circle' : 'ellipse-outline'}
                                                        size={21}
                                                        color={isPrayed ? theme.islamicGreen : theme.text2}
                                                        style={{ opacity: isPrayed ? 0.8 : 0.4 }}
                                                    />
                                                    {/* Prayer Name Text */}
                                                    <Text style={[styles.prayerNameText, { color: theme.text }]}>
                                                        {tr.prayers[prayerName] || prayerName}
                                                    </Text>
                                                    {/* Prayer Name Icon */}
                                                    <PrayerIcon name={prayerName} size={18} color={theme.text2} opacity={0.7} />
                                                    {/* Horizontal Spacer */}
                                                    <View style={{ flex: 1 }} />
                                                    {/* Prayer Time */}
                                                    <Text style={[styles.prayerTimeText, { color: theme.text }]}>
                                                        {prayerTime}
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={[styles.prayerRowLeft, { opacity: 0.4 }]}>
                                                    {/* Left: Dash placeholder */}
                                                    <Ionicons name="remove" size={21} color={theme.placeholder} />
                                                    {/* Prayer Name Text */}
                                                    <Text style={[styles.prayerNameText, { color: theme.text2 }]}>
                                                        {tr.prayers[prayerName] || prayerName}
                                                    </Text>
                                                    {/* Prayer Name Icon */}
                                                    <PrayerIcon name={prayerName} size={18} color={theme.text2} />
                                                    {/* Horizontal Spacer */}
                                                    <View style={{ flex: 1 }} />
                                                    {/* Prayer Time */}
                                                    <Text style={[styles.prayerTimeText, { color: theme.text2 }]}>{prayerTime}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Prayer Divider */}
                                        {!isLast && (
                                            <View style={[styles.prayerDivider, { backgroundColor: theme.borderCard }]} />
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
                                    style={[globalStyles.modalButton, { backgroundColor: theme.overlay, marginTop: 8 }]}
                                    onPress={() => getPrayerTimesForDate(selectedDate)}
                                >
                                    <Ionicons name="refresh" size={18} color={theme.text} />
                                    <Text style={[globalStyles.modalButtonText, { color: theme.text }]}>
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

    // Prayers List Card
    prayersListContainer: {
        overflow: 'hidden',
    },
    // Prayer List - Header
    prayersListHeader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    locationInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        gap: 8,
    },
    locationInfoText: {
        fontSize: 17,
        fontWeight: '500',
        includeFontPadding: false,
    },
    timezoneInfoText: {
        fontSize: 13,
        opacity: 0.7,
    },

    // Prayers List
    prayersRowContainer: {
        paddingTop: 5,
        paddingBottom: 14,
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    prayerRowLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 16,
        gap: 10,
    },
    prayerNameText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
    },
    prayerTimeText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 4,
        letterSpacing: 0.5,
    },
    prayerDivider: {
        height: 1,
        marginHorizontal: 14,
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
});