import { StyleSheet } from 'react-native';

// Static, theme-independent styles shared across the app.
export const globalStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Scroll containers
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
    gap: 10,
  },
  modalContainer: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 8,
    gap: 10,
  },
  fullDivider: {
    height: 1.5,
    width: '100%',
  },

  // Progress bar
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },

  // Header
  headerCard: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    marginHorizontal: 8,
    marginBottom: 10,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Badge
  numberCircle: {
    alignSelf: 'flex-start',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Modal footer
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 6,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },

  // Banner
  bannerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  bannerEmoji: {
    fontSize: 44,
    lineHeight: 56,
  },
  bannerTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },

  // Action buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // AppCard shadow
  cardShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
