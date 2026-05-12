import { useThemeStore } from '@/store/themeStore';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  count: number;      // 0–5
  isToday: boolean;
  isFuture: boolean;
  dateNumber: number; // e.g. 11
  isEmpty?: boolean;  // padding cell — show box but no date number
}

export default function PrayerDayCell({ count, isToday, isFuture, dateNumber, isEmpty }: Props) {
  // Stores
  const theme = useThemeStore((state) => state.theme);

  const barColor = !isFuture ? (count === 5 ? theme.accent2 : theme.danger) : theme.danger;
  const barWidth = `${(count / 5) * 100}%` as const;

  return (
    <View style={styles.container}>
      <View style={[
        styles.box,
        { backgroundColor: theme.card, borderColor: isToday ? theme.accent2 : theme.borderCard },
      ]}>
        <Text style={[styles.fraction, {
          color: !isFuture ? (isToday ? theme.accent2 : theme.text2) : theme.text2,
          opacity: isEmpty ? 0 : (isFuture ? 0.25 : 0.8),
        }]}>
          {!isFuture ? `${count}/5` : '—'}
        </Text>
        <View style={[styles.barTrack, { opacity: isEmpty ? 0 : (isFuture ? 0.25 : 0.8) }]}>
          <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>
      </View>
      <Text style={[styles.dateNum, { color: isToday ? theme.accent2 : theme.text2 }]}>
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
    gap: 4,
  },
  fraction: {
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    width: '65%',
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 99,
  },
  dateNum: {
    fontSize: 12,
    fontWeight: '500',
  },
});
