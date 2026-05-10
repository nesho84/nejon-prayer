import { useDeviceSettingsStore } from "@/store/deviceSettingsStore";
import { useNotificationsStore } from "@/store/notificationsStore";
import { PrayerEventType, PrayerType } from "@/types/notification.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  prayerName: string;
  size: number;
  color: string;
}

// ------------------------------------------------------------
// Renders the correct bell icon for a prayer or event row based on
// notification permission and the prayer/event's enabled + offset settings.
// Reads store state internally — caller only needs to pass prayerName, size, color.
// ------------------------------------------------------------
export default function PrayerNotifIcon({ prayerName, size, color }: Props) {
  // Stores
  const notificationPermission = useDeviceSettingsStore((state) => state.notificationPermission);
  const prayers = useNotificationsStore((state) => state.prayers);
  const events = useNotificationsStore((state) => state.events);

  // Use prayer settings if available, fall back to event settings (Imsak, Sunrise)
  const settings = prayers?.[prayerName as PrayerType] || events?.[prayerName as PrayerEventType];

  if (!notificationPermission || !settings?.enabled)
    return <MaterialCommunityIcons name="bell-off-outline" size={size} color={color} style={{ opacity: 0.3, paddingBottom: 1 }} />;
  if (settings.offset === 0)
    return <MaterialCommunityIcons name="bell-outline" size={size} color={color} style={{ opacity: 0.6, paddingBottom: 1 }} />;
  return <MaterialCommunityIcons name="bell-cog-outline" size={size} color={color} style={{ opacity: 0.6, paddingBottom: 1 }} />;
}
