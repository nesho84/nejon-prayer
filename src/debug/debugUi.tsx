import { useModalStore } from "@/store/modalStore";
import { useThemeStore } from "@/store/themeStore";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import * as Clipboard from "expo-clipboard";
import { ReactNode, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ToggleProps {
  label: string;
  color?: string;
  value: boolean;
  hint?: string;
  onPress: () => void;
}

interface ButtonProps {
  label: string;
  color: string;
  right?: ReactNode;
  hint?: string;
  onPress: () => void;
}

interface InfoButtonProps {
  active: boolean;
  onPress: () => void;
}

interface HintProps {
  text: string;
}

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
}

interface JsonViewerProps {
  json: string;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface ModalHeadProps {
  title: string;
  hint: string;
}

// ------------------------------------------------------------
// Small rounded status badge (ON/OFF state, delay seconds, …)
// ------------------------------------------------------------
export function Badge({ label, color, bg }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------
// ⓘ button that toggles a hint
// ------------------------------------------------------------
function InfoButton({ active, onPress }: InfoButtonProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <TouchableOpacity
      style={[styles.infoButton, active && { backgroundColor: theme.pressed }]}
      activeOpacity={0.6}
      hitSlop={8}
      onPress={onPress}
    >
      <MaterialDesignIcons name="information-outline" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

// ------------------------------------------------------------
// Explanation shown under a row or auto-modal title
// ------------------------------------------------------------
function Hint({ text }: HintProps) {
  const theme = useThemeStore((state) => state.theme);
  return <Text style={[styles.hint, { color: theme.danger, backgroundColor: theme.overlayLight }]}>{text}</Text>;
}

// ------------------------------------------------------------
// Reusable debug row — label on the left, optional ⓘ hint and
// value/indicator (e.g. "10s") on the right
// ------------------------------------------------------------
export function DebugButton({ label, color, right, hint, onPress }: ButtonProps) {
  const theme = useThemeStore((state) => state.theme);
  const [showHint, setShowHint] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.overlayLight }]}
        activeOpacity={0.6}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color }]}>{label}</Text>
        <View style={styles.buttonRight}>
          {hint && <InfoButton active={showHint} onPress={() => setShowHint((v) => !v)} />}
          {right}
        </View>
      </TouchableOpacity>
      {hint && showHint && <Hint text={hint} />}
    </>
  );
}

// ------------------------------------------------------------
// Debug row with an ON / OFF state badge
// ------------------------------------------------------------
export function DebugToggle({ label, color, value, hint, onPress }: ToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <DebugButton
      label={label}
      color={color ?? theme.violet}
      hint={hint}
      onPress={onPress}
      right={
        <Badge
          label={value ? "ON" : "OFF"}
          color={value ? theme.islamicGreen : theme.placeholder}
          bg={value ? theme.islamicGreen + "20" : theme.overlay}
        />
      }
    />
  );
}

// ------------------------------------------------------------
// Feature section — uppercase heading + one card holding its rows
// ------------------------------------------------------------
export function DebugSection({ title, children }: SectionProps) {
  const theme = useThemeStore((state) => state.theme);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>{children}</View>
    </View>
  );
}

// ------------------------------------------------------------
// Auto-modal title with an ⓘ that shows how it works
// ------------------------------------------------------------
export function AutoModalHead({ title, hint }: ModalHeadProps) {
  const theme = useThemeStore((state) => state.theme);
  const [showHint, setShowHint] = useState(false);
  return (
    <>
      <View style={styles.modalHead}>
        <Text style={[styles.modalTitle, { color: theme.text2 }]}>{title}</Text>
        <InfoButton active={showHint} onPress={() => setShowHint((v) => !v)} />
      </View>
      {showHint && <Hint text={hint} />}
    </>
  );
}

// ------------------------------------------------------------
// JSON viewer for debugging: scrollable, selectable, copy-to-clipboard
// ------------------------------------------------------------
function JsonViewer({ json }: JsonViewerProps) {
  const theme = useThemeStore((s) => s.theme);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.bg2 }} contentContainerStyle={{ padding: 6 }}>
        <Text
          selectable
          style={{
            fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
            fontSize: 11,
            color: theme.textMuted,
            lineHeight: 17,
          }}
        >
          {json}
        </Text>
      </ScrollView>
      <TouchableOpacity
        style={[styles.copyBtn, { backgroundColor: theme.green + "20" }]}
        activeOpacity={0.7}
        onPress={handleCopy}
      >
        <Text style={[styles.copyBtnText, { color: theme.green }]}>
          {copied ? "Copied ✓" : "Copy JSON"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ------------------------------------------------------------
// Open a fullscreen JSON viewer modal via ModalProvider
// ------------------------------------------------------------
export const showJsonViewerModal = (title: string, data: object) =>
  useModalStore.getState().show({
    type: "fullscreen",
    showCloseIcon: true,
    title,
    component: <JsonViewer json={JSON.stringify(data, null, 2)} />,
  });

const styles = StyleSheet.create({
  // Feature section
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },

  // Auto-modal block
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 6,
    paddingRight: 2,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    lineHeight: 17,
  },

  // Action row + right-side indicators
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  buttonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },

  // Rounded status badge (ON/OFF, delay seconds)
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 36,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Copy-to-clipboard button for JSON viewer
  copyBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
