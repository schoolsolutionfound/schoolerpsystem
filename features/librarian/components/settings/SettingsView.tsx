import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { LibrarySettings } from '../../types';
import { apiClient } from '../../../../api/client';

export const SettingsView = ({
  settings,
  onSaveSettings,
  commonStyles,
}: {
  settings: LibrarySettings;
  onSaveSettings: (newSettings: LibrarySettings) => void;
  commonStyles: any;
}) => {
  const [borrowingLimit, setBorrowingLimit] = useState(String(settings.borrowingLimit || 3));
  const [loanPeriodDays, setLoanPeriodDays] = useState(String(settings.loanPeriodDays || 14));
  const [gracePeriodDays, setGracePeriodDays] = useState(String(settings.gracePeriodDays || 2));
  const [finePerDay, setFinePerDay] = useState(String(settings.finePerDay || 1.0));
  const [maxFine, setMaxFine] = useState(String(settings.maxFine || 100.0));
  const [renewalLimit, setRenewalLimit] = useState(String(settings.renewalLimit || 2));
  const [lostBookPenalty, setLostBookPenalty] = useState(String(settings.lostBookPenalty || 50.0));
  const [damagedBookPenalty, setDamagedBookPenalty] = useState(String(settings.damagedBookPenalty || 25.0));
  const [reservationExpiryDays, setReservationExpiryDays] = useState(String(settings.reservationExpiryDays || 7));
  const [unpaidFineLockThreshold, setUnpaidFineLockThreshold] = useState(String(settings.unpaidFineLockThreshold || 20.0));

  const [allowReservation, setAllowReservation] = useState(settings.allowReservation ?? true);
  const [openOnWeekends, setOpenOnWeekends] = useState(settings.openOnWeekends ?? true);
  const [openingHours, setOpeningHours] = useState(settings.openingHours || '08:00 AM');
  const [closingHours, setClosingHours] = useState(settings.closingHours || '06:00 PM');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBorrowingLimit(String(settings.borrowingLimit || 3));
    setLoanPeriodDays(String(settings.loanPeriodDays || 14));
    setGracePeriodDays(String(settings.gracePeriodDays || 2));
    setFinePerDay(String(settings.finePerDay || 1.0));
    setMaxFine(String(settings.maxFine || 100.0));
    setRenewalLimit(String(settings.renewalLimit || 2));
    setLostBookPenalty(String(settings.lostBookPenalty || 50.0));
    setDamagedBookPenalty(String(settings.damagedBookPenalty || 25.0));
    setReservationExpiryDays(String(settings.reservationExpiryDays || 7));
    setUnpaidFineLockThreshold(String(settings.unpaidFineLockThreshold || 20.0));
    setAllowReservation(settings.allowReservation ?? true);
    setOpenOnWeekends(settings.openOnWeekends ?? true);
    setOpeningHours(settings.openingHours || '08:00 AM');
    setClosingHours(settings.closingHours || '06:00 PM');
  }, [settings]);

  const handleSave = async () => {
    const bLimit = parseInt(borrowingLimit, 10);
    const lPeriod = parseInt(loanPeriodDays, 10);
    const gPeriod = parseInt(gracePeriodDays, 10);
    const fRate = parseFloat(finePerDay);
    const mFine = parseFloat(maxFine);
    const rLimit = parseInt(renewalLimit, 10);
    const lostPen = parseFloat(lostBookPenalty);
    const dmgPen = parseFloat(damagedBookPenalty);

    if (isNaN(bLimit) || bLimit <= 0) {
      Alert.alert('Invalid Input', 'Borrowing limit must be a positive integer.');
      return;
    }
    if (isNaN(lPeriod) || lPeriod <= 0) {
      Alert.alert('Invalid Input', 'Loan period days must be a positive integer.');
      return;
    }
    if (isNaN(fRate) || fRate < 0) {
      Alert.alert('Invalid Input', 'Fine per day rate must be 0 or greater.');
      return;
    }

    setSaving(true);

    const updated: LibrarySettings = {
      ...settings,
      borrowingLimit: bLimit,
      loanPeriodDays: lPeriod,
      gracePeriodDays: isNaN(gPeriod) ? 0 : gPeriod,
      finePerDay: fRate,
      maxFine: isNaN(mFine) ? 100 : mFine,
      renewalLimit: isNaN(rLimit) ? 2 : rLimit,
      allowReservation,
      lostBookPenalty: isNaN(lostPen) ? 50 : lostPen,
      damagedBookPenalty: isNaN(dmgPen) ? 25 : dmgPen,
      reservationExpiryDays: parseInt(reservationExpiryDays, 10) || 7,
      unpaidFineLockThreshold: parseFloat(unpaidFineLockThreshold) || 20.0,
      openingHours,
      closingHours,
      openOnWeekends,
    };

    try {
      await apiClient('/library/settings', {
        method: 'POST',
        body: JSON.stringify(updated),
      });
    } catch {
      // Silent catch for offline fallback
    }

    setSaving(false);
    onSaveSettings(updated);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to restore default library operational settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            const defaults: LibrarySettings = {
              id: settings.id || 'set-1',
              borrowingLimit: 3,
              loanPeriodDays: 14,
              gracePeriodDays: 2,
              finePerDay: 1.0,
              maxFine: 100.0,
              renewalLimit: 2,
              allowReservation: true,
              lostBookPenalty: 50.0,
              damagedBookPenalty: 25.0,
              reservationExpiryDays: 7,
              unpaidFineLockThreshold: 20.0,
              openingHours: '08:00 AM',
              closingHours: '06:00 PM',
              openOnWeekends: true,
            };
            onSaveSettings(defaults);
            Alert.alert('Settings Reset', 'Restored default system settings.');
          },
        },
      ]
    );
  };

  const styles = commonStyles;

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionHeader}>Library System Settings</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>
          Configure borrowing limits, loan rules, fine rates, and operational parameters.
        </Text>
      </View>

      {/* SECTION 1: Circulation & Borrowing Rules */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <MaterialCommunityIcons name="book-clock-outline" size={20} color="#EAB308" />
          <Text style={settStyles.cardTitle}>Circulation & Loan Rules</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Borrowing Limit / Member</Text>
            <TextInput
              style={styles.formInput}
              value={borrowingLimit}
              onChangeText={setBorrowingLimit}
              keyboardType="numeric"
              placeholder="3"
            />
            <Text style={settStyles.helpText}>Max books out concurrently</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Loan Duration (Days)</Text>
            <TextInput
              style={styles.formInput}
              value={loanPeriodDays}
              onChangeText={setLoanPeriodDays}
              keyboardType="numeric"
              placeholder="14"
            />
            <Text style={settStyles.helpText}>Standard checkout period</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Grace Period (Days)</Text>
            <TextInput
              style={styles.formInput}
              value={gracePeriodDays}
              onChangeText={setGracePeriodDays}
              keyboardType="numeric"
              placeholder="2"
            />
            <Text style={settStyles.helpText}>Days before fine starts</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Renewal Limit</Text>
            <TextInput
              style={styles.formInput}
              value={renewalLimit}
              onChangeText={setRenewalLimit}
              keyboardType="numeric"
              placeholder="2"
            />
            <Text style={settStyles.helpText}>Max extensions allowed</Text>
          </View>
        </View>
      </View>

      {/* SECTION 2: Fine & Penalty Configurations */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <MaterialCommunityIcons name="cash-fast" size={20} color="#DC2626" />
          <Text style={settStyles.cardTitle}>Fine Rates & Financial Penalties</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Daily Overdue Rate ($/Day)</Text>
            <TextInput
              style={[styles.formInput, { fontWeight: '800', color: '#DC2626' }]}
              value={finePerDay}
              onChangeText={setFinePerDay}
              keyboardType="numeric"
              placeholder="1.00"
            />
            <Text style={settStyles.helpText}>Charged per overdue day</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Max Overdue Fine Cap ($)</Text>
            <TextInput
              style={styles.formInput}
              value={maxFine}
              onChangeText={setMaxFine}
              keyboardType="numeric"
              placeholder="100.00"
            />
            <Text style={settStyles.helpText}>Maximum fine ceiling</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Lost Book Default Fee ($)</Text>
            <TextInput
              style={styles.formInput}
              value={lostBookPenalty}
              onChangeText={setLostBookPenalty}
              keyboardType="numeric"
              placeholder="50.00"
            />
            <Text style={settStyles.helpText}>Replacement default charge</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Damaged Book Base Fee ($)</Text>
            <TextInput
              style={styles.formInput}
              value={damagedBookPenalty}
              onChangeText={setDamagedBookPenalty}
              keyboardType="numeric"
              placeholder="25.00"
            />
            <Text style={settStyles.helpText}>Base repair fee</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Unpaid Fine Member Lock Threshold ($)</Text>
          <TextInput
            style={styles.formInput}
            value={unpaidFineLockThreshold}
            onChangeText={setUnpaidFineLockThreshold}
            keyboardType="numeric"
            placeholder="20.00"
          />
          <Text style={settStyles.helpText}>Member borrowing is suspended if unpaid balance exceeds this amount</Text>
        </View>
      </View>

      {/* SECTION 3: Reservation & Operating Controls */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <MaterialCommunityIcons name="cog-outline" size={20} color="#2563EB" />
          <Text style={settStyles.cardTitle}>Reservation & Access Settings</Text>
        </View>

        <View style={settStyles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={settStyles.switchTitle}>Allow Online Book Reservation</Text>
            <Text style={settStyles.switchSub}>Permit students to hold/reserve available catalog items</Text>
          </View>
          <Switch
            value={allowReservation}
            onValueChange={setAllowReservation}
            trackColor={{ false: '#D1D5DB', true: '#FEF08A' }}
            thumbColor={allowReservation ? '#EAB308' : '#9CA3AF'}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Reservation Expiry (Days)</Text>
            <TextInput
              style={styles.formInput}
              value={reservationExpiryDays}
              onChangeText={setReservationExpiryDays}
              keyboardType="numeric"
              placeholder="7"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Weekend Operations</Text>
            <TouchableOpacity
              style={[styles.chip, openOnWeekends && styles.chipActive, { height: 38, justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => setOpenOnWeekends(!openOnWeekends)}
            >
              <Text style={[styles.chipText, openOnWeekends && styles.chipTextActive]}>
                {openOnWeekends ? 'Open Saturdays' : 'Closed Weekends'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Library Opening Hours</Text>
            <TextInput
              style={styles.formInput}
              value={openingHours}
              onChangeText={setOpeningHours}
              placeholder="08:00 AM"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Library Closing Hours</Text>
            <TextInput
              style={styles.formInput}
              value={closingHours}
              onChangeText={setClosingHours}
              placeholder="06:00 PM"
            />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 10, marginTop: 16 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#121316" />
          ) : (
            <Text style={styles.primaryBtnText}>Save System Configuration</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={settStyles.resetBtn} onPress={handleResetDefaults}>
          <Feather name="rotate-ccw" size={14} color="#6B7280" />
          <Text style={settStyles.resetBtnText}>Restore System Defaults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const settStyles = StyleSheet.create({
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  helpText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  switchSub: { fontSize: 11, color: '#6B7280' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 10 },
  resetBtnText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
});
