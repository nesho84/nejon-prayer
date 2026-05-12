import AppCard from '@/components/AppCard';
import PrayerDayCell from '@/components/PrayerDayCell';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { formatDateKey, getMonthRows, getPrayedCount, getWeekDays } from '@/utils/date';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrayerProgressCard() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Tracking store
  const tracking = usePrayersTrackingStore((state) => state.tracking);

  // Local state
  const [view, setView] = useState<'week' | 'month'>('week');

  // Derived data for calendar rendering
  const today = formatDateKey();
  const weekDays = getWeekDays();
  const monthRows = getMonthRows();

  return (
    <AppCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        {/* Left: Title */}
        <View style={styles.titleLeftRow}>
          <MaterialCommunityIcons name="progress-check" size={22} color={theme.text2} style={{ opacity: 0.6 }} />
          <Text style={[styles.title, { color: theme.text2 }]}>{tr.labels.myProgress}</Text>
        </View>
        {/* Right: View toggle */}
        <View style={[styles.toggle, { backgroundColor: theme.surfaceBg }]}>
          {(['week', 'month'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => setView(v)}
              style={[styles.toggleBtn, v === view && { backgroundColor: theme.overlayLight }]}
            >
              <Text style={[styles.toggleText, { color: v === view ? theme.white : theme.text2 }]}>
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
            {monthRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((item) => {
                  if (item.empty) {
                    return <PrayerDayCell key={item.key} count={0} isToday={false} isFuture={true} isEmpty={true} dateNumber={0} />;
                  }
                  const dateKey = item.key;
                  return (
                    <PrayerDayCell
                      key={dateKey}
                      count={getPrayedCount(tracking, dateKey)}
                      isToday={dateKey === today}
                      isFuture={dateKey > today}
                      dateNumber={item.date.getDate()}
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
