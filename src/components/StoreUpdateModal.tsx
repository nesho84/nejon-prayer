import { globalStyles } from "@/constants/styles";
import { DAY_MS, STORE_UPDATE_NEXT_LAUNCH_SHOWS, STORE_UPDATE_WAIT_DAYS, useAutoModalsStore } from "@/store/autoModalsStore";
import { useLanguageStore } from "@/store/languageStore";
import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { openStoreListing } from "@/utils/system";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { StyleSheet, Text, View } from "react-native";

// ------------------------------------------------------------
// Show the "Update available" modal — no checks (canShowStoreUpdate runs at launch).
// Recorded on show, since tapping outside closes it too; from Settings nothing is recorded.
// ------------------------------------------------------------
export function showStoreUpdateModal(fromSettings = false) {
  const { storeUpdateShownCount, setAutoModals } = useAutoModalsStore.getState();
  const tr = useLanguageStore.getState().tr;
  const theme = useThemeStore.getState().theme;

  if (!fromSettings) {
    setAutoModals({
      storeUpdateShownAt: Date.now(),
      storeUpdateShownCount: storeUpdateShownCount + 1,
      // Shows 1 and 2 come back next launch, then every 3 days
      storeUpdateNextShowAt: storeUpdateShownCount + 1 <= STORE_UPDATE_NEXT_LAUNCH_SHOWS ? null : Date.now() + STORE_UPDATE_WAIT_DAYS * DAY_MS,
    });
  }

  useModalStore.getState().show({
    type: "alert",
    component: (
      <View style={globalStyles.bannerContainer}>
        <View style={[styles.modalIconCircle, { backgroundColor: theme.islamicGreen + "20" }]}>
          <MaterialDesignIcons name="information-variant-circle" size={32} color={theme.islamicGreen} />
        </View>
        <Text style={[globalStyles.bannerTitle, { color: theme.text2 }]}>{tr.labels.updateAvailableTitle}</Text>
        <Text style={[globalStyles.bannerMessage, { color: theme.textMuted }]}>{tr.labels.updateAvailableMessage}</Text>
      </View>
    ),
    buttons: [
      {
        label: tr.buttons.later,
        action: "later",
        buttonStyle: { backgroundColor: theme.overlay },
        labelStyle: { color: theme.text2 },
      },
      {
        label: tr.buttons.openStore,
        action: "openStore",
        onPress: openStoreListing,
        buttonStyle: { backgroundColor: theme.islamicGreen + "20", borderWidth: 1, borderColor: theme.islamicGreen + "40" },
        labelStyle: { color: theme.islamicGreen },
      },
    ],
  });
}

const styles = StyleSheet.create({
  modalIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
