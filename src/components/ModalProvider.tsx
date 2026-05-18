import { useModalStore } from '@/store/modalStore';
import { useThemeStore } from '@/store/themeStore';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ModalProvider() {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const { visible, options, hide } = useModalStore();

  const insets = useSafeAreaInsets();

  if (!options && !visible) return null;

  // ------------------------------------------------------------
  // Render buttons based on options
  // ------------------------------------------------------------
  const renderButtons = () => (
    <View style={styles.btnRow}>
      {options?.buttons?.map((btn) => (
        <TouchableOpacity
          key={btn.action}
          style={[
            styles.btn,
            { backgroundColor: theme.card },
            btn.style === 'primary' && { backgroundColor: theme.primary },
            btn.destructive && { backgroundColor: theme.danger + '18' },
          ]}
          onPress={() => hide(btn.action)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.btnText,
              { color: theme.text },
              btn.style === 'primary' && { color: theme.white },
              btn.destructive && { color: theme.danger },
            ]}
          >
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ------------------------------------------------------------
  // ---- Alert / Confirm ----
  // ------------------------------------------------------------
  if (options?.type === 'alert' || options?.type === 'confirm') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => hide('dismiss')}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => hide('dismiss')} />
          <View style={[styles.alertContainer, { backgroundColor: theme.bg2, shadowColor: theme.black }]}>
            {options.title && <Text style={[styles.title, { color: theme.text }]}>{options.title}</Text>}
            {options.content && <Text style={[styles.content, { color: theme.text2 }]}>{options.content}</Text>}
            {options.component}
            {options.buttons && renderButtons()}
          </View>
        </View>
      </Modal>
    );
  }

  // ------------------------------------------------------------
  // ---- Fullscreen ----
  // ------------------------------------------------------------
  if (options?.type === 'fullscreen') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => hide('dismiss')}
      >
        <View style={[styles.fullscreen, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {options.title && <Text style={[styles.title, { color: theme.text }]}>{options.title}</Text>}
          {options.content && <Text style={[styles.content, { color: theme.text2 }]}>{options.content}</Text>}
          {options.component}
          {options.buttons && renderButtons()}
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fullscreen: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// ============================================================
// USAGE EXAMPLES 1
// ============================================================

// // Simple alert
// const result = await useModalStore.getState().show({
//   type: 'alert',
//   title: 'Success',
//   content: 'Operation completed.',
//   buttons: [{ label: 'OK', action: 'ok', style: 'primary' }],
// });

// // Confirm dialog
// const result = await useModalStore.getState().show({
//   type: 'confirm',
//   title: 'Delete Item',
//   content: 'Are you sure?',
//   buttons: [
//     { label: 'Cancel', action: 'cancel' },
//     { label: 'Delete', action: 'confirm', destructive: true },
//   ],
// });
// if (result === 'confirm') { /* do it */ }

// // Fullscreen with custom component
// await useModalStore.getState().show({
//   type: 'fullscreen',
//   title: 'Details',
//   component: <MyComponent />,
//   buttons: [{ label: 'Close', action: 'close' }],
// });


// ============================================================
// USAGE EXAMPLES 2
// ============================================================

{/* <AppCard style={{ paddingHorizontal: 14, paddingVertical: 16 }}>
  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
    🧪 Modal Tests
  </Text>

  <TouchableOpacity
    style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 10, marginBottom: 8 }}
    onPress={async () => {
      const result = await useModalStore.getState().show({
        type: 'alert',
        title: 'Success',
        content: 'Prayer times have been updated successfully.',
        buttons: [{ label: 'OK', action: 'ok', style: 'primary' }],
      });
      console.log('Alert result:', result);
    }}
  >
    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Test Alert</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{ backgroundColor: theme.danger, padding: 12, borderRadius: 10, marginBottom: 8 }}
    onPress={async () => {
      const result = await useModalStore.getState().show({
        type: 'confirm',
        title: 'Reset Settings',
        content: 'This will reset all settings to their defaults. Are you sure?',
        buttons: [
          { label: 'Cancel', action: 'cancel' },
          { label: 'Reset', action: 'confirm', destructive: true },
        ],
      });
      console.log('Confirm result:', result);
    }}
  >
    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Test Confirm</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{ backgroundColor: theme.accent, padding: 12, borderRadius: 10 }}
    onPress={async () => {
      const result = await useModalStore.getState().show({
        type: 'fullscreen',
        title: 'Fullscreen Modal',
        content: 'This is a fullscreen modal example. You can put any component here.',
        component: (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text2, marginBottom: 12 }}>Fullscreen Modal Content</Text>
            <Text style={{ fontSize: 14, color: theme.text2, textAlign: 'center' }}>
              You can customize this with your own components, styles, and logic.
            </Text>
          </View>
        ),
        buttons: [{ label: 'Close', action: 'close', style: 'primary' }],
      });
      console.log('Fullscreen result:', result);
    }}
  >
    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Test Fullscreen</Text>
  </TouchableOpacity>
</AppCard> */}