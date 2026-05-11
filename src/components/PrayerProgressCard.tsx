import AppCard from '@/components/AppCard';
import PrayerDayCell from '@/components/PrayerDayCell';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { formatDateKey, getMonthGridItems, getPrayedCount, getWeekDays } from '@/utils/date';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
};

export default function PrayerProgressCard() {
  const theme = useThemeStore((state) => state.theme);
  const tracking = usePrayersTrackingStore((state) => state.tracking);
  const [view, setView] = useState<'week' | 'month'>('week');

  const today = formatDateKey();
  const weekDays = getWeekDays();
  const monthItems = getMonthGridItems();

  return (
    <AppCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Progress</Text>
        <View style={[styles.toggle, { backgroundColor: theme.surfaceBg }]}>
          {(['week', 'month'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => setView(v)}
              style={[styles.toggleBtn, v === view && { backgroundColor: theme.overlayLight }]}
            >
              <Text style={[styles.toggleText, { color: v === view ? theme.white : theme.text2 }]}>
                {v === 'week' ? 'Week' : 'Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Day names + grid */}
      <View style={styles.gridContainer}>
        {/* Day names header — shared by both views */}
        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map((d) => (
            <Text key={d} style={[styles.dayNameText, { color: theme.text2 }]}>{d}</Text>
          ))}
        </View>

        {/* Week view */}
        {view === 'week' && (
          <View style={styles.row}>
            {weekDays.map((date) => {
              const dateKey = formatDateKey(date);
              const isFuture = dateKey > today;
              return (
                <PrayerDayCell
                  key={dateKey}
                  count={getPrayedCount(tracking, dateKey)}
                  isToday={dateKey === today}
                  isFuture={isFuture}
                  dateNumber={date.getDate()}
                />
              );
            })}
          </View>
        )}

        {/* Month view */}
        {view === 'month' && (
          <View style={styles.monthContainer}>
            {chunkArray(monthItems, 7).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((item) => {
                  if (item.empty) {
                    return (
                      <PrayerDayCell
                        key={item.key}
                        count={0}
                        isToday={false}
                        isFuture={true}
                        isEmpty={true}
                        dateNumber={0}
                      />
                    );
                  }
                  const dateKey = item.key;
                  const isFuture = dateKey > today;
                  return (
                    <PrayerDayCell
                      key={dateKey}
                      count={getPrayedCount(tracking, dateKey)}
                      isToday={dateKey === today}
                      isFuture={isFuture}
                      dateNumber={item.date.getDate()}
                    />
                  );
                })}
                {/* Fill incomplete last row */}
                {row.length < 7 && Array.from({ length: 7 - row.length }, (_, i) => (
                  <PrayerDayCell
                    key={`fill-${i}`}
                    count={0}
                    isToday={false}
                    isFuture={true}
                    isEmpty={true}
                    dateNumber={0}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
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
    fontSize: 11,
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
