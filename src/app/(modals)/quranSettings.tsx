import AppCard from "@/components/AppCard";
import ModalSheet, { ModalSheetRef } from "@/components/ModalSheet";
import { getPrayerTimes } from "@/services/prayersService";
import { useLanguageStore } from "@/store/languageStore";
import { useLocationStore } from "@/store/locationStore";
import { useThemeStore } from "@/store/themeStore";
import { PrayerTimeEntry, PrayerTimes } from "@/types/prayer.types";
import { IconProps } from "@/types/types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function QuranSettingsScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const location = useLocationStore((state) => state.location);
  const timeZone = useLocationStore((state) => state.timeZone);

  // Local state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prayerTimesByDate, setPrayerTimesByDate] = useState<PrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs
  const ModalSheetRef = useRef<ModalSheetRef>(null);

  // ------------------------------------------------------------
  // Fetch prayer times by date
  // ------------------------------------------------------------
  const fetchPrayerTimesForDate = async (date: Date) => {
    if (!location) return;

    setIsLoading(true);
    try {
      // Compute today's timestamp in user's local timezone
      const localDate = new Date(date);
      localDate.setHours(0, 0, 0, 0);
      const timestamp = Math.floor(localDate.getTime() / 1000);

      const times = await getPrayerTimes(location, timestamp);
      setPrayerTimesByDate(times);
    } catch (err) {
      console.warn("⚠️ [prayerTimings] Failed to fetch prayer times from API:", err);
      setPrayerTimesByDate(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------
  // When date changes (arrows or picker)
  // ------------------------------------------------------------
  useEffect(() => {
    if (location) {
      fetchPrayerTimesForDate(selectedDate);
    }
  }, [selectedDate, location]);

  // ------------------------------------------------------------
  // Change date by offset
  // ------------------------------------------------------------
  const changeDate = (dayOffset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + dayOffset);
    setSelectedDate(newDate);
  };

  // ------------------------------------------------------------
  // Handle date picker change
  // ------------------------------------------------------------
  const onDateChange = (event: any, date?: Date) => {
    // Android: always close the modal dialog immediately
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !date) return;

    // Only update if the date actually changed
    if (
      date.getFullYear() !== selectedDate.getFullYear() ||
      date.getMonth() !== selectedDate.getMonth() ||
      date.getDate() !== selectedDate.getDate()
    ) {
      setSelectedDate(date);
    }

    // iOS: close only after a valid date is confirmed
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  // ------------------------------------------------------------
  // Check if selected date is today
  // ------------------------------------------------------------
  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  // ------------------------------------------------------------
  // Handle close
  // ------------------------------------------------------------
  const handleClose = () => {
    ModalSheetRef.current?.close();
  }

  // ------------------------------------------------------------
  // Prayer name icon
  // ------------------------------------------------------------
  const handlePrayerNameIcon = (prayerName: string) => {
    const pn = prayerName.toLowerCase();

    if (pn.includes("imsak")) return (props: IconProps) => <Ionicons name="time-outline" {...props} />;
    if (pn.includes("fajr")) return (props: IconProps) => <Ionicons name="moon-outline" {...props} />;
    if (pn.includes("sunrise")) return (props: IconProps) => <MaterialCommunityIcons name="weather-sunset-up" {...props} />;
    if (pn.includes("dhuhr")) return (props: IconProps) => <Ionicons name="sunny" {...props} />;
    if (pn.includes("asr")) return (props: IconProps) => <Ionicons name="partly-sunny-outline" {...props} />;
    if (pn.includes("maghrib")) return (props: IconProps) => <MaterialCommunityIcons name="weather-sunset-down" {...props} />;
    if (pn.includes("isha")) return (props: IconProps) => <Ionicons name="moon-sharp" {...props} />;

    return (props: IconProps) => <Ionicons name="time-outline" {...props} />;
  };

  // ------------------------------------------------------------
  // Compute prayer entries (cleaner approach)
  // ------------------------------------------------------------
  const prayerEntries = prayerTimesByDate
    ? (Object.entries(prayerTimesByDate) as PrayerTimeEntry[])
    : [];

  // Fixed Footer with Close/Today buttons
  const FixedFooter = () => {
    return (
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleClose}
        >
          <Text style={[styles.buttonText, { color: theme.text2 }]}>
            {tr.buttons.cancel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.todayButton,
            { backgroundColor: isToday() ? theme.overlay : theme.accent2 }
          ]}
          onPress={() => setSelectedDate(new Date())}
          disabled={isToday()}
        >
          <Ionicons name="today" size={20} color={isToday() ? theme.placeholder : theme.text} />
          <Text style={[styles.buttonText, { color: isToday() ? theme.placeholder : theme.text }]}>
            {tr.buttons.today}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Main Content
  return (
    <ModalSheet
      ref={ModalSheetRef}
      size="xlx"
      colors={{ sheetBackgroundColor: theme.bg2, handleColor: theme.handle }}
      footer={<FixedFooter />}
    >

      <View style={styles.container}>
        {/* Prayer Times Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: theme.accent }]}>
            Cilësimet e Kur'anit
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.text2, opacity: 0.7 }]}>
            Këtu mund të personalizoni përvojën tuaj me Kur'anin
          </Text>
        </View>

        {/* PRAYER TIMES CARD */}
        <AppCard>
          {/* Prayers List */}
          <Text style={{ padding: 24, textAlign: 'center', color: theme.text2 }}>
            Quran Settings...
          </Text>
        </AppCard>

      </View>

    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 14,
  },

  // Header styles
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
  },

  // Footer styles
  footer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 6,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});