import PrayerIcon from '@/components/PrayerIcon';
import PrayerNotifIcon from '@/components/PrayerNotifIcon';
import { PRAYER_CELEBRATIONS_TR } from '@/constants/translations/celebrations.tr';
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { MAIN_PRAYERS, PrayerName, PrayerTimeEntry, PrayerTimes } from '@/types/prayer.types';
import { toDateKey } from '@/utils/date';
import { isTimePast } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
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
  const language = useLanguageStore((state) => state.language);
  // Prayers Tracking store
  const tracking = usePrayersTrackingStore((state) => state.tracking);
  const markPrayed = usePrayersTrackingStore((state) => state.markPrayed);
  const unmarkPrayed = usePrayersTrackingStore((state) => state.unmarkPrayed);
  const celebratedDate = usePrayersTrackingStore((state) => state.celebratedDate);
  const setCelebrated = usePrayersTrackingStore((state) => state.setCelebrated);

  // ------------------------------------------------------------
  // Handle marking/unmarking prayers as prayed and show celebration modal
  // ------------------------------------------------------------
  const handleMark = useCallback((prayerName: PrayerName, isPrayed: boolean, isPast: boolean, isCurrent: boolean) => {
    if (!isPast && !isCurrent) return;

    // If already marked as prayed, unmark it
    if (isPrayed) {
      unmarkPrayed(prayerName);
      return;
    }
    // Mark as prayed and check if all prayers are done for today
    const prayersComplete = markPrayed(prayerName);

    const today = toDateKey();
    const alreadyCelebrated = celebratedDate === today;
    const shouldCelebrate = prayersComplete && (!alreadyCelebrated || prayerName === 'Isha');

    if (shouldCelebrate) {
      // Prevent multiple celebrations in a day
      if (!alreadyCelebrated) setCelebrated(today);
      // Haptic feedback for celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Get a random celebration message variant for the current language
      const variants = PRAYER_CELEBRATIONS_TR[language] ?? PRAYER_CELEBRATIONS_TR['en'];
      const variant = variants[Math.floor(Math.random() * variants.length)];

      // Show celebration modal
      useModalStore.getState().show({
        type: 'alert',
        component: (
          <View style={styles.celebrationContainer}>
            <Text style={styles.celebrationEmoji}>{variant.emoji}</Text>
            <Text style={[styles.celebrationTitle, { color: theme.text2 }]}>{variant.title}</Text>
            <Text style={[styles.celebrationMessage, { color: theme.textMuted }]}>{variant.message}</Text>
          </View>
        ),
        buttons: [{
          label: 'OK',
          action: 'ok',
          buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
          labelStyle: { fontSize: 16, fontWeight: '600', color: theme.accent },
        }],
      });
    }
  }, [markPrayed, unmarkPrayed, celebratedDate, setCelebrated, theme]);

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
                    handleMark(prayerName as PrayerName, isPrayed, isPast, isCurrent);
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
  // Container
  container: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 7,
    gap: 7,
  },

  // Prayer Row
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

  // Notification Icon
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

  // Celebration Modal
  celebrationContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  celebrationEmoji: {
    fontSize: 44,
    lineHeight: 56,
  },
  celebrationTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  celebrationMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
