import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { HolidayName, UpcomingHoliday } from "@/types/holiday.types";
import { ThemeColors } from "@/types/theme.types";
import { formatDateKey } from "@/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export type HolidayMeta = {
  icon: (size: number, color: string) => React.ReactNode;
  color: keyof ThemeColors;
};

// ------------------------------------------------------------
// Icon and accent color per holiday
// ------------------------------------------------------------
export const HOLIDAY_META: Record<HolidayName, HolidayMeta> = {
  hijri_new_year: { icon: (size, color) => <MaterialCommunityIcons name="calendar-star" size={size} color={color} />, color: 'islamicGreen' },
  ashura: { icon: (size, color) => <MaterialCommunityIcons name="water-outline" size={size} color={color} />, color: 'info' },
  regaib: { icon: (size, color) => <MaterialCommunityIcons name="star-outline" size={size} color={color} />, color: 'gold' },
  isra_miraj: { icon: (size, color) => <MaterialCommunityIcons name="shimmer" size={size} color={color} />, color: 'violet' },
  laylat_baraat: { icon: (size, color) => <MaterialCommunityIcons name="star-crescent" size={size} color={color} />, color: 'accent' },
  ramadan_start: { icon: (size, color) => <MaterialCommunityIcons name="star-crescent" size={size} color={color} />, color: 'islamicGreen' },
  laylat_qadr: { icon: (size, color) => <MaterialCommunityIcons name="book-outline" size={size} color={color} />, color: 'gold' },
  eid_fitr: { icon: (size, color) => <MaterialCommunityIcons name="creation-outline" size={size} color={color} />, color: 'accent' },
  arafah: { icon: (size, color) => <MaterialCommunityIcons name="nature-people" size={size} color={color} />, color: 'secondary' },
  eid_adha: { icon: (size, color) => <MaterialCommunityIcons name="sheep" size={size} color={color} />, color: 'pink' },
};

const IslamicHolidaysCard = React.memo(() => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);
  const yearlyHolidays = useHolidaysStore((state) => state.yearlyHolidays);
  const holidaysTr = HOLIDAYS_TR[language] ?? HOLIDAYS_TR.en;

  // ------------------------------------------------------------
  // Detect next upcoming holiday within its showFromDays window
  // ------------------------------------------------------------
  // const upcoming = useMemo(() => {
  //   if (!yearlyHolidays) return null;
  //   return getNextHoliday(yearlyHolidays, toDateKey());
  // }, [yearlyHolidays]);

  // ------------------------------------------------------------
  // TEMP: For testing card UI
  // ------------------------------------------------------------
  const upcoming = useMemo(() => {
    if (!yearlyHolidays) return null;
    return { name: "ramadan_start", gregorianDate: "2026-06-15", daysUntil: 3 } as UpcomingHoliday;
  }, [yearlyHolidays]);

  // Nothing upcoming — render nothing
  if (!upcoming) return null;

  // Metadata + translations — both complete records, clean access
  const meta = HOLIDAY_META[upcoming.name];
  const holidayTr = holidaysTr.holidays[upcoming.name];
  // Format date "2027-02-08" → "08.02.2027"
  const formattedDate = formatDateKey(upcoming.gregorianDate);

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>

      {/* Left - Icon Box */}
      <View style={[styles.leftRow, { borderColor: theme.divider2 }]}>
        {meta.icon(35, theme[meta.color])}
      </View>

      {/* Middle — name, desc. and date */}
      <View style={styles.middleRow}>
        <Text style={[styles.name, { color: theme[meta.color] }]}>{holidayTr.name}</Text>
        <Text style={[styles.desc, { color: theme.textMuted }]}>{holidayTr.description}</Text>
        <Text style={[styles.date, { color: theme.placeholder, opacity: 0.8 }]}>
          {formattedDate}
        </Text>
      </View>

      {/* Right — days and label */}
      <View style={styles.rightRow}>
        <Text style={[styles.days, { color: theme[meta.color] }]}>{upcoming.daysUntil}</Text>
        <Text style={[styles.daysLabel, { color: theme.placeholder }]}>{tr.labels.days}</Text>
      </View>

    </View>
  );
});

export default IslamicHolidaysCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 14,
    // Card Shadow
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Left - Icon Box
  leftRow: {
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1.5,
    borderRadius: 8,
  },

  // Middle — name and date
  middleRow: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
  },
  date: {
    fontSize: 11,
  },

  // Right — days and label
  rightRow: {
    alignItems: "center",
  },
  days: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 28,
    includeFontPadding: false,
    marginRight: 9,
  },
  daysLabel: {
    fontSize: 12,
    marginRight: 10,
  },
});