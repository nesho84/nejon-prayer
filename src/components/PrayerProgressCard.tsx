import PrayerDayCell from '@/components/PrayerDayCell';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersStore } from '@/store/prayersStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { getCurrentMonthRows, getCurrentWeekDays } from '@/utils/calendarGrid';
import { toDateKey } from '@/utils/date';
import { getDayPrayedCount } from '@/utils/prayerTracking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PrayerProgressCard = React.memo(() => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Prayers store
  // Re-renders when new day's prayer times load — keeps today in sync after midnight
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
              onPress={() => setProgressView(v)}
              style={[styles.toggleBtn, v === progressView && { backgroundColor: theme.overlayLight }]}
            >
              <Text style={[styles.toggleText, { color: v === progressView ? theme.white : theme.textSecondary }]}>
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
          <View style={styles.row}>
            {weekDays.map((date) => {
              const dateKey = toDateKey(date);
              const isFuture = dateKey > today;
              return (
                <PrayerDayCell
                  key={dateKey}
                  count={getDayPrayedCount(tracking, dateKey)}
                  isToday={dateKey === today}
                  isFuture={isFuture}
                  dateNumber={date.getDate()}
                  onPress={openPrayerTimings(dateKey)}
                />
              );
            })}
          </View>
        )}

        {/* Month view */}
        {progressView === 'month' && (
          <View style={styles.monthContainer}>
            {monthRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((item) => {
                  if (item.empty) {
                    return <PrayerDayCell key={item.key} count={0} isToday={false} isFuture={true} isEmpty={true} dateNumber={0} />;
                  }
                  const dateKey = item.key;
                  const isFuture = dateKey > today;
                  return (
                    <PrayerDayCell
                      key={dateKey}
                      count={getDayPrayedCount(tracking, dateKey)}
                      isToday={dateKey === today}
                      isFuture={isFuture}
                      dateNumber={item.date.getDate()}
                      onPress={openPrayerTimings(dateKey)}
                    />
                  );
                })}
                {row.length < 7 && Array.from({ length: 7 - row.length }, (_, i) => (
                  <PrayerDayCell key={`fill-${i}`} count={0} isToday={false} isFuture={true} isEmpty={true} dateNumber={0} />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

    </View>
  );
});

export default PrayerProgressCard;

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  titleIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  toggleRow: {
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
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },

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
  row: {
    flexDirection: 'row',
  },
  monthContainer: {
    gap: 2,
  },
});
