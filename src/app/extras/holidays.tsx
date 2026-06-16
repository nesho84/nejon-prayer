import AppCard from "@/components/AppCard";
import AppLayout from "@/components/AppLayout";
import { HOLIDAY_META } from "@/components/HolidaysCard";
import { globalStyles } from "@/constants/styles";
import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { ALL_HOLIDAYS, HolidayName } from "@/types/holiday.types";
import { formatDateKey, toDateKey } from "@/utils/date";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    const [sharedKey, setSharedKey] = useState<string | null>(null);
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
        const allDates = Object.values(ALL_DATES).flat();
        return [...new Set(allDates.map(d => parseInt(d.substring(0, 4))))]
            .filter(y => y <= new Date().getFullYear() + 1)
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
    // Share
    // ------------------------------------------------------------
    const handleShare = async (key: string, title: string, date: string) => {
        try {
            const result = await Share.share(
                { title, message: `${title}\n\n${date}` },
                { dialogTitle: title, subject: title }
            );
            if (result.action === Share.sharedAction) {
                setSharedKey(key);
                setTimeout(() => setSharedKey(null), 10000);
            }
        } catch (err) {
            console.error("Share failed:", err);
        }
    };

    // ------------------------------------------------------------
    // Render item with actions
    // ------------------------------------------------------------
    const renderItem = useCallback(({ item }: { item: HolidayItem }) => {
        const meta = HOLIDAY_META[item.name];
        const itemTr = holidaysTr.holidays[item.name];
        const formattedDate = formatDateKey(item.gregorianDate);
        const isShared = sharedKey === item.key;

        return (
            <AppCard style={[styles.itemCard, { backgroundColor: theme.card, opacity: item.isPast ? 0.4 : 1 }]}>
                <View style={styles.itemRow}>
                    {/* Left — icon box */}
                    <View style={[styles.leftRow, { borderColor: theme.divider2 }]}>
                        {meta.icon(30, theme[meta.color])}
                    </View>
                    {/* Middle — name, desc, date */}
                    <View style={styles.middleRow}>
                        <Text style={[styles.itemName, { color: theme[meta.color] }]}>{itemTr.name}</Text>
                        <Text style={[styles.itemDesc, { color: theme.textMuted }]}>{itemTr.description}</Text>
                        <Text style={[styles.itemDate, { color: theme.placeholder }]}>{formattedDate}</Text>
                    </View>
                    {/* Right — share icon */}
                    <TouchableOpacity
                        onPress={() => handleShare(item.key, itemTr.name, formattedDate)}
                        style={styles.shareButton}
                    >
                        <Feather name={isShared ? "check" : "share-2"} size={18} color={isShared ? theme.success : theme.placeholder} />
                    </TouchableOpacity>
                </View>
            </AppCard>
        );
    }, [sharedKey, theme, holidaysTr]);

    // Main Content
    return (
        <AppLayout>

            {/* ITEMS List */}
            <FlashList
                data={ITEMS}
                keyExtractor={(item) => item.key}
                overrideProps={{ estimatedItemSize: 130 }}
                ListHeaderComponent={
                    // HEADER
                    <AppCard style={[globalStyles.headerCard, { backgroundColor: theme.card, borderColor: theme.gray }]}>
                        <Text style={globalStyles.headerIcon}>🌙</Text>
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

        </AppLayout>
    );
}

const styles = StyleSheet.create({
    // Item cards
    itemCard: {
        padding: 16,
        marginHorizontal: 8,
        marginBottom: 10,
        gap: 12,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    leftRow: {
        width: 55,
        height: 55,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        borderWidth: 1.5,
        borderRadius: 8,
    },
    middleRow: {
        flex: 1,
        gap: 2,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "700",
    },
    itemDesc: {
        fontSize: 12,
    },
    itemDate: {
        fontSize: 11,
    },

    // Action Buttons
    shareButton: {
        padding: 8,
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
