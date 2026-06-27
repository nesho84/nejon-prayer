import CelebrationFx from '@/components/CelebrationFx';
import { useModalStore } from '@/store/modalStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons } from "@react-native-vector-icons/ionicons/static";
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
  // Modal store
  const { visible, options, hide } = useModalStore();

  // Safe area insets
  const insets = useSafeAreaInsets();
  const topInset = insets.top + 4;
  const bottomInset = insets.bottom;
  const leftInset = insets.left;
  const rightInset = insets.right;

  if (!options && !visible) return null;

  const dismissable = options?.dismissable ?? true;

  // ------------------------------------------------------------
  // Handle dismiss (for both alert and confirm)
  // ------------------------------------------------------------
  const handleDismiss = () => {
    if (!dismissable) return;
    hide('dismiss');
  };

  // ------------------------------------------------------------
  // Render Close Icon if dismissable
  // ------------------------------------------------------------
  const renderCloseIcon = () => {
    if (!dismissable || !options?.showCloseIcon) return null;

    return (
      <View style={[styles.closeIconContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.closeIconBtn}
          onPress={handleDismiss}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={theme.text2} />
        </TouchableOpacity>
      </View>
    );
  };

  // ------------------------------------------------------------
  // Render Buttons if any
  // ------------------------------------------------------------
  const renderButtons = () => (
    <View style={styles.btnRow}>
      {options?.buttons?.map((btn) => (
        <TouchableOpacity
          key={btn.action}
          style={[styles.btn, btn.buttonStyle]}
          onPress={() => {
            btn.onPress?.();
            hide(btn.action);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, btn.labelStyle]}>
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ------------------------------------------------------------
  // ---- Alert ----
  // ------------------------------------------------------------
  if (options?.type === 'alert') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType={options.animationType ?? 'fade'}
        statusBarTranslucent
        onRequestClose={handleDismiss}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
          <View style={[styles.alertContainer, { backgroundColor: theme.bg2, shadowColor: theme.black }, options.containerStyle]}>
            {renderCloseIcon()}
            {options.title && (
              <Text style={[styles.title, { color: theme.text }, options.titleStyle]}>
                {options.title}
              </Text>
            )}
            {options.content && (
              <Text style={[styles.content, { color: theme.text2 }, options.contentStyle]}>
                {options.content}
              </Text>
            )}
            {options.component}
            {options.buttons && renderButtons()}
            {options.celebrationAnimation && <CelebrationFx />}
          </View>
        </View>
      </Modal>
    );
  }

  // ------------------------------------------------------------
  // ---- Confirm ----
  // ------------------------------------------------------------
  if (options?.type === 'confirm') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType={options.animationType ?? 'fade'}
        statusBarTranslucent
        onRequestClose={() => hide('cancel')}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => hide('cancel')} />
          <View style={[styles.alertContainer, { backgroundColor: theme.bg2, shadowColor: theme.black }, options.containerStyle]}>
            {renderCloseIcon()}
            {options.title && (
              <Text style={[styles.title, { color: theme.text }, options.titleStyle]}>
                {options.title}
              </Text>
            )}
            {options.content && (
              <Text style={[styles.content, { color: theme.text2 }, options.contentStyle]}>
                {options.content}
              </Text>
            )}
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
        animationType={options.animationType ?? 'slide'}
        statusBarTranslucent
        onRequestClose={handleDismiss}
      >
        <View style={[styles.fullscreen, { backgroundColor: theme.bg, paddingTop: topInset, paddingBottom: bottomInset, paddingLeft: leftInset, paddingRight: rightInset }]}>
          {renderCloseIcon()}
          {options.title && (
            <Text style={[styles.title, { color: theme.text }, options.titleStyle]}>
              {options.title}
            </Text>
          )}
          {options.content && (
            <Text style={[styles.content, { color: theme.text2 }, options.contentStyle]}>
              {options.content}
            </Text>
          )}
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
    overflow: 'hidden',
  },
  fullscreen: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  closeIconContainer: {
    position: 'absolute',
    top: 13,
    right: 14,
    zIndex: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  closeIconBtn: {
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
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});