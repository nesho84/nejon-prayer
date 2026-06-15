import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { getNextHoliday } from "@/services/holidaysService";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { formatDateKey, toDateKey } from "@/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// ------------------------------------------------------------
// Icon and accent color per holiday type
// ------------------------------------------------------------
const HOLIDAY_META = {
  ramadan_start: { icon: 'shield-moon-outline', color: 'islamicGreen' },
  laylat_qadr: { icon: 'book-outline', color: 'islamicGreen' },
  eid_fitr: { icon: 'creation-outline', color: 'accent' },
  eid_adha: { icon: 'sheep', color: 'accent2' },
} as const;

const IslamicHolidaysCard = React.memo(() => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);
  const holidayDates = useHolidaysStore((state) => state.holidayDates);

  // ------------------------------------------------------------
  // Detect next upcoming holiday within its showFromDays window
  // ------------------------------------------------------------
  const upcoming = useMemo(() => {
    if (!holidayDates) return null;
    return getNextHoliday(holidayDates, toDateKey());
  }, [holidayDates]);

  // ------------------------------------------------------------
  // TEMP: For testing card UI
  // ------------------------------------------------------------
  // const upcoming = useMemo(() => {
  //   if (!holidayDates) return null;
  //   return { type: "ramadan_start", gregorianDate: "2026-06-15", daysUntil: 7 } as UpcomingHoliday;
  // }, [holidayDates]);

  // Nothing upcoming — render nothing
  if (!upcoming) return null;

  // Desctructure translations and metadata for the upcoming holiday
  const meta = HOLIDAY_META[upcoming.type];
  const holidayTr = HOLIDAYS_TR[upcoming.type][language];

  // Format date "2027-02-08" → "08.02.2027"
  const formattedDate = formatDateKey(upcoming.gregorianDate);

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>

      {/* Left - Icon Box */}
      <View style={[styles.leftRow, { borderColor: theme.divider2 }]}>
        <MaterialCommunityIcons name={meta.icon} size={35} color={theme[meta.color]} />
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