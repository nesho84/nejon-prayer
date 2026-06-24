import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { getNextHoliday } from "@/services/holidaysService";
import { useDebugStore } from "@/store/debugStore";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { HOLIDAY_META, UpcomingHoliday } from "@/types/holiday.types";
import { ThemeColors } from "@/types/theme.types";
import { formatDateKey, toDateKey } from "@/utils/datetime";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type ThemeKey = keyof ThemeColors;

const IslamicHolidaysCard = React.memo(() => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);
  const yearlyHolidays = useHolidaysStore((state) => state.yearlyHolidays);
  const holidaysTr = HOLIDAYS_TR[language] ?? HOLIDAYS_TR.en;

  // DEBUG: force-show the holiday card on any day (Debug Panel toggle)
  const forceHoliday = useDebugStore((state) => state.forceHoliday);

  // ------------------------------------------------------------
  // Detect next upcoming holiday within its showFromDays window
  // ------------------------------------------------------------
  const upcoming = useMemo(() => {
    if (!yearlyHolidays) return null;

    // DEBUG: force-show a fake upcoming holiday for UI testing (Debug Panel toggle)
    if (forceHoliday) {
      return { name: "ramadan_start", gregorianDate: "2026-06-15", daysUntil: 3 } as UpcomingHoliday;
    }

    // Compute real upcoming holiday based on dates
    return getNextHoliday(yearlyHolidays, toDateKey());
  }, [yearlyHolidays, forceHoliday]);

  // Nothing upcoming — render nothing
  if (!upcoming) return null;

  // Metadata + translations — both complete records, clean access
  const meta = HOLIDAY_META[upcoming.name];
  const holidayTr = holidaysTr.holidays[upcoming.name];
  // Format date "2027-02-08" → "08.02.2027"
  const formattedDate = formatDateKey(upcoming.gregorianDate);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.navigate("/extras/holidays")}
      style={[styles.container, { backgroundColor: theme.card }]}
    >

      {/* Left - Icon Box */}
      <View style={[styles.leftRow, { borderColor: theme.divider2 }]}>
        {<MaterialCommunityIcons name={meta.icon as MCIcon} size={meta.size} color={theme[meta.color as ThemeKey]} />}
      </View>

      {/* Middle — name, desc. and date */}
      <View style={styles.middleRow}>
        <Text style={[styles.name, { color: theme[meta.color as ThemeKey] }]}>{holidayTr.name}</Text>
        <Text style={[styles.desc, { color: theme.textMuted }]}>{holidayTr.description}</Text>
        <Text style={[styles.date, { color: theme.placeholder, opacity: 0.8 }]}>
          {formattedDate}
        </Text>
      </View>

      {/* Right — days and label */}
      <View style={styles.rightRow}>
        <Text style={[styles.days, { color: theme[meta.color as ThemeKey] }]}>{upcoming.daysUntil}</Text>
        <Text style={[styles.daysLabel, { color: theme.placeholder }]}>{tr.labels.days}</Text>
      </View>

    </TouchableOpacity>
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