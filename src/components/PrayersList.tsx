import PrayerIcon from '@/components/PrayerIcon';
import { globalStyles } from '@/constants/styles';
import { PRAYER_CELEBRATIONS_TR } from '@/constants/translations/celebrations.tr';
import { useDebugStore } from '@/debug/debugStore';
import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useLanguageStore } from '@/store/languageStore';
import { useModalStore } from '@/store/modalStore';
import { useNotificationsStore } from "@/store/notificationsStore";
import { usePrayersTrackingStore } from '@/store/prayersTrackingStore';
import { useThemeStore } from '@/store/themeStore';
import { PrayerEventType, PrayerType } from "@/types/notification.types";
import { MAIN_PRAYERS, PrayerName, PrayerTimeEntry, PrayerTimes } from '@/types/prayer.types';
import { isTimePast, toDateKey } from '@/utils/datetime';
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
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
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  const prayers = useNotificationsStore((state) => state.prayers);
  const events = useNotificationsStore((state) => state.events);
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
  // Renders the correct prayer notification icon based on the prayer settings and permission
  // ------------------------------------------------------------
  const renderNotifIcon = (prayerName: string, size: number, color: string) => {
    // Use prayer settings if available, fall back to event settings (Imsak, Sunrise)
    const settings = prayers?.[prayerName as PrayerType] || events?.[prayerName as PrayerEventType];

    if (!notificationPermission || !settings?.enabled) {
      return <MaterialDesignIcons name="bell-off-outline" size={size} color={color} style={{ opacity: 0.3, paddingBottom: 1 }} />;
    }
    if (settings.offset === 0) {
      return <MaterialDesignIcons name="bell-outline" size={size} color={color} style={{ opacity: 0.6, paddingBottom: 1 }} />;
    }
    return <MaterialDesignIcons name="bell-cog-outline" size={size} color={color} style={{ opacity: 0.6, paddingBottom: 1 }} />;
  };

  // ------------------------------------------------------------
  // Renders the prayer tracking circle (prayed checkmark vs empty ring)
  // ------------------------------------------------------------
  const renderTrackingIcon = (isPrayed: boolean, isCurrent: boolean) => {
    if (!isPrayed) {
      return <View style={[styles.trackCircle, { borderColor: isCurrent ? theme.placeholder : theme.borderCard }]} />;
    }
    return (
      <View style={[styles.trackCircle, { backgroundColor: theme.green, borderColor: theme.green, opacity: 0.7 }]}>
        <MaterialDesignIcons name="check-bold" size={11} color={theme.white} />
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {(Object.entries(prayerTimes) as PrayerTimeEntry[]).map(([prayerName, prayerTime], index, arr) => {
        const isTrackable = MAIN_PRAYERS.includes(prayerName as PrayerName);
        const isToday = prayerTimesDate === toDateKey();
        const isPast = isTrackable && isToday && isTimePast(prayerTime);
        const isCurrent = isToday && currentPrayerName === prayerName;
        const isLast = index === arr.length - 1;
        const isFriday = forceFriday || (prayerTimesDate != null && new Date(prayerTimesDate).getDay() === 5); // 0=Sun, 1=Mon, ..., 5=Fri
        const isPrayed = isTrackable && tracking[toDateKey()]?.[prayerName] === 'prayed';

        return (
          <View key={prayerName} style={!isLast && { marginBottom: 0 }}>
            {/* Prayer row card */}
            <View
              style={[
                styles.prayerRow,
                {
                  backgroundColor: isCurrent ? theme.accentLight : theme.card,
                  borderColor: isCurrent ? theme.accentLight : theme.borderCard,
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
                  {renderTrackingIcon(isPrayed, isCurrent)}
                  {/* Prayer Name Text */}
                  <Text style={[styles.prayerNameText, { color: isCurrent ? theme.accent : theme.text2 }]}>
                    {tr.prayers[prayerName] || prayerName}
                  </Text>
                  {/* Prayer Name Icon */}
                  <PrayerIcon name={prayerName} size={18} color={isCurrent ? theme.accent : theme.text2} opacity={0.7} />

                  {/* Xhumaja badge — Fridays only */}
                  {prayerName === 'Dhuhr' && isFriday && (
                    <View style={[
                      styles.xhumaBadge,
                      {
                        backgroundColor: isCurrent ? theme.accentLight : theme.surfaceBg,
                        borderColor: isCurrent ? theme.accentLight : theme.divider2,
                      }
                    ]}>
                      <Text style={[
                        styles.xhumaBadgeText,
                        { color: isCurrent ? theme.accent : theme.islamicGreen, opacity: isCurrent ? 1 : 0.9 }
                      ]}>
                        {tr.labels.jummah ?? 'Xhumaja'}
                      </Text>
                    </View>
                  )}
                  {/* Horizontal Spacer */}
                  <View style={{ flex: 1 }} />
                  {/* Prayer Time */}
                  <Text style={[styles.prayerTimeText, { color: isCurrent ? theme.accent : theme.text2 }]}>
                    {prayerTime}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.prayerRowLeft, { opacity: 0.4 }]}>
                  {/* Left: Dash placeholder */}
                  <MaterialDesignIcons name="minus" size={18} color={theme.placeholder} />
                  {/* Prayer Name Text */}
                  <Text style={[styles.prayerNameText, { color: theme.text2 }]}>
                    {tr.prayers[prayerName] || prayerName}
                  </Text>
                  {/* Prayer Name Icon */}
                  <PrayerIcon name={prayerName} size={18} color={theme.text2} />
                  {/* Horizontal Spacer */}
                  <View style={{ flex: 1 }} />
                  {/* Prayer Time */}
                  <Text style={[styles.prayerTimeText, { color: theme.text2 }]}>{prayerTime}</Text>
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
                  {renderNotifIcon(prayerName, 20, theme.text2)}
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
    gap: 11,
  },
  trackCircle: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
  },
  prayerNameText: {
    fontSize: 16,
    fontWeight: '500',
    includeFontPadding: false,
  },
  prayerTimeText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    includeFontPadding: false,
    marginRight: 4,
  },

  // Xhumaja Badge (Fridays only)
  xhumaBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    gap: 8,
  },
  xhumaBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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

});
