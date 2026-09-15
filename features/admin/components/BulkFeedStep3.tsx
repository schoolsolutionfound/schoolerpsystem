import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

export interface BulkFeedStep3Props {
  router: any;
  importCount?: number;
  successCount?: number;
  failureCount?: number;
  emailsSent?: number;
  errors?: string[];
  roleName?: string;
  onResetStep: () => void;
}

export const BulkFeedStep3: React.FC<BulkFeedStep3Props> = ({
  router,
  importCount = 0,
  successCount = 0,
  failureCount = 0,
  emailsSent = 0,
  errors = [],
  roleName = 'users',
  onResetStep,
}) => {
  const [showErrors, setShowErrors] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.scrollSuccess} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onResetStep} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{failureCount > 0 ? 'Import Complete' : 'Import Successful'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.successIconWrapper}>
        <View style={[styles.successCircleBig, failureCount > 0 && styles.successCirclePartial]}>
          <MaterialCommunityIcons name={failureCount > 0 ? 'alert' : 'check'} size={54} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.successTitle}>
        {failureCount > 0 ? 'Import Completed with Errors' : 'Users Imported Successfully!'}
      </Text>
      <Text style={styles.successSub}>
        {successCount} {roleName}{successCount !== 1 ? 's' : ''} imported
        {failureCount > 0 ? `, ${failureCount} failed` : ''}.
      </Text>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statIconBox}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#F4C430" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Total Processed</Text>
            <Text style={styles.statNum}>{importCount}</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statRow}>
          <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Successful</Text>
            <Text style={[styles.statNum, { color: '#16A34A' }]}>{successCount}</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statRow}>
          <View style={[styles.statIconBox, { backgroundColor: emailsSent > 0 ? '#DCFCE7' : '#F3F4F6' }]}>
            <MaterialCommunityIcons name="email-outline" size={22} color={emailsSent > 0 ? '#16A34A' : '#9CA3AF'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Emails Sent</Text>
            <Text style={styles.statNum}>{emailsSent}</Text>
          </View>
        </View>

        {failureCount > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>Failed</Text>
                <Text style={[styles.statNum, { color: '#D97706' }]}>{failureCount}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {failureCount > 0 && errors.length > 0 && (
        <TouchableOpacity style={styles.errorToggle} onPress={() => setShowErrors(!showErrors)}>
          <MaterialCommunityIcons name={showErrors ? 'chevron-up' : 'chevron-down'} size={20} color="#D97706" />
          <Text style={styles.errorToggleText}>{showErrors ? 'Hide' : 'Show'} Errors ({errors.length})</Text>
        </TouchableOpacity>
      )}

      {showErrors && errors.length > 0 && (
        <View style={styles.errorList}>
          {errors.map((err, i) => (
            <Text key={i} style={styles.errorItem}>• {err}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primaryActionBtn} onPress={onResetStep}>
        <Text style={styles.primaryActionText}>Import More</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dashboardLinkBtn} onPress={() => router.replace('/(admin)/home')}>
        <Text style={styles.dashboardLinkText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollSuccess: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', width: '100%' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#171717' },
  successIconWrapper: { marginVertical: 20 },
  successCircleBig: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  successCirclePartial: { backgroundColor: '#F59E0B' },
  successTitle: { fontSize: 22, fontFamily: FontFamily.extrabold, color: '#171717', textAlign: 'center' },
  successSub: { fontSize: 13, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  statsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    marginBottom: 12,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  statNum: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  statDivider: { height: 1, backgroundColor: '#FFFDF7' },
  errorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  errorToggleText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#D97706' },
  errorList: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  errorItem: { fontSize: 12, fontFamily: FontFamily.regular, color: '#92400E', marginBottom: 4, lineHeight: 18 },
  primaryActionBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontFamily: FontFamily.bold },
  dashboardLinkBtn: { paddingVertical: 12, marginTop: 4 },
  dashboardLinkText: { color: '#F4C430', fontSize: 14, fontFamily: FontFamily.bold, textAlign: 'center' },
});
