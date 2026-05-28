import AppCard from "@/components/AppCard";
import ModalSheet, { ModalSheetRef } from "@/components/ModalSheet";
import { globalStyles } from "@/constants/styles";
import { QURAN_TEXT_EDITIONS } from "@/services/quranService";
import { useLanguageStore } from "@/store/languageStore";
import { useQuranStore } from "@/store/quranStore";
import { useThemeStore } from "@/store/themeStore";
import Slider from '@react-native-community/slider';
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ARABIC_MIN = 18;
const ARABIC_MAX = 40;
const TRANSLATION_MIN = 12;
const TRANSLATION_MAX = 30;

export default function QuranSettingsScreen() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);
  const language = useLanguageStore((state) => state.language);
  const arabicFontSize = useQuranStore((state) => state.arabicFontSize);
  const translationFontSize = useQuranStore((state) => state.translationFontSize);
  const selectedEditions = useQuranStore((state) => state.selectedEditions);

  // Local state (preview before saving)
  const [tempArabicSize, setTempArabicSize] = useState(arabicFontSize);
  const [tempTranslationSize, setTempTranslationSize] = useState(translationFontSize);
  const [tempSelectedEdition, setTempSelectedEdition] = useState(selectedEditions[language]);

  // Refs
  const ModalSheetRef = useRef<ModalSheetRef>(null);

  // ------------------------------------------------------------
  // Save changes to store and dismiss the Modal
  // ------------------------------------------------------------
  const handleSave = () => {
    if (tempArabicSize === arabicFontSize && tempTranslationSize === translationFontSize && tempSelectedEdition === selectedEditions[language]) {
      console.log("No changes detected, skipping save.");
      ModalSheetRef.current?.close();
      return;
    }
    useQuranStore.getState().setQuranSettings({
      arabicFontSize: tempArabicSize,
      translationFontSize: tempTranslationSize,
      ...(tempSelectedEdition !== selectedEditions[language] && {
        selectedEditions: { ...selectedEditions, [language]: tempSelectedEdition },
      }),
    });
    console.log(`✅ Quran settings saved — Arabic: ${tempArabicSize}px, Translation: ${tempTranslationSize}px, Edition: ${tempSelectedEdition}`);
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
      <View style={[globalStyles.modalFooter, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
        <TouchableOpacity
          style={[globalStyles.modalButton, globalStyles.modalCancelButton]}
          onPress={handleCancel}
        >
          <Text style={[globalStyles.modalButtonText, { color: theme.text2 }]}>
            {tr.buttons.cancel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.modalButton, styles.saveButton, { backgroundColor: theme.overlay }]}
          onPress={handleSave}
        >
          <Text style={[globalStyles.modalButtonText, { color: theme.accent }]}>
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

      <View style={globalStyles.modalContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: theme.accent }]}>
            {tr.labels.quranSettingsTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {tr.labels.quranSettingsSubtitle}
          </Text>
        </View>

        {/* ------ Translator / Edition — hidden for Arabic ------ */}
        {language !== 'ar' && (
          <AppCard style={[styles.settingCard, styles.translatorCard]}>
            <View style={styles.statusRow}>
              <Text style={[styles.settingTitle, { color: theme.text2, marginBottom: 2 }]}>
                {tr.labels.quranTranslator}:
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {Object.entries(QURAN_TEXT_EDITIONS[language as keyof typeof QURAN_TEXT_EDITIONS] ?? {}).map(([key, value]) => {
                const isActive = tempSelectedEdition === value;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setTempSelectedEdition(value)}
                    style={[styles.chip, { borderColor: isActive ? theme.accent : theme.divider, backgroundColor: isActive ? theme.overlayLight : 'transparent' }]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? theme.accent : theme.text2 }]}>
                      {/* capitalize the first letter after the dot: "sq.ahmeti" → "sq.Ahmeti" */}
                      {value.replace(/\.(\w)/, (_, c) => '.' + c.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AppCard>
        )}

        {/* ------ Arabic Font Size ------ */}
        <AppCard style={[styles.settingCard, styles.fontSizeCard]}>
          <Text style={[styles.settingTitle, { color: theme.text2, paddingHorizontal: 8, marginBottom: 16 }]}>
            {tr.labels.quranFontSizeTitle}:
          </Text>
          <View style={styles.statusRow}>
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
              {tr.labels.quranArabic} (العربية):
            </Text>
            <Text style={{ color: theme.textMuted }}>
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
          <View style={[styles.previewContainer, { backgroundColor: theme.overlayLight, borderColor: theme.divider2 }]}>
            <Text style={[styles.previewArabic, { color: theme.accent, fontSize: tempArabicSize, lineHeight: tempArabicSize * 1.85 }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { borderColor: theme.divider }]}></View>

          {/* ------ Translation Font Size ------ */}
          <View style={styles.statusRow}>
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
              {tr.labels.quranTranslation}:
            </Text>
            <Text style={{ color: theme.textMuted }}>
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
          <View style={[styles.previewContainer, { backgroundColor: theme.overlayLight, borderColor: theme.divider2 }]}>
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
  settingSubtitle: {
    fontSize: 15,
    fontWeight: '500',
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
    marginTop: 3,
    marginBottom: 3,
    marginHorizontal: -8,
  },
  divider: {
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 20,
    marginHorizontal: 4,
  },

  // Preview
  previewContainer: {
    marginTop: 8,
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

  // Translator chips
  translatorCard: {
    paddingVertical: 18,
  },
  fontSizeCard: {
    paddingTop: 18,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Footer
  saveButton: {},
});