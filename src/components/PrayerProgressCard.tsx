import { useLanguageStore } from '@/store/languageStore';
import { usePrayersStore } from '@/store/prayersStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { getCurrentMonthRows, getCurrentWeekDays } from '@/utils/calendar';
import { toDateKey } from '@/utils/datetime';
import { getDayPrayedCount } from '@/utils/tracking';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PrayerProgressCard = React.memo(() => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Prayers store (keeps today in sync after midnight)
  const prayerTimesDate = usePrayersStore((state) => state.prayerTimesDate);
  // Prayers Tracking store
  const tracking = usePrayersTrackingStore((state) => state.tracking);

  // Local state
  const [progressView, setProgressView] = useState<'week' | 'month'>('week');

  // Derived data for calendar rendering
  const today = prayerTimesDate ?? toDateKey();
  const weekDays = getCurrentWeekDays();
  const monthRows = getCurrentMonthRows();

  // ------------------------------------------------------------
  // Opens prayerTimings modal for the tapped date
  // ------------------------------------------------------------
  const openPrayerTimings = (dateKey: string) => () => {
    router.navigate(`/(modals)/prayerTimings?date=${dateKey}`);
  };

  // ------------------------------------------------------------
  // Formatted date string badge based on current view and month rows
  // ------------------------------------------------------------
  const formattedBadge = useMemo(() => {
    // Week view — always just current month/year
    if (progressView === 'week') {
      const d = new Date(today + 'T00:00:00');
      return d.toLocaleDateString(tr.labels.localeDate, {
        month: 'long',
        year: 'numeric',
      }).replace(/^\p{L}/gu, c => c.toUpperCase());
    }

    // Month view — if first cell is prev month,
    // show range (e.g. "September - October 2026"), otherwise just current month/year
    const firstCell = monthRows[0]?.[0];
    if (firstCell && 'isPrevMonth' in firstCell && firstCell.isPrevMonth) {
      // Find first current-month cell
      const currentMonthCell = monthRows.flat().find(item => !item.empty && !item.isPrevMonth);
      const firstDate = new Date(firstCell.key + 'T00:00:00');
      const currentDate = currentMonthCell
        ? new Date(currentMonthCell.key + 'T00:00:00')
        : new Date(today + 'T00:00:00');
      const m1 = firstDate.toLocaleDateString(tr.labels.localeDate, { month: 'long' })
        .replace(/^\p{L}/gu, c => c.toUpperCase());
      const m2 = currentDate.toLocaleDateString(tr.labels.localeDate, { month: 'long', year: 'numeric' })
        .replace(/^\p{L}/gu, c => c.toUpperCase());
      return `${m1} - ${m2}`;
    }

    const currentDate = new Date(today + 'T00:00:00');
    return currentDate.toLocaleDateString(tr.labels.localeDate, {
      month: 'long',
      year: 'numeric',
    }).replace(/^\p{L}/gu, c => c.toUpperCase());
  }, [progressView, today, weekDays, monthRows, tr]);

  // ------------------------------------------------------------
  // Renders a single day cell
  // ------------------------------------------------------------
  const renderDayCell = (
    dateKey: string,
    dateNumber: number,
    options: { isEmpty?: boolean; isPrevMonth?: boolean } = {}
  ) => {
    const { isEmpty = false, isPrevMonth = false } = options;
    const isFuture = !isEmpty && !isPrevMonth && dateKey > today;
    const isToday = dateKey === today;
    const isPast = !isFuture && !isEmpty;
    const count = isEmpty ? 0 : getDayPrayedCount(tracking, dateKey);

    const barColorByCount: Record<number, string> = {
      0: theme.placeholder,
      1: theme.danger,
      2: theme.brown,
      3: theme.gray,
      4: theme.pink,
      5: theme.green,
    };

    const barWidth = `${(count / 5) * 100}%` as const;
    const barColor = isPast ? barColorByCount[count] : theme.placeholder;
    const borderColor = isToday ? theme.accent2 : theme.borderCard;
    const fractionColor = isToday ? theme.accent2 : theme.text2;
    const cellOpacity = isEmpty ? 0 : isFuture ? 0.25 : isPrevMonth ? 0.35 : 0.8;
    const dateNumColor = isToday ? theme.accent2 : theme.placeholder;

    const cellContent = (
      <>
        <View style={[styles.cellBox, { backgroundColor: theme.card, borderColor }]}>
          <Text style={[styles.fraction, { color: fractionColor, opacity: cellOpacity }]}>
            {isFuture ? '—' : `${count}/5`}
          </Text>
          <View style={[styles.barTrack, { opacity: cellOpacity, backgroundColor: theme.divider }]}>
            <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
          </View>
        </View>
        <Text style={[styles.dateNum, { color: dateNumColor, opacity: isPrevMonth ? 0.4 : 1 }]}>
          {isEmpty ? ' ' : dateNumber}
        </Text>
      </>
    );

    if (isPast && !isEmpty) {
      return (
        <TouchableOpacity
          key={dateKey}
          style={styles.cellContainer}
          onPress={openPrayerTimings(dateKey)}
          activeOpacity={0.3}
          delayPressIn={0}
        >
          {cellContent}
        </TouchableOpacity>
      );
    }

    return (
      <View key={dateKey} style={styles.cellContainer}>
        {cellContent}
      </View>
    );
  };

  // Main Content
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        {/* Left: Title */}
        <View style={styles.titleLeftRow}>
          <MaterialCommunityIcons name="progress-check" size={23} color={theme.accent} style={{ opacity: 0.8 }} />
          <Text style={[styles.title, { color: theme.text2 }]}>{tr.labels.myProgress}</Text>
        </View>

        {/* Right: View toggle Buttons */}
        <View style={[styles.toggleRow, { backgroundColor: theme.surfaceBg, borderColor: theme.borderCard }]}>
          {(['week', 'month'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              activeOpacity={0.7}
              style={[styles.toggleBtn, v === progressView && { backgroundColor: theme.overlayLight }]}
              onPress={() => setProgressView(v)}
            >
              <Text style={[styles.toggleBtnText, { color: v === progressView ? theme.white : theme.textSecondary }]}>
                {v === 'week' ? tr.labels.week : tr.labels.month}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Day names + grid */}
      <View style={styles.gridContainer}>
        {/* Day names header — shared by both views */}
        <View style={styles.dayNamesRow}>
          {tr.labels.dayNames.map((d) => (
            <Text key={d} style={[styles.dayNameText, { color: theme.placeholder }]}>{d}</Text>
          ))}
        </View>

        {/* Week view */}
        {progressView === 'week' && (
          <View style={styles.cellRow}>
            {weekDays.map((date) => {
              const dateKey = toDateKey(date);
              return renderDayCell(dateKey, date.getDate());
            })}
          </View>
        )}

        {/* Month view */}
        {progressView === 'month' && (
          <View style={styles.monthContainer}>
            {monthRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.cellRow}>
                {row.map((item) =>
                  item.empty
                    ? renderDayCell(item.key, 0, { isEmpty: true })
                    : renderDayCell(item.key, item.date.getDate(), { isPrevMonth: item.isPrevMonth })
                )}
                {row.length < 7 && Array.from({ length: 7 - row.length }, (_, i) =>
                  renderDayCell(`fill-${i}`, 0, { isEmpty: true })
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Month badge */}
      <View style={styles.monthBadgeRow}>
        <View style={[styles.monthBadge, { borderColor: theme.borderCard }]}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.monthBadgeText, { color: theme.textSecondary, opacity: 0.9 }]}>
            {formattedBadge}
          </Text>
        </View>
      </View>

    </View>
  );
});

export default PrayerProgressCard;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  titleLeftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Toggle buttons
  toggleRow: {
    overflow: "hidden",
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  toggleBtn: {
    paddingHorizontal: 19,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Weeek & Month Grid
  gridContainer: {
    gap: 0,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cellRow: {
    flexDirection: 'row',
  },
  monthContainer: {
    gap: 2,
  },

  // Day Cell
  cellContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
    gap: 4,
  },
  cellBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fraction: {
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    width: '70%',
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 99,
  },
  dateNum: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Month bottom badge
  monthBadgeRow: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  monthBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
});
