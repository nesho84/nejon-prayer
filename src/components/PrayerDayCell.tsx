import { useThemeStore } from '@/store/themeStore';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  count: number;      // 0–5
  isToday: boolean;
  isFuture: boolean;
  dateNumber: number; // e.g. 11
  isEmpty?: boolean;  // padding cell — show box but no date number
  onPress?: () => void;
}

export default function PrayerDayCell({ count, isToday, isFuture, dateNumber, isEmpty, onPress }: Props) {
  // Stores
  const theme = useThemeStore((state) => state.theme);

  // Derived values
  const isPast = !isFuture && !isEmpty;
  const barWidth = `${(count / 5) * 100}%` as const;

  // Bar color mapping based on count
  const barColorByCount: Record<number, string> = {
    0: theme.placeholder,
    1: theme.danger,
    2: theme.brown,
    3: theme.gray,
    4: theme.pink,
    5: theme.green,
  };

  // Past dates: colored bar based on count
  const barColor = isPast ? barColorByCount[count] : theme.placeholder;
  const borderColor = isToday ? theme.accent2 : theme.borderCard;
  const fractionColor = isToday ? theme.accent2 : theme.text2;
  const cellOpacity = isEmpty ? 0 : isFuture ? 0.25 : 0.8;
  const dateNumColor = isToday ? theme.accent2 : theme.placeholder;

  // Cell base content
  const cellContent = (
    <>
      <View style={[styles.box, { backgroundColor: theme.card, borderColor }]}>
        <Text style={[styles.fraction, { color: fractionColor, opacity: cellOpacity }]}>
          {isFuture ? '—' : `${count}/5`}
        </Text>
        <View style={[styles.barTrack, { opacity: cellOpacity, backgroundColor: theme.divider }]}>
          <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>
      </View>
      <Text style={[styles.dateNum, { color: dateNumColor }]}>
        {isEmpty ? ' ' : dateNumber}
      </Text>
    </>
  );

  // Tappable cell — past or today, non-empty
  if (onPress && isPast) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.3} delayPressIn={0}>
        {cellContent}
      </TouchableOpacity>
    );
  }

  // Static cell — future date, empty padding, or no onPress
  return (
    <View style={styles.container}>
      {cellContent}
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
});
