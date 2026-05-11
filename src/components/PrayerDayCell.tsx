import { useThemeStore } from '@/store/themeStore';
import { StyleSheet, Text, View } from 'react-native';

interface PrayerDayCellProps {
  count: number;        // 0–5
  isToday: boolean;
  isFuture: boolean;
  dateNumber: number;   // e.g. 11
  isEmpty?: boolean;    // padding cell — show box but no date number
}

export default function PrayerDayCell({ count, isToday, isFuture, dateNumber, isEmpty }: PrayerDayCellProps) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <View style={styles.container}>
      <View style={[
        styles.box,
        { backgroundColor: theme.card, borderColor: isToday ? theme.accent : theme.borderCard },
      ]}>
        {!isEmpty && isFuture && (
          <>
            <Text style={[styles.fraction, { color: theme.text2, opacity: 0.25 }]}>—</Text>
            <View style={[styles.dot, { backgroundColor: theme.danger, opacity: 0.25 }]} />
          </>
        )}
        {!isFuture && (
          <>
            <Text style={[styles.fraction, { color: isToday ? theme.accent : theme.text2 }]}>
              {count}/5
            </Text>
            <View style={[styles.dot, { backgroundColor: count === 5 ? theme.success : theme.danger }]} />
          </>
        )}
      </View>
      <Text style={[styles.dateNum, { color: isToday ? theme.accent : theme.text2 }]}>
        {isEmpty ? ' ' : dateNumber}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
    gap: 4,
  },
  box: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fraction: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  dateNum: {
    fontSize: 12,
    fontWeight: '500',
  },
});
