import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export interface BulkFeedStep3Props {
  router: any;
  importCount?: number;
  roleName?: string;
  onResetStep: () => void;
}

export const BulkFeedStep3: React.FC<BulkFeedStep3Props> = ({ router, importCount = 0, roleName = 'users', onResetStep }) => {
  return (
    <ScrollView contentContainerStyle={styles.scrollSuccess} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onResetStep} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Successful</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.successIconWrapper}>
        <View style={styles.successCircleBig}>
          <MaterialCommunityIcons name="check" size={54} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.successTitle}>Users Imported Successfully!</Text>
      <Text style={styles.successSub}>{importCount} {roleName}{importCount !== 1 ? 's' : ''} have been imported successfully.</Text>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statIconBox}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#7E57C2" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statNum}>{importCount}</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statRow}>
          <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Emails Sent</Text>
            <Text style={styles.statNum}>{importCount}</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statRow}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Failed</Text>
            <Text style={styles.statNum}>0</Text>
          </View>
        </View>
      </View>

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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
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
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  successSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  statsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 20,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: '#64748B' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  statDivider: { height: 1, backgroundColor: '#F1F5F9' },
  primaryActionBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dashboardLinkBtn: { paddingVertical: 12, marginTop: 4 },
  dashboardLinkText: { color: '#7E57C2', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
