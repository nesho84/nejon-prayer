import PrayerIcon from '@/components/PrayerIcon';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  prayerName: string;
  prayerTime: string;
  isTrackable: boolean;
  isPrayed: boolean;
  isCurrent?: boolean;                  // 'card' variant only — current-prayer highlight
  isFriday?: boolean;                   // drives the Xhumaja badge on Dhuhr
  variant?: 'card' | 'plain';           // 'card' = home (border/bg), 'plain' = modal (borderless)
  notifState?: 'off' | 'on' | 'custom'; // bell icon state (home only); default 'off'
  onTrackingPress?: () => void;         // mark/unmark; row is a TouchableOpacity only when trackable
  onNotifIconPress?: () => void;        // present → render the right-side notification icon (home only)
}

const TRACKING_ICON_SIZE = 18;
const CHECK_ICON_SIZE = 11;
const BELL_ICON_SIZE = 20;

export default function PrayerRow({
  prayerName,
  prayerTime,
  isTrackable,
  isPrayed,
  isCurrent = false,
  isFriday = false,
  variant = 'card',
  notifState = 'off',
  onTrackingPress,
  onNotifIconPress,
}: Props) {
  // Stores
  const theme = useThemeStore((state) => state.theme);
  const tr = useLanguageStore((state) => state.tr);

  // Row variant
  const isCard = variant === 'card';
  // Name + time color: accent when current, else text2 (card) / text (plain); non-trackable always text2
  const textColor = !isTrackable ? theme.text2 : isCurrent ? theme.accent : isCard ? theme.text2 : theme.text;
  const iconColor = isTrackable && isCurrent ? theme.accent : theme.text2;

  // ------------------------------------------------------------
  // Tracking icon: dash (non-trackable), empty ring, or green check
  // ------------------------------------------------------------
  const trackingIcon = !isTrackable ? (
    <MaterialDesignIcons name="minus" size={TRACKING_ICON_SIZE} color={theme.placeholder} />
  ) : !isPrayed ? (
    <View style={[styles.trackCircle, { borderColor: isCurrent ? theme.placeholder : theme.divider2 }]} />
  ) : (
    <View style={[styles.trackCircle, { backgroundColor: theme.green, borderColor: theme.green, opacity: 0.7 }]}>
      <MaterialDesignIcons name="check-bold" size={CHECK_ICON_SIZE} color={theme.white} />
    </View>
  );

  // ------------------------------------------------------------
  // Notification bell icon — driven by notifState (home only)
  // ------------------------------------------------------------
  const renderNotifIcon = () => {
    if (notifState === 'on') {
      return <MaterialDesignIcons name="bell-outline" size={BELL_ICON_SIZE} color={theme.text2} style={{ opacity: 0.6, paddingBottom: 1 }} />;
    }
    if (notifState === 'custom') {
      return <MaterialDesignIcons name="bell-cog-outline" size={BELL_ICON_SIZE} color={theme.text2} style={{ opacity: 0.6, paddingBottom: 1 }} />;
    }
    return <MaterialDesignIcons name="bell-off-outline" size={BELL_ICON_SIZE} color={theme.text2} style={{ opacity: 0.3, paddingBottom: 1 }} />;
  };

  // Row content shared by the trackable (touchable) and non-trackable (static) wrappers
  const rowContent = (
    <>
      {trackingIcon}
      <Text style={[styles.prayerNameText, { color: textColor }]}>
        {tr.prayers[prayerName as keyof typeof tr.prayers] || prayerName}
      </Text>
      <PrayerIcon name={prayerName} size={TRACKING_ICON_SIZE} color={iconColor} opacity={isTrackable ? 0.7 : 1} />

      {/* Xhumaja badge — Fridays only */}
      {isTrackable && prayerName === 'Dhuhr' && isFriday && (
        <View style={[
          styles.xhumaBadge,
          {
            backgroundColor: isCurrent ? theme.accentLight : theme.surfaceBg,
            borderColor: isCurrent ? theme.accentLight : theme.divider2,
          }
        ]}>
          <Text style={[
            styles.xhumaBadgeText,
            { color: isCurrent ? theme.accent : theme.islamicGreen, opacity: isCurrent ? 1 : 0.9 }
          ]}>
            {tr.labels.jummah ?? 'Xhumaja'}
          </Text>
        </View>
      )}

      {/* Horizontal spacer */}
      <View style={{ flex: 1 }} />
      {/* Prayer time */}
      <Text style={[styles.prayerTimeText, { color: textColor }]}>
        {prayerTime}
      </Text>
    </>
  );

  return (
    <View style={[
      styles.prayerRow,
      isCard && styles.cardRow,
      isCard && {
        backgroundColor: isCurrent ? theme.accentLight : theme.card,
        borderColor: isCurrent ? theme.accentLight : theme.borderCard,
      },
    ]}>

      {/* Left: mark/unmark area (trackable) or plain view (non-trackable) */}
      {isTrackable ? (
        <TouchableOpacity
          style={[styles.prayerRowLeft, isCard ? styles.leftCard : styles.leftPlain]}
          delayPressIn={0}
          delayPressOut={0}
          activeOpacity={0.3}
          hitSlop={8}
          onPress={onTrackingPress}
        >
          {rowContent}
        </TouchableOpacity>
      ) : (
        <View style={[styles.prayerRowLeft, isCard ? styles.leftCard : styles.leftPlain, { opacity: 0.4 }]}>
          {rowContent}
        </View>
      )}

      {/* Right: notification icon → opens modal (HomeScreen only) */}
      {onNotifIconPress && (
        <TouchableOpacity
          style={styles.notifIconContainer}
          delayPressIn={0}
          delayPressOut={0}
          activeOpacity={0.3}
          hitSlop={8}
          onPress={onNotifIconPress}
        >
          <View style={[styles.notifIcon, { backgroundColor: theme.surfaceBg }]}>
            {renderNotifIcon()}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Prayer row wrapper
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardRow: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1.3,
    borderRadius: 12,
    gap: 10,
  },
  prayerRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  leftCard: {
    marginLeft: 5,
  },
  leftPlain: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  trackCircle: {
    width: TRACKING_ICON_SIZE,
    height: TRACKING_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: TRACKING_ICON_SIZE / 2,
  },
  prayerNameText: {
    fontSize: 16,
    fontWeight: '500',
    includeFontPadding: false,
  },
  prayerTimeText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },

  // Xhumaja badge (Fridays only)
  xhumaBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    gap: 8,
  },
  xhumaBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Notification icon
  notifIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
