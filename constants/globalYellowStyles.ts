import { StyleSheet } from 'react-native';
import { FontFamily } from './fonts';
import { BorderRadius } from './theme';

export const YellowTheme = {
  // Brand Yellow
  primaryYellow: '#F4C430',
  primaryYellowDark: '#DFB020',
  primaryYellowLight: '#FEF9C3',
  primaryYellowTint: 'rgba(244, 196, 48, 0.14)',
  yellowBorder: '#DFB020',
  yellowMutedBg: '#FDE047',

  // Drawer Dark Obsidian Theme (Screenshot 1)
  drawerBg: '#141516',
  drawerCloseBtn: '#262729',
  drawerIconBadge: '#222325',
  drawerIconBadgeBorder: '#2C2D30',
  drawerActiveBg: 'rgba(244, 196, 48, 0.12)',
  drawerActiveBorder: 'rgba(244, 196, 48, 0.3)',
  drawerSectionText: '#6B6B6B',
  drawerItemText: '#FFFFFF',
  drawerChevron: '#4B5563',

  // Canvas / Screen Background (Screenshots 2 & 3)
  screenBg: '#F9FAFB',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E7EB',
  subtleBg: '#F9FAFB',

  // Text Typography
  black: '#000000',
  dark: '#111827',
  darkMuted: '#4B5563',
  darkSubtle: '#6B7280',
  placeholder: '#9CA3AF',

  // Status & Tags
  statusGreen: '#16A34A',
  statusRed: '#DC2626',
  amberTag: '#D97706',

  // Legacy compatibility keys
  contrastBlackBtn: '#000000',
  contrastBlackBtnText: '#F4C430',
};

export const globalYellowStyles = StyleSheet.create({
  // Global Screen Container
  screenContainer: {
    flex: 1,
    backgroundColor: YellowTheme.screenBg,
  },

  // Page Header Title Row (Screenshots 2 & 3)
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    color: YellowTheme.black,
    letterSpacing: -0.3,
  },
  primaryCtaBtn: {
    backgroundColor: YellowTheme.primaryYellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryCtaBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: YellowTheme.black,
    letterSpacing: -0.1,
  },

  // Search Bar with Brand Yellow Magnifier (Screenshots 2 & 3)
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YellowTheme.cardBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: YellowTheme.dark,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 5,
    backgroundColor: YellowTheme.cardBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: YellowTheme.primaryYellow,
    borderColor: YellowTheme.yellowBorder,
  },

  // Filter Chips Row (Screenshots 2 & 3)
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chipActive: {
    backgroundColor: YellowTheme.primaryYellow,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: YellowTheme.primaryYellow,
  },
  chipActiveText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.black,
  },
  chipInactive: {
    backgroundColor: YellowTheme.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
  },
  chipInactiveText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: YellowTheme.darkMuted,
  },

  // Content Cards (Screenshots 2 & 3)
  themeCard: {
    backgroundColor: YellowTheme.cardBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 5,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Pale Yellow Thumbnail Badge
  cardThumbnailBadge: {
    width: 42,
    height: 50,
    borderRadius: 5,
    backgroundColor: YellowTheme.primaryYellowLight,
    borderWidth: 1,
    borderColor: YellowTheme.yellowBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: YellowTheme.black,
    letterSpacing: -0.2,
  },
  cardSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: YellowTheme.darkMuted,
    marginTop: 2,
  },
  cardAmberTag: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.amberTag,
    marginTop: 4,
  },

  // Time Period Pill (Screenshot 2)
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YellowTheme.subtleBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  timePillLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: YellowTheme.darkSubtle,
  },
  timePillBold: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.black,
  },

  // Status Labels
  statusIssued: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.statusRed,
  },
  statusAvailable: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.statusGreen,
  },

  // Written Text - Black typography
  titleBlack: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: YellowTheme.black,
    letterSpacing: -0.2,
  },
  subtitleBlack: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: YellowTheme.darkMuted,
    marginTop: 2,
  },
  bodyBlack: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: YellowTheme.dark,
    lineHeight: 18,
  },
  labelBlack: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: YellowTheme.black,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Written Numbers - Bold Black numbers
  numberLargeBlack: {
    fontFamily: FontFamily.extrabold,
    fontSize: 26,
    color: YellowTheme.black,
    lineHeight: 30,
  },
  numberMediumBlack: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: YellowTheme.black,
    lineHeight: 24,
  },
  numberStatBlack: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: YellowTheme.black,
  },

  // Yellow Cards & Buttons for backwards compatibility
  yellowCard: {
    backgroundColor: YellowTheme.primaryYellowLight,
    borderWidth: 1,
    borderColor: YellowTheme.yellowBorder,
    borderRadius: BorderRadius.card,
    padding: 16,
  },
  yellowCardCompact: {
    backgroundColor: YellowTheme.primaryYellowLight,
    borderWidth: 1,
    borderColor: YellowTheme.yellowBorder,
    borderRadius: BorderRadius.card,
    padding: 12,
  },
  yellowSubCard: {
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: YellowTheme.yellowBorder,
    padding: 10,
  },
  blackButton: {
    backgroundColor: YellowTheme.black,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  blackButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.primaryYellow,
    letterSpacing: 0.2,
  },
  blackBadge: {
    backgroundColor: YellowTheme.black,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blackBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: YellowTheme.primaryYellow,
  },
  darkPill: {
    backgroundColor: YellowTheme.subtleBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  darkPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: YellowTheme.black,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: YellowTheme.black,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
});
