import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { getNextHoliday } from "@/services/holidaysService";
import { useDebugStore } from "@/debug/debugStore";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useThemeStore } from "@/store/themeStore";
import { HOLIDAY_META, UpcomingHoliday } from "@/types/holiday.types";
import { ThemeColors } from "@/types/theme.types";
import { formatDateKey, toDateKey } from "@/utils/datetime";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

type MCIcon = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type ThemeKey = keyof ThemeColors;

interface Props {
  holiday?: Pick<UpcomingHoliday, 'name' | 'gregorianDate'>;  // omit → self-computed upcoming
  right?: React.ReactNode;                                    // omit → days-until block
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

const HolidaysCard = React.memo(({ holiday, right, style, testID }: Props) => {
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
    // A holiday was handed in — nothing to look up
    if (holiday) return null;
    if (!yearlyHolidays) return null;

    // DEBUG: force-show a fake upcoming holiday for UI testing (Debug Panel toggle)
    if (forceHoliday) {
      return { name: "ramadan_start", gregorianDate: "2026-06-15", daysUntil: 3 } as UpcomingHoliday;
    }

    // Compute real upcoming holiday based on dates
    return getNextHoliday(yearlyHolidays, toDateKey());
  }, [holiday, yearlyHolidays, forceHoliday]);

  const target = holiday ?? upcoming;

  // Nothing upcoming — render nothing
  if (!target) return null;

  // Metadata + translations — both complete records, clean access
  const meta = HOLIDAY_META[target.name];
  const holidayTr = holidaysTr.holidays[target.name];
  // Format date "2027-02-08" → "08.02.2027"
  const formattedDate = formatDateKey(target.gregorianDate);

  const content = (
    <>
      {/* Left - Icon Box */}
      <View style={[styles.leftRow, { borderColor: theme.divider2 }]}>
        {<MaterialDesignIcons name={meta.icon as MCIcon} size={meta.size} color={theme[meta.color as ThemeKey]} />}
      </View>

      {/* Middle — name, desc. and date */}
      <View style={styles.middleRow}>
        <Text style={[styles.name, { color: theme[meta.color as ThemeKey] }]}>{holidayTr.name}</Text>
        <Text style={[styles.desc, { color: theme.textMuted }]}>{holidayTr.description}</Text>
        <Text style={[styles.date, { color: theme.placeholder, opacity: 0.8 }]}>
          {formattedDate}
        </Text>
      </View>

      {/* Right — caller's node, or days and label */}
      {right ?? (
        <View style={styles.rightRow}>
          <Text style={[styles.days, { color: theme[meta.color as ThemeKey] }]}>{upcoming?.daysUntil}</Text>
          <Text style={[styles.daysLabel, { color: theme.placeholder }]}>{tr.labels.days}</Text>
        </View>
      )}
    </>
  );

  // A handed-in holiday is a plain row — the caller owns padding and any press behaviour
  if (holiday) {
    return (
      <View testID={testID} style={[styles.container, { backgroundColor: theme.card }, style]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      onPress={() => router.navigate("/extras/holidays")}
      style={[styles.container, styles.containerPadding, { backgroundColor: theme.card }, style]}
    >
      {content}
    </TouchableOpacity>
  );
});

HolidaysCard.displayName = 'HolidaysCard';

export default HolidaysCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    // Card Shadow
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Self-computing card only — a handed-in row sets its own
  containerPadding: {
    paddingVertical: 9,
    paddingHorizontal: 12,
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
