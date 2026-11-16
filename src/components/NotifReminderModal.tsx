import { globalStyles } from "@/constants/styles";
import { DAY_MS, NOTIF_REMINDER_MAX_SHOWS, NOTIF_REMINDER_WAIT_DAYS, useAutoModalsStore } from "@/store/autoModalsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { openNotificationSettings } from "@/utils/system";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { ComponentProps } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import notifee, { AuthorizationStatus } from "react-native-notify-kit";

type MCIcon = ComponentProps<typeof MaterialDesignIcons>["name"];

// ------------------------------------------------------------
// Show the reminder modal — no checks (canShowNotifReminder runs at launch)
// ------------------------------------------------------------
export function showNotifReminderModal() {
  const { notifReminderShownCount, setAutoModals } = useAutoModalsStore.getState();
  const tr = useLanguageStore.getState().tr;
  const theme = useThemeStore.getState().theme;
  const { hide } = useModalStore.getState();

  setAutoModals({
    notifReminderShownAt: Date.now(),
    notifReminderShownCount: notifReminderShownCount + 1,
    // Shown 3 times — stopped for good (until granted and turned off again)
    notifReminderDone: notifReminderShownCount + 1 >= NOTIF_REMINDER_MAX_SHOWS,
  });

  // Both buttons count as a close — the 3rd show has no next wait, Done stops it
  const recordClose = () => {
    setAutoModals({ notifReminderNextShowAt: Date.now() + (NOTIF_REMINDER_WAIT_DAYS[notifReminderShownCount] ?? 0) * DAY_MS });
  };

  const benefits: { icon: MCIcon; text: string }[] = [
    { icon: "clock-outline", text: tr.labels.notifReminderPrayers },
    { icon: "volume-high", text: tr.labels.notifReminderSound },
    { icon: "mosque", text: tr.labels.notifReminderFriday },
    { icon: "book-open-page-variant-outline", text: tr.labels.notifReminderDaily },
    { icon: "star-crescent", text: tr.labels.notifReminderHolidays },
  ];

  useModalStore.getState().show({
    type: "alert",
    // Only the buttons close it — so every close records a choice
    dismissable: false,
    component: (
      <>
        {/* Bell + text + benefits */}
        <View style={globalStyles.bannerContainer}>
          <View style={[styles.modalIconCircle, { backgroundColor: theme.islamicGreen + "20" }]}>
            <MaterialDesignIcons name="bell-ring-outline" size={40} color={theme.islamicGreen} />
          </View>
          <Text style={[globalStyles.bannerTitle, { color: theme.text }]}>{tr.labels.notifReminderTitle}</Text>
          <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.notifReminderMessage}</Text>

          <View style={styles.benefits}>
            {benefits.map(({ icon, text }) => (
              <View key={icon} style={styles.benefitRow}>
                <MaterialDesignIcons name={icon} size={20} color={theme.islamicGreen} />
                <Text style={[styles.benefitText, { color: theme.text2 }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Buttons — outside bannerContainer, so the bottom space matches the other modals */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.islamicGreen + "20", borderWidth: 1, borderColor: theme.islamicGreen + "40" }]}
            activeOpacity={0.8}
            onPress={async () => {
              recordClose();
              hide("enable");
              try {
                const settings = await notifee.requestPermission();
                if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
                  // No system dialog possible anymore → offer system settings
                  Alert.alert(
                    tr.labels.notificationsDisabled,
                    tr.labels.notificationsDisabledMessage,
                    [
                      { text: tr.buttons.cancel, style: "cancel" },
                      { text: tr.buttons.openSettings, onPress: openNotificationSettings },
                    ]
                  );
                }
              } catch (err) {
                console.error("❌ [NotifReminder] Notification permission request failed:", err);
              }
            }}
          >
            <Text style={[styles.buttonText, { color: theme.islamicGreen }]}>{tr.buttons.enableNotifications}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { borderWidth: 1, borderColor: theme.border }]}
            activeOpacity={0.6}
            onPress={() => {
              recordClose();
              hide("notNow");
            }}
          >
            <Text style={[styles.buttonText, { color: theme.placeholder }]}>{tr.buttons.notNow}</Text>
          </TouchableOpacity>
        </View>
      </>
    ),
  });
}

const styles = StyleSheet.create({
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  benefits: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  buttons: {
    gap: 10,
  },
  button: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
