/**
 * @file financeStyles.ts
 * @description Modern, responsive shared StyleSheet base for Finance Management views.
 *
 * Designed with a structured card layout that eliminates text collisions and provides
 * clean touch targets for mobile and desktop screens.
 */

import { Platform, StyleSheet } from 'react-native';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

export const sharedFinanceStyles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  // ── Top Actions Bar (search + CTA button) ───────────────────────────────────
  actionsBar: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    height: 42,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#1A1B1C', fontFamily: FontFamily.regular },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
    height: 42,
    gap: 6,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },

  // ── Category Filter Chips ────────────────────────────────────────────────────
  chipScrollView: { flexDirection: 'row', marginBottom: 10, maxHeight: 36 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginRight: 6,
  },
  chipText: { fontSize: 12, color: '#6B6B6B', fontWeight: '600', fontFamily: FontFamily.semibold },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700', fontFamily: FontFamily.bold },

  // ── Record List ──────────────────────────────────────────────────────────────
  listContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B6B6B', marginTop: 12, fontFamily: FontFamily.bold },
  emptySubtitle: { fontSize: 13, color: '#8A8A8A', marginTop: 4, fontFamily: FontFamily.regular },

  // ── Record Card (Modern multi-tier layout - zero overlap) ────────────────────
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catChipText: { fontSize: 11, fontWeight: '700', fontFamily: FontFamily.bold },
  itemAmount: { fontSize: 17, fontWeight: '800', fontFamily: FontFamily.extrabold },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1B1C',
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: FontFamily.bold,
  },
  payerRow: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 4,
    fontFamily: FontFamily.regular,
  },
  boldPayer: { fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  metaRow: {
    fontSize: 11,
    color: '#6B6B6B',
    marginBottom: 8,
    fontFamily: FontFamily.regular,
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F7F5EE',
  },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: 'rgba(220,53,69,0.08)' },
  statusText: { fontSize: 10, fontWeight: '800', fontFamily: FontFamily.extrabold },
  statusTextPaid: { color: '#16A34A' },
  statusTextPending: { color: '#DC3545' },

  actionIconsGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  actionIconBtnText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B', fontFamily: FontFamily.bold },

  // ── Modal (slide-up form) ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: Platform.OS === 'web' ? 520 : '100%',
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  modalBody: {
    maxHeight: 440,
    flexGrow: 0,
    flexShrink: 1,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#6B6B6B', marginTop: 10, marginBottom: 4, fontFamily: FontFamily.bold },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#1A1B1C',
    fontFamily: FontFamily.regular,
  },
  formRow: { flexDirection: 'row', gap: 10 },
  formCol: { flex: 1 },

  // ── Radio Toggle Buttons ─────────────────────────────────────────────────────
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  radioBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  radioText: { fontSize: 11, color: '#6B6B6B', fontWeight: '600', fontFamily: FontFamily.semibold },
  radioTextActive: { color: '#FFFFFF', fontWeight: '700', fontFamily: FontFamily.bold },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#6B6B6B', fontFamily: FontFamily.semibold },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
  },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontFamily: FontFamily.bold },

  // ── Receipt / Invoice Modal (fade popup) ─────────────────────────────────────
  documentContent: {
    width: Platform.OS === 'web' ? 400 : '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 20,
  },
  documentHeader: { alignItems: 'center' },
  documentSchoolName: { fontSize: 18, fontWeight: '800', color: '#1A1B1C', marginTop: 4, fontFamily: FontFamily.extrabold },
  documentSubHeader: {
    fontSize: 11,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FontFamily.regular,
  },
  documentDivider: { height: 1, backgroundColor: '#E8E5DC', marginVertical: 12 },
  documentBody: { gap: 6 },
  documentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  documentLabel: { fontSize: 12, color: '#6B6B6B', fontFamily: FontFamily.regular },
  documentVal: { fontSize: 12, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  documentTotalBox: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  documentTotalLabel: { fontSize: 11, color: '#6B6B6B', textTransform: 'uppercase', fontFamily: FontFamily.regular },
  documentTotalVal: { fontSize: 20, fontWeight: '800', marginTop: 2, fontFamily: FontFamily.extrabold },
  closeDocumentBtn: {
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    marginTop: 16,
  },
  closeDocumentBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },
});
