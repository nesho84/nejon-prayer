import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import HolidaysCard from "@/components/HolidaysCard";
import { globalStyles } from "@/constants/styles";
import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { ALL_HOLIDAYS, HolidayName } from "@/types/holiday.types";
import { toDateKey } from "@/utils/datetime";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HolidayItem {
    key: string;
    name: HolidayName;
    gregorianDate: string;
    isPast: boolean;
}

export default function HolidaysScreen() {
    // Stores
    const theme = useThemeStore((state) => state.theme);
    const language = useLanguageStore((state) => state.language);
    const yearlyHolidays = useHolidaysStore((state) => state.yearlyHolidays);
    const holidaysTr = HOLIDAYS_TR[language] ?? HOLIDAYS_TR.en;

    // Local state
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

    // Safe area insets
    const insets = useSafeAreaInsets();
    const topInset = 12;
    const bottomInset = insets.bottom + 12;

    // ------------------------------------------------------------
    // Items — one entry per holiday, date preferred from selected year
    // sorted chronologically, past ones flagged
    // ------------------------------------------------------------
    const ALL_DATES = useMemo(() => {
        if (!yearlyHolidays) return {} as Record<HolidayName, string[]>;
        const result = {} as Record<HolidayName, string[]>;
        for (const name of ALL_HOLIDAYS) {
            result[name] = [...new Set(yearlyHolidays[name] ?? [])].sort();
        }
        return result;
    }, [yearlyHolidays]);

    const AVAILABLE_YEARS = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const allDates = Object.values(ALL_DATES).flat();
        return [...new Set(allDates.map(d => parseInt(d.substring(0, 4))))]
            .filter(y => y >= currentYear && y <= currentYear + 1)
            .sort();
    }, [ALL_DATES]);

    const ITEMS: HolidayItem[] = useMemo(() => {
        if (!yearlyHolidays) return [];
        const today = toDateKey();
        const items: HolidayItem[] = [];
        for (const name of ALL_HOLIDAYS) {
            const dates = ALL_DATES[name];
            if (!dates?.length) continue;
            // Prefer a date in the selected year; fall back to nearest upcoming; then last past
            const inYear = dates.filter(d => d.startsWith(String(selectedYear)));
            const upcoming = dates.find(d => d >= today);
            const gregorianDate = inYear[0] ?? upcoming ?? dates[dates.length - 1];
            if (!gregorianDate) continue;
            items.push({ key: name, name, gregorianDate, isPast: gregorianDate < today });
        }
        return items.sort((a, b) => a.gregorianDate.localeCompare(b.gregorianDate));
    }, [ALL_DATES, selectedYear, yearlyHolidays]);

    // ------------------------------------------------------------
    // Swipe left → next year, right → previous. Clamped at both ends;
    // the year badges are the indication that the year changed.
    // ------------------------------------------------------------
    const yearSwipe = useMemo(() =>
        Gesture.Pan()
            .enabled(AVAILABLE_YEARS.length > 1)
            .activeOffsetX([-20, 20])
            .failOffsetY([-15, 15])
            // Plain state update, no UI-thread work
            .runOnJS(true)
            .onEnd((e) => {
                if (Math.abs(e.translationX) < 60 && Math.abs(e.velocityX) < 500) return;
                const dir = e.translationX < 0 ? 1 : -1;
                setSelectedYear((prev) => AVAILABLE_YEARS[AVAILABLE_YEARS.indexOf(prev) + dir] ?? prev);
            }),
        [AVAILABLE_YEARS]);

    // ------------------------------------------------------------
    // Render item — the card owns the info/share actions
    // ------------------------------------------------------------
    const renderItem = useCallback(({ item }: { item: HolidayItem }) => (
        <HolidaysCard
            testID={`holiday-${item.key}`}
            holiday={item}
            style={[styles.itemCard, { opacity: item.isPast ? 0.45 : 1 }]}
        />
    ), []);

    // Main Content
    return (
        <AppLayout>

            {/* ITEMS List — horizontal swipe switches the year */}
            <GestureDetector gesture={yearSwipe}>
                <View style={globalStyles.container}>
                    <FlashList
                        data={ITEMS}
                        keyExtractor={(item) => item.key}
                        overrideProps={{ estimatedItemSize: 130 }}
                        ListHeaderComponent={
                            // HEADER
                            <AppCard style={[globalStyles.headerCard, { backgroundColor: theme.card, borderColor: theme.gray }]}>
                                <Text style={globalStyles.headerIcon}>✨</Text>
                                <Text style={[globalStyles.headerTitle, { color: theme.text }]}>{holidaysTr.headerTitle}</Text>
                                <Text style={[globalStyles.headerSubtitle, { color: theme.placeholder }]}>{holidaysTr.headerSubtitle}</Text>
                                {/* Year badges */}
                                {AVAILABLE_YEARS.length > 1 && (
                                    <View style={styles.yearLinks}>
                                        {AVAILABLE_YEARS.map((year) => (
                                            <TouchableOpacity
                                                key={year}
                                                activeOpacity={0.7}
                                                onPress={() => setSelectedYear(year)}
                                                style={[
                                                    styles.yearBadge,
                                                    {
                                                        backgroundColor: selectedYear === year ? theme.gray + '20' : theme.borderCard,
                                                        borderColor: selectedYear === year ? theme.gray : 'transparent',
                                                    },
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.yearBadgeText,
                                                    { color: selectedYear === year ? theme.gray : theme.placeholder },
                                                ]}>
                                                    {year}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </AppCard>
                        }
                        renderItem={renderItem}
                        ListFooterComponent={
                            // FOOTER
                            <AppCard style={[styles.footerCard, { backgroundColor: theme.card, borderLeftColor: theme.placeholder }]}>
                                <Text style={[styles.footerText, { color: theme.placeholder }]}>
                                    {holidaysTr.footerText}
                                </Text>
                            </AppCard>
                        }
                        contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </GestureDetector>

        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Item cards
    itemCard: {
        padding: 16,
        marginHorizontal: 8,
        marginBottom: 10,
    },

    // Year badges (inside header)
    yearLinks: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
    },
    yearBadge: {
        paddingHorizontal: 18,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    yearBadgeText: {
        fontSize: 15,
        fontWeight: "600",
    },

    // Footer card
    footerCard: {
        padding: 22,
        borderLeftWidth: 4,
        marginHorizontal: 8,
        marginBottom: 10,
    },
    footerText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "400",
        fontStyle: "italic",
        textAlign: "justify",
    },
});
