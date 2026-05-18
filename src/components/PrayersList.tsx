import PrayerIcon from '@/components/PrayerIcon';
import PrayerNotifIcon from '@/components/PrayerNotifIcon';
import { useLanguageStore } from '@/store/languageStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { MAIN_PRAYERS, PrayerName, PrayerTimeEntry, PrayerTimes } from '@/types/prayer.types';
import { toDateKey } from '@/utils/date';
import { isTimePast } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  prayerTimes: PrayerTimes;
  prayerTimesDate: string | null;
  currentPrayerName: PrayerName | null;
}

const PrayersList = React.memo(({ prayerTimes, prayerTimesDate, currentPrayerName }: Props) => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Prayers Tracking store
  const tracking = usePrayersTrackingStore((state) => state.tracking);
  const markPrayed = usePrayersTrackingStore((state) => state.markPrayed);
  const unmarkPrayed = usePrayersTrackingStore((state) => state.unmarkPrayed);

  return (
    <View style={styles.container}>
      {(Object.entries(prayerTimes) as PrayerTimeEntry[]).map(([prayerName, prayerTime], index, arr) => {
        const isTrackable = MAIN_PRAYERS.includes(prayerName as PrayerName);
        const isToday = prayerTimesDate === toDateKey();
        const isPast = isTrackable && isToday && isTimePast(prayerTime);
        const isCurrent = isToday && currentPrayerName === prayerName;
        const isLast = index === arr.length - 1;
        const isPrayed = isTrackable && tracking[toDateKey()]?.[prayerName] === 'prayed';

        return (
          <View key={prayerName} style={!isLast && { marginBottom: 0 }}>
            {/* Prayer row card */}
            <View
              style={[
                styles.prayerRow,
                {
                  backgroundColor: isCurrent ? theme.accentLight : theme.card,
                  borderColor: isCurrent ? theme.accentLight : theme.borderCard
                }
              ]}
            >
              {/* Left: mark/unmark area (trackable) or plain view (non-trackable) */}
              {isTrackable ? (
                <TouchableOpacity
                  style={styles.prayerRowLeft}
                  delayPressIn={0}
                  delayPressOut={0}
                  activeOpacity={0.3}
                  hitSlop={8}
                  onPress={() => {
                    if (!isPast && !isCurrent) return;
                    isPrayed ? unmarkPrayed(prayerName as PrayerName) : markPrayed(prayerName as PrayerName)
                  }}
                >
                  {/* Left: Tracking circle */}
                  <Ionicons
                    name={isPrayed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={21}
                    color={isPrayed ? theme.accent2 : theme.text2}
                    style={{ opacity: isPrayed ? 1 : 0.45 }}
                  />
                  {/* Prayer Name Text */}
                  <Text style={[styles.prayerNameText, { color: isCurrent ? theme.accent : theme.text2 }]}>
                    {tr.prayers[prayerName] || prayerName}
                  </Text>
                  {/* Prayer Name Icon */}
                  <PrayerIcon name={prayerName} size={18} color={isCurrent ? theme.accent : theme.text2} opacity={0.7} />
                  {/* Horizontal Spacer */}
                  <View style={{ flex: 1 }} />
                  {/* Prayer Time */}
                  <Text style={[styles.prayerTimeText, { color: isCurrent ? theme.accent : theme.text2 }]}>
                    {prayerTime}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.prayerRowLeft}>
                  {/* Left: Dash placeholder */}
                  <Ionicons
                    name="remove"
                    size={21}
                    color={theme.text2}
                    style={{ opacity: 0.3 }}
                  />
                  {/* Prayer Name Text */}
                  <Text style={[styles.prayerNameText, { color: theme.text2, opacity: 0.5 }]}>
                    {tr.prayers[prayerName] || prayerName}
                  </Text>
                  {/* Prayer Name Icon */}
                  <PrayerIcon name={prayerName} size={18} color={theme.text2} opacity={0.5} />
                  {/* Horizontal Spacer */}
                  <View style={{ flex: 1 }} />
                  {/* Prayer Time */}
                  <Text style={[styles.prayerTimeText, { color: theme.text2, opacity: 0.5 }]}>
                    {prayerTime}
                  </Text>
                </View>
              )}

              {/* Right: Notification Icon → opens modal */}
              <TouchableOpacity
                style={styles.notifIconContainer}
                delayPressIn={0}
                delayPressOut={0}
                activeOpacity={0.3}
                hitSlop={8}
                onPress={() => {
                  router.navigate(`/(modals)/prayerNotification?prayer=${prayerName}`);
                }}
              >
                <View style={[styles.notifIcon, { backgroundColor: theme.surfaceBg }]}>
                  <PrayerNotifIcon prayerName={prayerName} size={20} color={theme.text2} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
});

export default PrayersList;

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 7,
    gap: 7,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1.3,
    borderRadius: 12,
    gap: 10,
  },
  prayerRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    gap: 10,
  },
  prayerNameText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  prayerTimeText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
    letterSpacing: 0.5,
  },
  notifIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
