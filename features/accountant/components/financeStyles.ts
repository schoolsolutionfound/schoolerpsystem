/**
 * @file financeStyles.ts
 * @description Modern, responsive shared StyleSheet base for Finance Management views.
 *
 * Designed with a structured card layout that eliminates text collisions and provides
 * clean touch targets for mobile and desktop screens.
 */

import { Platform, StyleSheet } from 'react-native';
import { BorderRadius } from '../../../constants/theme';

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
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#1A202C' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
    height: 42,
    gap: 6,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // ── Category Filter Chips ────────────────────────────────────────────────────
  chipScrollView: { flexDirection: 'row', marginBottom: 10, maxHeight: 36 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  chipText: { fontSize: 12, color: '#4A5568', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // ── Record List ──────────────────────────────────────────────────────────────
  listContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4 },

  // ── Record Card (Modern multi-tier layout - zero overlap) ────────────────────
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  catChipText: { fontSize: 11, fontWeight: '700' },
  itemAmount: { fontSize: 17, fontWeight: '800' },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  payerRow: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  boldPayer: { fontWeight: '700', color: '#0F172A' },
  metaRow: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextPaid: { color: '#16A34A' },
  statusTextPending: { color: '#D97706' },

  actionIconsGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  actionIconBtnText: { fontSize: 11, fontWeight: '700', color: '#475569' },

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
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C' },
  modalBody: {
    maxHeight: 440,
    flexGrow: 0,
    flexShrink: 1,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#1A202C',
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
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  radioText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  radioTextActive: { color: '#FFFFFF', fontWeight: '700' },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
    backgroundColor: '#EDF2F7',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
  },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // ── Receipt / Invoice Modal (fade popup) ─────────────────────────────────────
  documentContent: {
    width: Platform.OS === 'web' ? 400 : '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 20,
  },
  documentHeader: { alignItems: 'center' },
  documentSchoolName: { fontSize: 18, fontWeight: '800', color: '#1A202C', marginTop: 4 },
  documentSubHeader: {
    fontSize: 11,
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  documentDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  documentBody: { gap: 6 },
  documentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  documentLabel: { fontSize: 12, color: '#64748B' },
  documentVal: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  documentTotalBox: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  documentTotalLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase' },
  documentTotalVal: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  closeDocumentBtn: {
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    marginTop: 16,
  },
  closeDocumentBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
