import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { LibrarySettings } from '../../types';
import { apiClient } from '../../../../api/client';
import { FontFamily } from '../../../../constants/fonts';

export const SettingsView = ({
  settings,
  onSaveSettings,
  commonStyles,
  onRefresh,
  isRefreshing,
}: {
  settings: LibrarySettings;
  onSaveSettings: (newSettings: LibrarySettings) => void;
  commonStyles: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
      renewalLimit: isNaN(gPeriod) ? 2 : gPeriod,
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.viewBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh}
              colors={['#D97706']}
              tintColor="#D97706"
            />
          ) : undefined
        }
      >
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionHeader}>Library System Settings</Text>
      
      </View>

      {/* SECTION 1: Circulation & Borrowing Rules */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <Text style={settStyles.cardTitle}>Lend Duration</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Small Container 1: Borrowing Limit */}
          <View style={[settStyles.smallContainer, { flex: 1 }]}>
            <View style={settStyles.smallContainerHeader}>
            
              <Text style={settStyles.smallContainerTitle}>Borrowing Limit</Text>
            </View>
          
            <TextInput
              style={[styles.formInput, settStyles.smallInput]}
              value={borrowingLimit}
              onChangeText={setBorrowingLimit}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor="#475569"
            />
          </View>

          {/* Small Container 2: Loan Duration */}
          <View style={[settStyles.smallContainer, { flex: 1 }]}>
            <View style={settStyles.smallContainerHeader}>
            
              <Text style={settStyles.smallContainerTitle}>Loan Duration</Text>
            </View>
          
            <TextInput
              style={[styles.formInput, settStyles.smallInput]}
              value={loanPeriodDays}
              onChangeText={setLoanPeriodDays}
              keyboardType="numeric"
              placeholder="14"
              placeholderTextColor="#475569"
            />
          </View>
        </View>

        {/* Small Container 3: Combined Grace Period & Renewal Limit */}
        <View style={settStyles.combinedContainer}>
          <View style={settStyles.combinedHeaderRow}>
            <View style={settStyles.smallContainerHeader}>
            
              <Text style={[settStyles.smallContainerTitle, { fontSize: 13 }]}>
                Grace & Renewal 
              </Text>
            </View>
           
          </View>

         

          <View style={settStyles.ruleList}>
          
          </View>

          <TextInput
            style={[styles.formInput, settStyles.combinedInput]}
            value={gracePeriodDays}
            onChangeText={(val) => {
              setGracePeriodDays(val);
              setRenewalLimit(val);
            }}
            keyboardType="numeric"
            placeholder="2"
            placeholderTextColor="#475569"
          />
        </View>
      </View>

      {/* SECTION 2: Fine & Penalty Configurations */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <Text style={settStyles.cardTitle}>Fine Rate</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Due Rate (₹ / Day)</Text>
            <TextInput
              style={[styles.formInput, { fontWeight: '800' }]}
              value={finePerDay}
              onChangeText={setFinePerDay}
              keyboardType="numeric"
              placeholder="10.00"
              placeholderTextColor="#475569"
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
    </KeyboardAvoidingView>
  );
};

const settStyles = StyleSheet.create({
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#E8E5DC', marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E8E5DC' },
  cardTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  helpText: { fontSize: 10, color: '#9CA3AF', marginTop: 2, fontFamily: FontFamily.regular },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  switchSub: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 5 },
  resetBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#4B5563' },
  smallContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  smallContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallContainerTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  smallContainerSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: FontFamily.regular,
  },
  smallInput: {
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  combinedContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
    marginTop: 4,
  },
  combinedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  unifiedBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#B45309',
  },
  combinedDescription: {
    fontSize: 11,
    color: '#78350F',
    fontFamily: FontFamily.medium,
  },
  ruleList: {
    gap: 6,
    marginVertical: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  ruleItemText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  combinedInput: {
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    fontWeight: '700',
    color: '#111827',
  },
});
