/**
 * @file FleetTransportView.tsx
 * @description Bus Transport, Fleet Fuel Management, and Vehicle Maintenance ledger.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { ExpenseRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import { formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';

export const FleetTransportView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'fuel' | 'maintenance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'fuel' | 'maintenance'>('fuel');

  // Store
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpenseRecord = useFinanceStore((s) => s.updateExpenseRecord);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  // Form state
  const [vehicleNo, setVehicleNo] = useState('Bus #1 (HR-55-A-1024)');
  const [title, setTitle] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [litres, setLitres] = useState('');
  const [odometer, setOdometer] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('card');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Filter transport records
  const transportRecords = expenseRecords.filter((r) => {
    const isTransport =
      r.category === 'bus_fuel' ||
      r.category === 'bus_maintenance' ||
      r.category === 'bus_expense' ||
      r.department?.toLowerCase().includes('transport');

    if (!isTransport) return false;

    if (activeFilter === 'fuel') {
      if (r.category !== 'bus_fuel') return false;
    } else if (activeFilter === 'maintenance') {
      if (r.category === 'bus_fuel') return false;
    }

    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.payeeName.toLowerCase().includes(q) ||
      (r.vehicleNo && r.vehicleNo.toLowerCase().includes(q))
    );
  });

  const fuelRecords = transportRecords.filter((r) => r.category === 'bus_fuel');
  const maintenanceRecords = transportRecords.filter((r) => r.category !== 'bus_fuel');

  const totalFuelCost = fuelRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalFuelLitres = fuelRecords.reduce((sum, r) => sum + (r.fuelLitres || 0), 0);

  const totalMaintenanceCost = maintenanceRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleOpenEdit = (item: ExpenseRecord) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString());
    setEditStatus(item.status);
    setEditMethod(item.paymentMethod);
    setEditDate(item.paymentDate);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    updateExpenseRecord(editingItem.id, {
      amount: num,
      status: editStatus,
      paymentMethod: editMethod,
      paymentDate: editDate,
      notes: editNotes,
    });

    showAlert('Record Updated', `Transport log for ${editingItem.vehicleNo || 'vehicle'} updated.`);
    setEditingItem(null);
  };

  const handleAddSubmit = () => {
    if (!title.trim() || !payeeName.trim() || !amount.trim()) {
      showAlert('Missing Fields', 'Please enter Title, Vendor/Station Name, and Amount.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    addExpense({
      title: title.trim(),
      category: modalType === 'fuel' ? 'bus_fuel' : 'bus_maintenance',
      payeeName: payeeName.trim(),
      department: 'Transport',
      vehicleNo,
      fuelLitres: modalType === 'fuel' && litres ? parseFloat(litres) : undefined,
      odometerKm: odometer ? parseFloat(odometer) : undefined,
      maintenanceType: modalType === 'maintenance' && maintenanceType ? maintenanceType.trim() : undefined,
      amount: numAmount,
      paymentMethod: payMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: modalType === 'fuel' ? `Fuel Logged: ${litres || 'N/A'} Litres` : `Service: ${maintenanceType || 'Maintenance'}`,
    });

    setTitle('');
    setPayeeName('');
    setAmount('');
    setLitres('');
    setOdometer('');
    setMaintenanceType('');
    setIsLogModalOpen(false);
    showAlert('Success', `${modalType === 'fuel' ? 'Fuel Refuel' : 'Maintenance'} record logged.`);
  };

  return (
    <View style={sharedFinanceStyles.container}>
      {/* KPI Banner */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
          <View style={styles.kpiHeader}>
            <MaterialCommunityIcons name="gas-station" size={20} color="#D97706" />
            <Text style={[styles.kpiTag, { color: '#92400E' }]}>Diesel Fuel</Text>
          </View>
          <Text style={[styles.kpiVal, { color: '#B45309' }]}>{formatINR(totalFuelCost)}</Text>
          <Text style={styles.kpiSub}>{totalFuelLitres} Litres Logged</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }]}>
          <View style={styles.kpiHeader}>
            <MaterialCommunityIcons name="wrench" size={20} color="#EA580C" />
            <Text style={[styles.kpiTag, { color: '#9A3412' }]}>Maintenance</Text>
          </View>
          <Text style={[styles.kpiVal, { color: '#C2410C' }]}>{formatINR(totalMaintenanceCost)}</Text>
          <Text style={styles.kpiSub}>{maintenanceRecords.length} Service Logs</Text>
        </View>
      </View>

      {/* Filter Tabs & Log Button */}
      <View style={styles.topActionsRow}>
        <View style={styles.filterGroup}>
          {[
            { key: 'all', label: `All (${transportRecords.length})` },
            { key: 'fuel', label: `Fuel (${fuelRecords.length})` },
            { key: 'maintenance', label: `Service (${maintenanceRecords.length})` },
          ].map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterBtn, activeFilter === chip.key && styles.filterBtnActive]}
              onPress={() => setActiveFilter(chip.key as any)}
            >
              <Text style={[styles.filterBtnText, activeFilter === chip.key && styles.filterBtnTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logBtn} onPress={() => setIsLogModalOpen(true)}>
          <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.logBtnText}>Log Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color="#718096" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vehicle (Bus #1), vendor, or title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A0AEC0"
        />
      </View>

      {/* List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {transportRecords.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="bus-alert" size={48} color="#CBD5E1" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Fleet Records</Text>
          </View>
        ) : (
          transportRecords.map((item) => {
            const isFuel = item.category === 'bus_fuel';
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={sharedFinanceStyles.cardItem}>
                {/* Header: Icon + Badge + Amount */}
                <View style={sharedFinanceStyles.cardHeaderRow}>
                  <View style={sharedFinanceStyles.cardHeaderLeft}>
                    <View style={[sharedFinanceStyles.iconBox, { backgroundColor: isFuel ? '#FEF3C7' : '#FFEDD5' }]}>
                      <MaterialCommunityIcons
                        name={isFuel ? 'gas-station' : 'wrench'}
                        size={18}
                        color={isFuel ? '#D97706' : '#EA580C'}
                      />
                    </View>
                    <View style={[sharedFinanceStyles.catChip, { backgroundColor: isFuel ? '#FEF3C7' : '#FFEDD5' }]}>
                      <Text style={[sharedFinanceStyles.catChipText, { color: isFuel ? '#B45309' : '#C2410C' }]}>
                        {isFuel ? 'DIESEL FUEL' : 'MAINTENANCE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[sharedFinanceStyles.itemAmount, { color: isFuel ? '#D97706' : '#EA580C' }]}>
                    -{formatINR(item.amount)}
                  </Text>
                </View>

                {/* Title */}
                <Text style={sharedFinanceStyles.cardTitle}>{item.title}</Text>

                {/* Vehicle & Payee */}
                <Text style={sharedFinanceStyles.payerRow}>
                  Vehicle: <Text style={sharedFinanceStyles.boldPayer}>{item.vehicleNo || 'Fleet Vehicle'}</Text>
                  {item.odometerKm ? ` • ${item.odometerKm} km` : ''}
                </Text>

                <Text style={sharedFinanceStyles.metaRow}>
                  Vendor: {item.payeeName} • Date: {item.paymentDate}
                  {item.fuelLitres ? ` • ${item.fuelLitres} Litres` : ''}
                </Text>

                {/* Action Footer */}
                <View style={sharedFinanceStyles.cardFooterRow}>
                  <View style={[sharedFinanceStyles.statusTag, isPaid ? sharedFinanceStyles.statusPaid : sharedFinanceStyles.statusPending]}>
                    <Text style={[sharedFinanceStyles.statusText, isPaid ? sharedFinanceStyles.statusTextPaid : sharedFinanceStyles.statusTextPending]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={sharedFinanceStyles.actionIconsGroup}>
                    <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => handleOpenEdit(item)}>
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="#0284C7" />
                      <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#0284C7' }]}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => deleteExpense(item.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Log Modal ── */}
      <Modal visible={isLogModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Fleet Expense</Text>
              <TouchableOpacity onPress={() => setIsLogModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Log Type *</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, modalType === 'fuel' && styles.toggleActiveFuel]}
                  onPress={() => setModalType('fuel')}
                >
                  <MaterialCommunityIcons name="gas-station" size={16} color={modalType === 'fuel' ? '#D97706' : '#64748B'} />
                  <Text style={[styles.toggleBtnText, modalType === 'fuel' && styles.toggleTextActiveFuel]}>Diesel Fuel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, modalType === 'maintenance' && styles.toggleActiveMaint]}
                  onPress={() => setModalType('maintenance')}
                >
                  <MaterialCommunityIcons name="wrench" size={16} color={modalType === 'maintenance' ? '#EA580C' : '#64748B'} />
                  <Text style={[styles.toggleBtnText, modalType === 'maintenance' && styles.toggleTextActiveMaint]}>Maintenance</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Select Bus / Vehicle *</Text>
              <View style={styles.busSelectorRow}>
                {['Bus #1 (HR-55-A-1024)', 'Bus #2 (HR-55-B-2048)', 'Bus #3 (HR-55-C-3096)'].map((bus) => (
                  <TouchableOpacity
                    key={bus}
                    style={[styles.busChip, vehicleNo === bus && styles.busChipActive]}
                    onPress={() => setVehicleNo(bus)}
                  >
                    <Text style={[styles.busChipText, vehicleNo === bus && styles.busChipTextActive]}>{bus.split(' ')[0] + ' ' + bus.split(' ')[1]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Title / Description *</Text>
              <TextInput style={styles.input} placeholder={modalType === 'fuel' ? 'e.g. 50L Diesel Tank Fill' : 'e.g. Front Brake Pad Replacement'} value={title} onChangeText={setTitle} />

              <Text style={styles.label}>Vendor / Pump Station *</Text>
              <TextInput style={styles.input} placeholder={modalType === 'fuel' ? 'e.g. Indian Oil Fuel Station' : 'e.g. Ashok Leyland Authorized Garage'} value={payeeName} onChangeText={setPayeeName} />

              {modalType === 'fuel' ? (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Fuel Volume (Litres)</Text>
                    <TextInput style={styles.input} placeholder="e.g. 55" keyboardType="numeric" value={litres} onChangeText={setLitres} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Odometer (km)</Text>
                    <TextInput style={styles.input} placeholder="e.g. 48200" keyboardType="numeric" value={odometer} onChangeText={setOdometer} />
                  </View>
                </View>
              ) : (
                <View style={styles.col}>
                  <Text style={styles.label}>Service Type</Text>
                  <TextInput style={styles.input} placeholder="e.g. Engine Oil, Tyre, Brake, Servicing" value={maintenanceType} onChangeText={setMaintenanceType} />
                </View>
              )}

              <Text style={styles.label}>Amount Paid (₹) *</Text>
              <TextInput style={styles.input} placeholder="e.g. 4950" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsLogModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddSubmit}>
                <Text style={styles.submitBtnText}>Save Fleet Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Statement Modal ── */}
      {editingItem && (
        <Modal visible={!!editingItem} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Transport Expense</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.label}>Vehicle</Text>
                <Text style={[styles.input, { lineHeight: 36, backgroundColor: '#F1F5F9' }]}>{editingItem.vehicleNo || 'Fleet Vehicle'}</Text>

                <Text style={styles.label}>Amount (₹) *</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={editAmount} onChangeText={setEditAmount} />

                <Text style={styles.label}>Payment Status</Text>
                <View style={styles.toggleRow}>
                  {(['paid', 'pending'] as PaymentStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.toggleBtn, editStatus === s && { backgroundColor: s === 'paid' ? '#DCFCE7' : '#FEF3C7', borderColor: s === 'paid' ? '#16A34A' : '#D97706' }]}
                      onPress={() => setEditStatus(s)}
                    >
                      <Text style={[styles.toggleBtnText, editStatus === s && { color: s === 'paid' ? '#16A34A' : '#D97706', fontWeight: '800' }]}>{s.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingItem(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit}>
                  <Text style={styles.submitBtnText}>Save Updates</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  kpiTag: { fontSize: 11, fontWeight: '700' },
  kpiVal: { fontSize: 18, fontWeight: '800', marginVertical: 2 },
  kpiSub: { fontSize: 10, color: '#94A3B8' },

  topActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterGroup: { flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  filterBtnText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  filterBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  logBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: BorderRadius.input, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0', height: 38, marginBottom: 8 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: '#1A202C' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  modalBody: { maxHeight: 440, flexGrow: 0, flexShrink: 1 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13, color: '#1E293B' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', gap: 6 },
  toggleActiveFuel: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  toggleActiveMaint: { backgroundColor: '#FFEDD5', borderColor: '#EA580C' },
  toggleBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  toggleTextActiveFuel: { color: '#B45309', fontWeight: '800' },
  toggleTextActiveMaint: { color: '#C2410C', fontWeight: '800' },
  busSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  busChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  busChipActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  busChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  busChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: '#F1F5F9' },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, backgroundColor: '#EA580C' },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
