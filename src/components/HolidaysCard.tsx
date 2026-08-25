import { globalStyles, HIT_SLOP_8 } from "@/constants/styles";
import { HOLIDAYS_TR } from "@/constants/translations/holidays.tr";
import { useDebugStore } from "@/debug/debugStore";
import { getNextHoliday } from "@/services/holidaysService";
import { useHolidaysStore } from "@/store/holidaysStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { HOLIDAY_META, UpcomingHoliday } from "@/types/holiday.types";
import { ThemeColors } from "@/types/theme.types";
import { formatDateKey, toDateKey } from "@/utils/datetime";
import { shareText } from "@/utils/system";
import { Feather } from "@react-native-vector-icons/feather/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

type MCIcon = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type ThemeKey = keyof ThemeColors;

interface Props {
  holiday?: Pick<UpcomingHoliday, 'name' | 'gregorianDate'>;  // omit → self-computed upcoming
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

const HolidaysCard = React.memo(({ holiday, style, testID }: Props) => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);
  const yearlyHolidays = useHolidaysStore((state) => state.yearlyHolidays);
  const holidaysTr = HOLIDAYS_TR[language] ?? HOLIDAYS_TR.en;

  // Local state — share confirmation
  const [isShared, setIsShared] = useState(false);

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

  // ------------------------------------------------------------
  // Info modal — same design as the prayer celebration modal
  // ------------------------------------------------------------
  const showInfo = () => {
    useModalStore.getState().show({
      type: 'alert',
      component: (
        <View style={globalStyles.bannerContainer}>
          <Feather name="info" size={40} color={theme.accent} />
          <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{holidayTr.name}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{holidayTr.info}</Text>
        </View>
      ),
      buttons: [{
        label: 'OK',
        action: 'ok',
        buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
        labelStyle: { fontSize: 16, fontWeight: '600', color: theme.accent },
      }],
    });
  };

  // ------------------------------------------------------------
  // Share — name, description and date; icon confirms for 10s
  // ------------------------------------------------------------
  const handleShare = async () => {
    if (await shareText(holidayTr.name, `${holidayTr.description}\n\n${formattedDate}`)) {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 10000);
    }
  };

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

      {/* Right — actions on a list row, countdown on the self-computing card */}
      {holiday ? (
        <View style={styles.iconsRow}>
          <Pressable
            testID={`info-${target.name}`}
            style={({ pressed }) => [globalStyles.iconButton, pressed && { backgroundColor: theme.pressed }]}
            hitSlop={HIT_SLOP_8}
            onPress={showInfo}
          >
            <Feather name="info" size={21} color={theme.placeholder} />
          </Pressable>
          <Pressable
            testID={`share-${target.name}`}
            style={({ pressed }) => [globalStyles.iconButton, pressed && { backgroundColor: theme.pressed }]}
            hitSlop={HIT_SLOP_8}
            onPress={handleShare}
          >
            <Feather name={isShared ? "check" : "share-2"} size={18} color={isShared ? theme.success : theme.placeholder} />
          </Pressable>
        </View>
      ) : (
        // Self-computing card — shows countdown to the next holiday
        <View style={styles.daysRow}>
          <Text style={[styles.days, { color: theme[meta.color as ThemeKey] }]}>{upcoming?.daysUntil}</Text>
          <Text style={[styles.daysLabel, { color: theme.placeholder }]}>{tr.labels.days}</Text>
        </View>
      )}
    </>
  );

  const containerStyle = [styles.container, !style && styles.containerPadding, { backgroundColor: theme.card }, style];

  // A list row carries its own info button — only the self-computing card is pressable
  if (holiday) {
    return <View testID={testID} style={containerStyle}>{content}</View>;
  }

  return (
    <TouchableOpacity testID={testID} activeOpacity={0.7} onPress={showInfo} style={containerStyle}>
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
  // Default only — pass `style` and you own the padding
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

  // Right — action icons (list row)
  iconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Right — days and label (self-computing card)
  daysRow: {
    alignItems: "center",
  },
  days: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 26,
    includeFontPadding: false,
    marginRight: 9,
  },
  daysLabel: {
    fontSize: 12,
    marginRight: 10,
  },
});
