import AppCard from "@/components/AppCard";
import ModalSheet, { ModalSheetRef } from "@/components/ModalSheet";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import Slider from '@react-native-community/slider';
import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ARABIC_MIN = 18;
const ARABIC_MAX = 40;
const TRANSLATION_MIN = 12;
const TRANSLATION_MAX = 30;

export default function QuranSettingsScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const arabicFontSize = useQuranStore((state) => state.arabicFontSize);
  const translationFontSize = useQuranStore((state) => state.translationFontSize);

  // Local state (preview before saving)
  const [tempArabicSize, setTempArabicSize] = useState(arabicFontSize);
  const [tempTranslationSize, setTempTranslationSize] = useState(translationFontSize);

  // Refs
  const ModalSheetRef = useRef<ModalSheetRef>(null);

  // ------------------------------------------------------------
  // Save changes to store and dismiss the Modal
  // ------------------------------------------------------------
  const handleSave = () => {
    if (tempArabicSize === arabicFontSize && tempTranslationSize === translationFontSize) {
      console.log("No changes detected, skipping save.");
      ModalSheetRef.current?.close();
      return;
    }
    useQuranStore.getState().setQuranSettings({
      arabicFontSize: tempArabicSize,
      translationFontSize: tempTranslationSize,
    });
    console.log(`✅ Quran settings saved — Arabic: ${tempArabicSize}px, Translation: ${tempTranslationSize}px`);
    ModalSheetRef.current?.close();
  };

  // ------------------------------------------------------------
  // Handle close
  // ------------------------------------------------------------
  const handleCancel = () => {
    ModalSheetRef.current?.close();
  };

  // Fixed Footer with Cancel/Save buttons
  const FixedFooter = () => {
    return (
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={[styles.buttonText, { color: theme.text2 }]}>
            {tr.buttons.cancel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, { backgroundColor: theme.overlay }]}
          onPress={handleSave}
        >
          <Text style={[styles.buttonText, { color: theme.accent }]}>
            {tr.buttons.save}
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
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: theme.accent }]}>
            {tr.labels.quranSettingsTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.text2, opacity: 0.7 }]}>
            {tr.labels.quranSettingsSubtitle}
          </Text>
        </View>

        {/* ------ Arabic Font Size ------ */}
        <AppCard style={styles.settingCard}>
          <View style={styles.statusRow}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              {tr.labels.quranArabic} (العربية):
            </Text>
            <Text style={{ color: theme.text2, opacity: 0.7 }}>
              {tempArabicSize}px
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={ARABIC_MIN}
            maximumValue={ARABIC_MAX}
            step={1}
            value={tempArabicSize}
            onValueChange={(v) => { setTempArabicSize(v) }}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.overlay}
            thumbTintColor={theme.accent}
            tapToSeek={true}
          />
          {/* Arabic Preview */}
          <View style={[styles.previewContainer, { backgroundColor: theme.overlay, borderColor: theme.divider2 }]}>
            <Text style={[styles.previewArabic, { color: theme.accent, fontSize: tempArabicSize, lineHeight: tempArabicSize * 1.85 }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { borderColor: theme.divider }]}></View>

          {/* ------ Translation Font Size ------ */}
          <View style={styles.statusRow}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              {tr.labels.quranTranslation}:
            </Text>
            <Text style={{ color: theme.text2, opacity: 0.7 }}>
              {tempTranslationSize}px
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={TRANSLATION_MIN}
            maximumValue={TRANSLATION_MAX}
            step={1}
            value={tempTranslationSize}
            onValueChange={(v) => { setTempTranslationSize(v) }}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.overlay}
            thumbTintColor={theme.accent}
            tapToSeek={true}
          />
          {/* Translation Preview */}
          <View style={[styles.previewContainer, { backgroundColor: theme.overlay, borderColor: theme.divider2 }]}>
            <Text style={[styles.previewTranslation, { color: theme.text, fontSize: tempTranslationSize, lineHeight: tempTranslationSize * 1.55 }]}>
              {tr.labels.quranPreviewTranslation}
            </Text>
          </View>
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

  // Settings Card
  settingCard: {
    paddingHorizontal: 14,
    paddingVertical: 28,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 50,
    marginTop: 8,
    marginBottom: 3,
    marginHorizontal: -8,
  },
  divider: {
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 24,
    marginHorizontal: 4,
  },

  // Preview
  previewContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewArabic: {
    textAlign: 'center',
  },
  previewTranslation: {
    textAlign: 'center',
  },

  // Footer styles
  footer: {
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
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});