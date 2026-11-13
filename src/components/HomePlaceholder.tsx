import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import AppWarningStrip from "@/components/AppWarningStrip";
import HolidaysCard from "@/components/HolidaysCard";
import PrayerProgressCard from "@/components/PrayerProgressCard";
import PrayerRow from "@/components/PrayerRow";
import QuotesCarouselCard from "@/components/QuotesCarouselCard";
import QuranPlaying from "@/components/QuranPlaying";
import { globalStyles } from "@/constants/styles";
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { usePrayersStore } from "@/store/prayersStore";
import { useThemeStore } from "@/store/themeStore";
import { ALL_PRAYERS, MAIN_PRAYERS } from "@/types/prayer.types";
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

// Same ring as the HomeScreen countdown
const RING_SIZE = 155;
const RING_STROKE = 6;
// Placeholder for every missing time (ring + rows)
const EMPTY_TIME = "--:--";

// HomeScreen stand-in while there are no prayer times (offline / no location) —
// same layout, prayer actions disabled
export default function HomePlaceholder() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const tr = useLanguageStore((state) => state.tr);
    const internetConnection = useDeviceSettingsStore((state) => state.internetConnection);
    const location = useLocationStore((state) => state.location);
    const fullAddress = useLocationStore((state) => state.fullAddress);
    const timeZone = useLocationStore((state) => state.timeZone);
    const prayersError = usePrayersStore((state) => state.prayersError);

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 4;
    const bottomInset = insets.bottom + 12;

    // Both available but still no data → show the real error
    const stripText = location && internetConnection ? (prayersError || tr.labels.prayersError) : tr.labels.turnOnLocationInternet;

    // Today (e.g. "Friday, 13 November 2026") — same format as the HomeScreen header
    const formattedDate = new Date().toLocaleDateString(tr.labels.localeDate, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).replace(/^\p{L}|\s\p{L}/gu, c => c.toUpperCase());

    const handleRetry = () => usePrayersStore.getState().retryPrayerTimes();

    return (
        <AppLayout>
            <ScrollView
                style={[globalStyles.scrollContainer, { backgroundColor: theme.bg }]}
                contentContainerStyle={[globalStyles.scrollContent, { paddingTop: topInset, paddingBottom: bottomInset }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    // HomeScreen swaps to AppLoading while loading, so this never shows as refreshing
                    <RefreshControl refreshing={false} onRefresh={handleRetry} tintColor={theme.accent} colors={[theme.accent]} />
                }
            >
                {/* 1. Empty countdown ring */}
                <AppCard>
                    <View style={styles.ringRow}>
                        {/* Left: previous prayer */}
                        <View style={styles.sideColumn}>
                            <MaterialDesignIcons name="clock-outline" size={21} color={theme.accent} style={styles.sideIcon} />
                            <Text style={[styles.sideLabel, { color: theme.text2 }]}>—</Text>
                            <Text style={[styles.sideTime, { color: theme.text2 }]}>{EMPTY_TIME}</Text>
                        </View>

                        {/* Center: empty circle */}
                        <View style={[styles.circleWrapper, { width: RING_SIZE, height: RING_SIZE }]}>
                            <Svg width={RING_SIZE} height={RING_SIZE}>
                                <Circle
                                    stroke={theme.border}
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={(RING_SIZE - RING_STROKE) / 2}
                                    strokeWidth={RING_STROKE}
                                    fill="transparent"
                                />
                            </Svg>
                            <View style={styles.ringIcon}>
                                <MaterialDesignIcons name="clock-outline" size={21} color={theme.accent} style={styles.ringIconOpacity} />
                            </View>
                            <View style={styles.ringInner}>
                                <Text style={[styles.ringName, { color: theme.textMuted }]}>» — «</Text>
                                <Text style={[styles.ringTime, { color: theme.placeholder }]}>{EMPTY_TIME}</Text>
                            </View>
                        </View>

                        {/* Right: after-next prayer */}
                        <View style={styles.sideColumn}>
                            <MaterialDesignIcons name="clock-outline" size={21} color={theme.accent} style={styles.sideIcon} />
                            <Text style={[styles.sideLabel, { color: theme.text2 }]}>—</Text>
                            <Text style={[styles.sideTime, { color: theme.text2 }]}>{EMPTY_TIME}</Text>
                        </View>
                    </View>
                </AppCard>

                {/* 2–4. Offline-capable cards */}
                <QuotesCarouselCard />
                <HolidaysCard />
                <QuranPlaying />

                {/* 5. Prayers card */}
                <AppCard style={styles.prayersListContainer}>
                    {/* Date header — same as the HomeScreen (the modal handles missing data) */}
                    <TouchableOpacity
                        style={[styles.prayersListHeader, { backgroundColor: 'rgba(0,0,0,0.02)' }]}
                        delayPressIn={0}
                        delayPressOut={0}
                        activeOpacity={0.3}
                        onPress={() => router.navigate('/(modals)/prayerTimings')}
                    >
                        {/* Left: Calendar icon */}
                        <View style={styles.calendarLeftIcon}>
                            <Ionicons name="calendar-outline" size={22} color={theme.text} style={{ opacity: 0.6 }} />
                        </View>
                        {/* Center: Date & Location/Timezone */}
                        <View style={styles.dateLocationRow}>
                            <Text style={[styles.dateInfoText, { color: theme.text2, opacity: 0.88 }]}>
                                {formattedDate}
                            </Text>
                            <View style={styles.locationInfoRow}>
                                <Ionicons name="navigate-circle-outline" size={14} color={theme.accent} style={{ marginLeft: -4, marginTop: 0.8 }} />
                                <Text style={[styles.locationInfoText, { color: theme.text2 }]} numberOfLines={1} ellipsizeMode="tail">
                                    {timeZone?.location || fullAddress || tr.labels.locationUnknown}
                                </Text>
                            </View>
                        </View>
                        {/* Right: Chevron icon */}
                        <View style={styles.chevronRightIcon}>
                            <Ionicons name="chevron-forward" size={22} color={theme.text} style={{ opacity: 0.5 }} />
                        </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={[globalStyles.fullDivider, { backgroundColor: theme.divider2 }]} />

                    {/* Status strip — what's missing + retry */}
                    <AppWarningStrip
                        title={tr.labels.prayersNotDownloaded}
                        text={stripText}
                        chips={[
                            {
                                icon: location ? "map-marker-outline" : "map-marker-off-outline",
                                label: location ? tr.labels.chipLocationOn : tr.labels.chipLocationOff,
                                ok: !!location,
                            },
                            {
                                icon: internetConnection ? "wifi" : "wifi-off",
                                label: internetConnection ? tr.labels.chipOnline : tr.labels.chipOffline,
                                ok: internetConnection,
                            },
                        ]}
                        buttonText={tr.buttons.retry}
                        buttonIcon={<Ionicons name="refresh" size={18} color={theme.accent2} />}
                        onPress={handleRetry}
                    />

                    {/* Prayers — empty times, presses blocked */}
                    <View style={styles.prayersList} pointerEvents="none">
                        {ALL_PRAYERS.map((prayerName) => (
                            <PrayerRow
                                key={prayerName}
                                prayerName={prayerName}
                                prayerTime={EMPTY_TIME}
                                isTrackable={MAIN_PRAYERS.includes(prayerName)}
                                isPrayed={false}
                                notifState="off"
                                // Only renders the bell — the press is blocked above
                                onNotifIconPress={() => {}}
                            />
                        ))}
                    </View>
                </AppCard>

                {/* 6. My Progress — Week/Month work, day cells don't open the modal */}
                <AppCard>
                    <PrayerProgressCard daysDisabled />
                </AppCard>
            </ScrollView>
        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Ring (layout copied from PrayerCountdownCard)
    ringRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        gap: 10,
    },
    circleWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringIcon: {
        position: 'absolute',
        top: RING_STROKE + 15,
        alignSelf: 'center',
    },
    ringIconOpacity: {
        opacity: 0.4,
    },
    ringInner: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringName: {
        fontSize: 18,
        marginBottom: 2,
    },
    ringTime: {
        fontSize: 25,
        fontWeight: '400',
    },
    sideColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    sideIcon: {
        opacity: 0.35,
        marginBottom: 2,
    },
    sideLabel: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.5,
    },
    sideTime: {
        fontSize: 21,
        fontWeight: '400',
        opacity: 0.4,
    },

    // Prayers card (header copied from the HomeScreen)
    prayersListContainer: {
        overflow: 'hidden',
    },
    prayersListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    calendarLeftIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateLocationRow: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateInfoText: {
        fontSize: 14.4,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    locationInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '100%',
        opacity: 0.6,
        gap: 5,
    },
    locationInfoText: {
        fontSize: 13,
        letterSpacing: 0.3,
    },
    chevronRightIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Same as the PrayersList container
    prayersList: {
        paddingTop: 10,
        paddingBottom: 14,
        paddingHorizontal: 7,
        gap: 7,
    },
});
