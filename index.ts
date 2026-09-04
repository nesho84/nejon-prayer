import { PrayerName } from '@/types/prayer.types';
import { toDateKey } from '@/utils/datetime';
import { resolveTrackingDate } from '@/utils/tracking';
import notifee, { EventType } from 'react-native-notify-kit';
import { handleNotificationEvent } from './src/services/notificationsService';
import { useNotificationsStore } from './src/store/notificationsStore';
import { usePrayersStore } from './src/store/prayersStore';
import { usePrayersTrackingStore } from './src/store/prayersTrackingStore';

// Must stay last — registers the app entry after all side effects (Expo docs)
import 'expo-router/entry';

// ------------------------------------------------------------
// 'Notifee' - BACKGROUND event handler
// Listens for notification events, while the app is in the background or killed
// ------------------------------------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    if (!notification) return;

    // Keeps notifications on the latest prayer times — done here to avoid the
    // store ↔ service circular dependency
    // onBackgroundEvent only fires for our own notifee notifications, so any delivery is a valid sync trigger.
    if (type === EventType.DELIVERED) {
        try {
            await useNotificationsStore.getState().syncNotificationsInBackground();
        } catch (err) {
            console.error('❌ [index.ts:Background] Failed to sync notifications in background:', err);
        }
    }

    // Prayer tracking on 'done' action — done here to avoid circular dependency (store ↔ service)
    if (type === EventType.ACTION_PRESS && pressAction?.id === 'done') {
        try {
            const prayerName = notification.data?.prayerName as PrayerName | undefined;
            if (prayerName) {
                const today = toDateKey();
                const fajrTime = usePrayersStore.getState().yearlyPrayerTimes?.[today]?.Fajr;
                const dateToUse = resolveTrackingDate(prayerName, fajrTime);
                await usePrayersTrackingStore.getState().markPrayed(prayerName, dateToUse, 'notif-bg');
            }
        } catch (err) {
            console.error('❌ [index.ts:Background] Failed to mark prayer as prayed:', err);
        }
    }

    // Handled in notificationsService for both foreground and background
    try {
        await handleNotificationEvent(
            type,
            notification,
            pressAction,
            'background',
            useNotificationsStore.getState().notifSettings
        );
    } catch (err) {
        console.error('❌ [index.ts:Background] Failed to handle notification event:', err);
    }
});
