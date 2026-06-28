import PrayerRow from '@/components/PrayerRow';
import { globalStyles } from '@/constants/styles';
import { PRAYER_CELEBRATIONS_TR } from '@/constants/translations/celebrations.tr';
import { useDebugStore } from '@/debug/debugStore';
import { useDeviceSettingsStore } from '@/store/deviceSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { useNotificationsStore } from '@/store/notificationsStore';
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { PrayerEventType, PrayerType } from '@/types/notification.types';
import { MAIN_PRAYERS, PrayerName, PrayerTimeEntry, PrayerTimes } from '@/types/prayer.types';
import { isTimePast, toDateKey } from '@/utils/datetime';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  prayerTimes: PrayerTimes;
  prayerTimesDate: string | null;
  currentPrayerName: PrayerName | null;
}

const PrayersList = React.memo(({ prayerTimes, prayerTimesDate, currentPrayerName }: Props) => {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);
  const prayers = useNotificationsStore((state) => state.prayers);
  const events = useNotificationsStore((state) => state.events);
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  // Prayers Tracking store
  const tracking = usePrayersTrackingStore((state) => state.tracking);
  const markPrayed = usePrayersTrackingStore((state) => state.markPrayed);
  const unmarkPrayed = usePrayersTrackingStore((state) => state.unmarkPrayed);
  const celebratedDate = usePrayersTrackingStore((state) => state.celebratedDate);
  const setCelebrated = usePrayersTrackingStore((state) => state.setCelebrated);

  // DEBUG: force-show the Friday "Xhumaja" badge on any day (Debug Panel toggle)
  const forceFriday = useDebugStore((state) => state.forceFriday);

  // ------------------------------------------------------------
  // Handle marking/unmarking prayers as prayed and show celebration modal
  // ------------------------------------------------------------
  const handleMark = useCallback(async (prayerName: PrayerName, isPrayed: boolean, isPast: boolean, isCurrent: boolean) => {
    if (!isPast && !isCurrent) return;

    // If already marked as prayed, unmark it
    if (isPrayed) {
      unmarkPrayed(prayerName);
      return;
    }
    // Mark as prayed and check if all prayers are done for today
    const prayersComplete = await markPrayed(prayerName);

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
          <View style={globalStyles.bannerContainer}>
            <Text style={globalStyles.bannerEmoji}>{variant.emoji}</Text>
            <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{variant.title}</Text>
            <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{variant.message}</Text>
          </View>
        ),
        buttons: [{
          label: 'OK',
          action: 'ok',
          buttonStyle: { backgroundColor: theme.accentLight, borderWidth: 1, borderColor: theme.divider2 },
          labelStyle: { fontSize: 16, fontWeight: '600', color: theme.accent },
        }],
        celebrationAnimation: true,
      });
    }
  }, [markPrayed, unmarkPrayed, celebratedDate, setCelebrated, theme]);

  // ------------------------------------------------------------
  // Notification bell state per prayer (settings → off / on / custom-offset)
  // ------------------------------------------------------------
  const getNotifState = (name: string): 'off' | 'on' | 'custom' => {
    // Use prayer settings if available, fall back to event settings (Imsak, Sunrise)
    const settings = prayers?.[name as PrayerType] || events?.[name as PrayerEventType];
    if (!notificationPermission || !settings?.enabled) return 'off';
    return settings.offset === 0 ? 'on' : 'custom';
  };

  return (
    <View style={styles.container}>

      {(Object.entries(prayerTimes) as PrayerTimeEntry[]).map(([prayerName, prayerTime]) => {
        const isTrackable = MAIN_PRAYERS.includes(prayerName as PrayerName);
        const isToday = prayerTimesDate === toDateKey();
        const isPast = isTrackable && isToday && isTimePast(prayerTime);
        const isCurrent = isToday && currentPrayerName === prayerName;
        const isFriday = forceFriday || (prayerTimesDate != null && new Date(prayerTimesDate).getDay() === 5); // 0=Sun, 1=Mon, ..., 5=Fri
        const isPrayed = isTrackable && tracking[toDateKey()]?.[prayerName] === 'prayed';

        return (
          <PrayerRow
            key={prayerName}
            prayerName={prayerName}
            prayerTime={prayerTime}
            isTrackable={isTrackable}
            isPrayed={isPrayed}
            isCurrent={isCurrent}
            isFriday={isFriday}
            variant="card"
            notifState={getNotifState(prayerName)}
            onPress={() => handleMark(prayerName as PrayerName, isPrayed, isPast, isCurrent)}
            onNotifIconPress={() => router.navigate(`/(modals)/prayerNotification?prayer=${prayerName}`)}
          />
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
});
