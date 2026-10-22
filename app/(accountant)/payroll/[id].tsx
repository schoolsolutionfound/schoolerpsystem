/**
 * @file [id].tsx
 * @description Person payroll page — per-staff recurring salary schedule,
 * pending/paid ledger (oldest-first partial payments), instant bonuses,
 * schedule edit & pause.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinanceStore } from '../../../features/accountant/store/useFinanceStore';
import {
  PaymentMethod,
  PayrollFrequency,
} from '../../../features/accountant/types/finance';
import { formatINR } from '../../../features/accountant/utils/financeUtils';
import {
  capitalize,
  WEEKDAYS,
  FREQUENCY_OPTIONS,
  payrollFrequencyLabel,
  payrollRowStatus,
} from '../../../features/accountant/utils/payrollUtils';
import { showAlert } from '../../../features/shared/utils/showAlert';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
};

const METHOD_OPTIONS: PaymentMethod[] = ['upi', 'cash', 'bank_transfer', 'card', 'cheque'];

export default function AccountantPayrollPersonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const detail = useFinanceStore((s) => s.payrollDetail);
  const payrollLoading = useFinanceStore((s) => s.payrollLoading);
  const loadScheduleDetail = useFinanceStore((s) => s.loadScheduleDetail);
  const clearScheduleDetail = useFinanceStore((s) => s.clearScheduleDetail);
  const paySchedule = useFinanceStore((s) => s.paySchedule);
  const addBonus = useFinanceStore((s) => s.addBonus);
  const updateSchedule = useFinanceStore((s) => s.updateSchedule);

  // Pay modal state
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payRef, setPayRef] = useState('');
  const [paying, setPaying] = useState(false);

  // Bonus modal state
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusNote, setBonusNote] = useState('');
  const [bonusMethod, setBonusMethod] = useState<PaymentMethod>('upi');
  const [bonusSaving, setBonusSaving] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<PayrollFrequency>('monthly');
  const [editDayOfMonth, setEditDayOfMonth] = useState('1');
  const [editWeekday, setEditWeekday] = useState('1');
  const [editDaysOfMonth, setEditDaysOfMonth] = useState<string[]>(['1']);
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (id) void loadScheduleDetail(id);
    return () => clearScheduleDetail();
  }, [id, loadScheduleDetail, clearScheduleDetail]);

  const schedule = detail?.schedule;
  const balance = detail?.balance;
  const rows = detail?.rows || [];

  const openPay = () => {
    setPayAmount(balance?.pendingAmount ? String(balance.pendingAmount) : '');
    setPayMethod('upi');
    setPayRef('');
    setPayOpen(true);
  };

  const openBonus = () => {
    setBonusAmount('');
    setBonusNote('');
    setBonusMethod('upi');
    setBonusOpen(true);
  };

  const openEdit = () => {
    if (!schedule) return;
    setEditAmount(String(schedule.amount));
    setEditFrequency(schedule.frequency);
    setEditDayOfMonth(String(schedule.dayOfMonth || 1));
    setEditWeekday(String(schedule.weekday ?? 1));
    setEditDaysOfMonth(
      Array.isArray(schedule.daysOfMonth) && schedule.daysOfMonth.length
        ? schedule.daysOfMonth.map((d) => String(d))
        : ['1'],
    );
    setEditActive(schedule.active);
    setEditOpen(true);
  };

  const handlePay = async () => {
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) {
      showAlert('Invalid Amount', 'Enter a positive amount to disburse.');
      return;
    }
    setPaying(true);
    try {
      const res = await paySchedule(id!, {
        amount: num,
        paymentMethod: payMethod,
        reference: payRef.trim() || undefined,
      });
      setPayOpen(false);
      if (res.unallocated > 0) {
        showAlert(
          'Partly Allocated',
          `${formatINR(res.applied)} allocated to the oldest dues. ${formatINR(res.unallocated)} had nothing left to clear.`,
        );
      } else {
        showAlert('Payment Recorded', `${formatINR(res.applied)} disbursed across pending periods.`);
      }
    } catch (err: any) {
      showAlert('Payment Failed', err?.message || 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleBonus = async () => {
    const num = parseFloat(bonusAmount);
    if (isNaN(num) || num <= 0) {
      showAlert('Invalid Amount', 'Enter a positive bonus amount.');
      return;
    }
    if (!bonusNote.trim()) {
      showAlert('Note Required', 'Add a short note for the bonus (e.g. "Diwali bonus").');
      return;
    }
    setBonusSaving(true);
    try {
      await addBonus(id!, {
        amount: num,
        note: bonusNote.trim(),
        paymentMethod: bonusMethod,
      });
      setBonusOpen(false);
      showAlert('Bonus Added', `${formatINR(num)} recorded as PAID and added to the ledger.`);
    } catch (err: any) {
      showAlert('Bonus Failed', err?.message || 'Please try again.');
    } finally {
      setBonusSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      showAlert('Invalid Amount', 'Enter a positive salary amount.');
      return;
    }
    if (editFrequency === 'days_of_month' && editDaysOfMonth.length === 0) {
      showAlert('Select Days', 'Pick at least one day of the month.');
      return;
    }
    setEditSaving(true);
    try {
      await updateSchedule(id!, {
        amount: num,
        frequency: editFrequency,
        dayOfMonth: editFrequency === 'monthly' ? parseInt(editDayOfMonth, 10) : null,
        weekday: editFrequency === 'weekly' ? parseInt(editWeekday, 10) : null,
        daysOfMonth:
          editFrequency === 'days_of_month'
            ? [...new Set(editDaysOfMonth.map((d) => parseInt(d, 10)))].sort((a, b) => a - b)
            : undefined,
        active: editActive,
      });
      setEditOpen(false);
      showAlert(
        'Schedule Updated',
        editActive
          ? 'Changes apply to future periods only.'
          : 'Schedule paused — no new periods will be generated.',
      );
    } catch (err: any) {
      showAlert('Update Failed', err?.message || 'Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const toggleEditDay = (day: string) => {
    setEditDaysOfMonth((prev) =>
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day],
    );
  };

  if (!schedule) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#171717" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payroll</Text>
          </View>
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>
              {payrollLoading ? 'Loading payroll…' : 'Schedule not found.'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#171717" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {schedule.payeeName}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {capitalize(schedule.role) || 'Staff'} · {payrollFrequencyLabel(schedule)}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Charcoal balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>PENDING SALARY</Text>
            <Text style={styles.balanceAmount}>{formatINR(balance?.pendingAmount || 0)}</Text>
            <Text style={styles.balanceSub}>
              {balance?.pendingPeriods ? `${balance.pendingPeriods} period(s) outstanding` : 'All periods cleared'}
              {balance?.nextDue ? ` · Next due ${balance.nextDue}` : ''}
            </Text>
            <View style={styles.balanceMetaRow}>
              <View style={styles.balanceMetaCell}>
                <Text style={styles.balanceMetaVal}>{formatINR(balance?.paidTotal || 0)}</Text>
                <Text style={styles.balanceMetaLabel}>PAID TO DATE</Text>
              </View>
              <View style={styles.balanceMetaDivider} />
              <View style={styles.balanceMetaCell}>
                <Text style={styles.balanceMetaVal}>{formatINR(schedule.amount)}</Text>
                <Text style={styles.balanceMetaLabel}>PER CYCLE</Text>
              </View>
            </View>
            <View style={styles.balanceBtnRow}>
              <TouchableOpacity
                style={styles.payBtn}
                onPress={openPay}
                disabled={(balance?.pendingAmount || 0) <= 0}
              >
                <MaterialCommunityIcons name="cash-fast" size={16} color="#171717" />
                <Text style={styles.payBtnText}>Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bonusBtn} onPress={openBonus}>
                <MaterialCommunityIcons name="gift-outline" size={16} color="#FFF4C7" />
                <Text style={styles.bonusBtnText}>Add Bonus</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Schedule strip */}
          <View style={styles.card}>
            <View style={styles.scheduleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleTitle}>{payrollFrequencyLabel(schedule)}</Text>
                <Text style={styles.scheduleMeta}>
                  Started {schedule.startDate}
                  {schedule.nextDue ? ` · Next ${schedule.nextDue}` : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: schedule.active ? '#DCFCE7' : '#F3F4F6' },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: schedule.active ? '#16A34A' : '#6B6B6B' },
                  ]}
                >
                  {schedule.active ? 'ACTIVE' : 'PAUSED'}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleActions}>
              <TouchableOpacity style={styles.smallAction} onPress={openEdit}>
                <MaterialCommunityIcons name="pencil-outline" size={15} color="#171717" />
                <Text style={styles.smallActionText}>Edit Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallAction}
                onPress={() =>
                  updateSchedule(id!, { active: !schedule.active })
                    .then(() =>
                      showAlert(
                        schedule.active ? 'Schedule Paused' : 'Schedule Resumed',
                        schedule.active
                          ? 'No new periods will be generated while paused.'
                          : 'Future due periods will generate again.',
                      ),
                    )
                    .catch(() => {})
                }
              >
                <MaterialCommunityIcons
                  name={schedule.active ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={15}
                  color={schedule.active ? '#DC3545' : '#16A34A'}
                />
                <Text style={[styles.smallActionText, { color: schedule.active ? '#DC3545' : '#16A34A' }]}>
                  {schedule.active ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* History */}
          <Text style={styles.sectionLabel}>LEDGER · {rows.length}</Text>
          {rows.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                No salary periods yet. The first one appears on the due date (or immediately when
                the cadence starts today).
              </Text>
            </View>
          ) : (
            rows.map((row) => {
              const chip = payrollRowStatus(row);
              const paid = row.paidAmount || 0;
              return (
                <View key={row.id} style={styles.ledgerRow}>
                  <View
                    style={[
                      styles.ledgerIcon,
                      { backgroundColor: row.payrollType === 'bonus' ? '#FFF4C7' : '#F3F4F6' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={row.payrollType === 'bonus' ? 'gift-outline' : 'calendar-clock'}
                      size={16}
                      color={row.payrollType === 'bonus' ? '#B8860B' : '#6B6B6B'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerTitle} numberOfLines={1}>
                      {row.payrollType === 'bonus' ? `Bonus — ${row.notes || row.title}` : row.title}
                    </Text>
                    <Text style={styles.ledgerMeta} numberOfLines={1}>
                      Due {row.dueDate || row.paymentDate} · {METHOD_LABELS[row.paymentMethod] || row.paymentMethod}
                      {row.invoiceNo ? ` · ${row.invoiceNo}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Text style={styles.ledgerAmount}>{formatINR(row.amount)}</Text>
                    <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                      <Text style={[styles.statusChipText, { color: chip.text }]}>
                        {chip.label}
                        {chip.label === 'PARTIAL' ? ` ${formatINR(paid)}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── Pay Modal ── */}
      <Modal visible={payOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disburse Salary</Text>
              <TouchableOpacity onPress={() => setPayOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder={`Up to ${formatINR(balance?.pendingAmount || 0)}`}
                placeholderTextColor="#9A9A9A"
              />

              <Text style={styles.label}>Payment Method *</Text>
              <View style={styles.chipRow}>
                {METHOD_OPTIONS.map((m) => {
                  const active = payMethod === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodChip, active && styles.methodChipActive]}
                      onPress={() => setPayMethod(m)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.methodChipText, active && styles.methodChipTextActive]}>
                        {METHOD_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Reference (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="UTR / cheque no. / remark"
                value={payRef}
                onChangeText={setPayRef}
                placeholderTextColor="#9A9A9A"
              />

              <Text style={styles.hintText}>
                Payments clear the OLDEST unpaid periods first; part-payments keep the rest pending.
                Online payments here are recorded (no real transfer is triggered).
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, paying && { opacity: 0.6 }]}
                disabled={paying}
                onPress={handlePay}
              >
                <Text style={styles.submitBtnText}>{paying ? 'Saving…' : 'Record Payment'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Bonus Modal ── */}
      <Modal visible={bonusOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bonus</Text>
              <TouchableOpacity onPress={() => setBonusOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={bonusAmount}
                onChangeText={setBonusAmount}
                placeholder="e.g. 5000"
                placeholderTextColor="#9A9A9A"
              />

              <Text style={styles.label}>Note *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Diwali bonus"
                value={bonusNote}
                onChangeText={setBonusNote}
                placeholderTextColor="#9A9A9A"
              />

              <Text style={styles.label}>Payment Method *</Text>
              <View style={styles.chipRow}>
                {METHOD_OPTIONS.map((m) => {
                  const active = bonusMethod === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodChip, active && styles.methodChipActive]}
                      onPress={() => setBonusMethod(m)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.methodChipText, active && styles.methodChipTextActive]}>
                        {METHOD_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.hintText}>
                The bonus is marked PAID the moment you add it — it does not wait for a due date.
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBonusOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, bonusSaving && { opacity: 0.6 }]}
                disabled={bonusSaving}
                onPress={handleBonus}
              >
                <Text style={styles.submitBtnText}>{bonusSaving ? 'Saving…' : 'Add & Mark Paid'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Schedule Modal ── */}
      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Schedule</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Salary Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
                placeholderTextColor="#9A9A9A"
              />

              <Text style={styles.label}>Frequency *</Text>
              <View style={styles.chipRow}>
                {FREQUENCY_OPTIONS.map((opt) => {
                  const active = editFrequency === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.methodChip, active && styles.methodChipActive]}
                      onPress={() => setEditFrequency(opt.value)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.methodChipText, active && styles.methodChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {editFrequency === 'monthly' && (
                <>
                  <Text style={styles.label}>Pay Day of Month</Text>
                  <View style={styles.chipWrap}>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dd) => {
                      const active = editDayOfMonth === dd;
                      return (
                        <TouchableOpacity
                          key={dd}
                          style={[styles.dayChip, active && styles.dayChipActive]}
                          onPress={() => setEditDayOfMonth(dd)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{dd}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {editFrequency === 'weekly' && (
                <>
                  <Text style={styles.label}>Pay Day of Week</Text>
                  <View style={styles.chipWrap}>
                    {WEEKDAYS.map((w) => {
                      const active = editWeekday === String(w.value);
                      return (
                        <TouchableOpacity
                          key={w.label}
                          style={[styles.dayChip, active && styles.dayChipActive]}
                          onPress={() => setEditWeekday(String(w.value))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                            {w.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {editFrequency === 'days_of_month' && (
                <>
                  <Text style={styles.label}>Days of Month (tap to toggle)</Text>
                  <View style={styles.chipWrap}>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dd) => {
                      const active = editDaysOfMonth.includes(dd);
                      return (
                        <TouchableOpacity
                          key={dd}
                          style={[styles.dayChip, active && styles.dayChipActive]}
                          onPress={() => toggleEditDay(dd)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{dd}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.pauseRow}
                onPress={() => setEditActive((a) => !a)}
                activeOpacity={0.75}
              >
                <View
                  style={[styles.toggleBox, editActive && styles.toggleBoxActive]}
                >
                  {editActive && <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pauseTitle}>Schedule active</Text>
                  <Text style={styles.pauseSub}>
                    Turn off to pause generation (staff leaving, contract ended…). Existing rows stay.
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.hintText}>
                Edits apply to future periods only — already-generated rows keep their original
                amounts.
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, editSaving && { opacity: 0.6 }]}
                disabled={editSaving}
                onPress={handleSaveEdit}
              >
                <Text style={styles.submitBtnText}>{editSaving ? 'Saving…' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingRight: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#171717' },
  headerSub: { fontSize: 11, color: '#6B6B6B', fontWeight: '600', marginTop: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontSize: 13, color: '#6B6B6B' },

  scroll: { padding: 16, gap: 12, paddingBottom: 48 },

  // Charcoal balance card
  balanceCard: {
    backgroundColor: '#171717',
    borderRadius: 5,
    padding: 18,
    gap: 6,
  },
  balanceLabel: { fontSize: 10, fontWeight: '800', color: '#F4C430', letterSpacing: 1 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  balanceSub: { fontSize: 12, color: '#B8B8B8', fontWeight: '600' },
  balanceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2E2E2E',
    paddingTop: 12,
  },
  balanceMetaCell: { flex: 1, alignItems: 'center' },
  balanceMetaDivider: { width: 1, height: 28, backgroundColor: '#2E2E2E' },
  balanceMetaVal: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  balanceMetaLabel: { fontSize: 9, fontWeight: '700', color: '#8A8A8A', marginTop: 3, letterSpacing: 0.5 },
  balanceBtnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    height: 44,
  },
  payBtnText: { fontSize: 14, fontWeight: '800', color: '#171717' },
  bonusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F4C430',
    borderRadius: 5,
    height: 44,
  },
  bonusBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF4C7' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scheduleTitle: { fontSize: 14, fontWeight: '800', color: '#171717' },
  scheduleMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 2, fontWeight: '600' },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFFDF7',
    paddingTop: 10,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
  },
  smallActionText: { fontSize: 12, fontWeight: '700', color: '#171717' },

  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
  },
  ledgerIcon: {
    width: 32,
    height: 32,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerTitle: { fontSize: 13, fontWeight: '700', color: '#171717' },
  ledgerMeta: { fontSize: 10, color: '#6B6B6B', marginTop: 2, fontWeight: '600' },
  ledgerAmount: { fontSize: 14, fontWeight: '800', color: '#171717' },
  emptyText: { fontSize: 12, color: '#6B6B6B', lineHeight: 18 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23,23,23,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    maxHeight: '88%',
    paddingBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#171717' },
  modalBody: { paddingHorizontal: 18, paddingTop: 14 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  label: { fontSize: 12, fontWeight: '700', color: '#171717', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#171717',
    marginBottom: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  methodChipActive: { backgroundColor: '#171717', borderColor: '#171717' },
  methodChipText: { fontSize: 12, fontWeight: '700', color: '#171717' },
  methodChipTextActive: { color: '#FFFFFF' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  dayChip: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  dayChipActive: { backgroundColor: '#171717', borderColor: '#171717' },
  dayChipText: { fontSize: 12, fontWeight: '700', color: '#171717' },
  dayChipTextActive: { color: '#FFFFFF' },

  pauseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    marginBottom: 14,
  },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C9C5BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  toggleBoxActive: { backgroundColor: '#171717', borderColor: '#171717' },
  pauseTitle: { fontSize: 13, fontWeight: '800', color: '#171717' },
  pauseSub: { fontSize: 11, color: '#6B6B6B', marginTop: 2, lineHeight: 15 },

  hintText: {
    fontSize: 11,
    color: '#6B6B6B',
    lineHeight: 16,
    backgroundColor: '#FFF4C7',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
  },

  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#6B6B6B' },
  submitBtn: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 5,
    backgroundColor: '#171717',
  },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
