// ============================================================
// USAGE EXAMPLES
// ============================================================

// // Simple alert
// await useModalStore.getState().show({
//   type: 'alert',
//   title: 'Success',
//   content: 'Label created successfully.',
//   buttons: [
//     { label: 'OK', action: 'ok', style: 'primary' },
//   ],
// });

// // Confirm with result
// const result = await useModalStore.getState().show({
//   type: 'confirm',
//   title: 'Delete Label',
//   content: 'This will delete all tasks inside. Are you sure?',
//   buttons: [
//     { label: 'Cancel', action: 'cancel' },
//     { label: 'Delete', action: 'confirm', destructive: true },
//   ],
// });

// if (result === 'confirm') {
//   await deleteLabel(item.id);
// }

// // Bottom sheet with custom component
// await useModalStore.getState().show({
//   type: 'bottomSheet',
//   size: 0.4,
//   title: 'Pick an option',
//   component: <MyCustomContent />,
//   buttons: [
//     { label: 'Cancel', action: 'cancel' },
//     { label: 'Confirm', action: 'confirm', style: 'primary' },
//   ],
// });

// // Fullscreen
// await useModalStore.getState().show({
//   type: 'fullscreen',
//   title: 'Settings',
//   component: <SettingsScreen />,
//   buttons: [
//     { label: 'Close', action: 'close' },
//   ],
// });


import { useModalStore } from '@/store/modalStore';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function ModalProvider() {
  const { visible, options, hide } = useModalStore();
  const { height } = useWindowDimensions();

  // Always render Modal — controlled by visible prop so animations complete properly
  // Render nothing inside when not visible to avoid layout work
  if (!options && !visible) return null;

  // ------------------------------------------------------------
  // Shared buttons renderer
  // ------------------------------------------------------------
  const renderButtons = () => (
    <View style={styles.btnRow}>
      {options?.buttons?.map((btn) => (
        <TouchableOpacity
          key={btn.action}
          style={[
            styles.btn,
            btn.style === 'primary' && styles.btnPrimary,
            btn.destructive && styles.btnDestructive,
          ]}
          onPress={() => hide(btn.action)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.btnText,
              btn.style === 'primary' && styles.btnTextPrimary,
              btn.destructive && styles.btnTextDestructive,
            ]}
          >
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ------------------------------------------------------------
  // Alert / Confirm — fade animation, centered on screen
  // ------------------------------------------------------------
  if (options?.type === 'alert' || options?.type === 'confirm') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => hide('dismiss')}
      >
        <View style={styles.alertOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => hide('dismiss')} />
          <View style={styles.alertContainer}>
            {options.title && <Text style={styles.title}>{options.title}</Text>}
            {options.content && <Text style={styles.content}>{options.content}</Text>}
            {options.component}
            {options.buttons && renderButtons()}
          </View>
        </View>
      </Modal>
    );
  }

  // ------------------------------------------------------------
  // Bottom sheet — slide animation, appears from bottom
  // ------------------------------------------------------------
  if (options?.type === 'bottomSheet') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        presentationStyle='formSheet'
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => hide('dismiss')}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => hide('dismiss')} />
          <View style={[
            styles.bottomSheet,
            { maxHeight: height * (options.size ?? 0.5) },
          ]}>
            <View style={styles.handle} />
            {options.title && <Text style={styles.title}>{options.title}</Text>}
            {options.content && <Text style={styles.content}>{options.content}</Text>}
            {options.component}
            {options.buttons && renderButtons()}
          </View>
        </View>
      </Modal>
    );
  }

  // ------------------------------------------------------------
  // Fullscreen — slide animation, covers full screen
  // ------------------------------------------------------------
  if (options?.type === 'fullscreen') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => hide('dismiss')}
      >
        <View style={styles.fullscreen}>
          {options.title && <Text style={styles.title}>{options.title}</Text>}
          {options.content && <Text style={styles.content}>{options.content}</Text>}
          {options.component}
          {options.buttons && renderButtons()}
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Alert overlay — centered
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  // Sheet overlay — anchored to bottom
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    gap: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  fullscreen: {
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  btnPrimary: {
    backgroundColor: '#1a73e8',
  },
  btnDestructive: {
    backgroundColor: 'rgba(217,48,37,0.1)',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  btnTextPrimary: {
    color: '#fff',
  },
  btnTextDestructive: {
    color: '#d93025',
  },
});