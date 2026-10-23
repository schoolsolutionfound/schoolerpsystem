import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { YellowTheme } from '../../../constants/globalYellowStyles';

interface AccessRestrictedModuleCardProps {
  moduleTitle: string;
  moduleDescription: string;
  moduleKey: string;
  onGrantAccess?: () => void;
  onBack?: () => void;
}

export const AccessRestrictedModuleCard: React.FC<AccessRestrictedModuleCardProps> = ({
  moduleTitle,
  moduleDescription,
  moduleKey,
  onGrantAccess,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.lockIconBox}>
            <Feather name="lock" size={22} color="#0F172A" />
          </View>
          <View style={styles.optionalPill}>
            <Text style={styles.optionalPillText}>OPTIONAL ERP MODULE</Text>
          </View>
        </View>

        <Text style={styles.title}>{moduleTitle}</Text>
        <Text style={styles.description}>
          {moduleDescription ||
            'This feature is an optional institutional service and requires administrative access authorization.'}
        </Text>

        <View style={styles.infoBanner}>
          <Feather name="shield" size={14} color="#0284C7" style={{ marginTop: 2 }} />
          <Text style={styles.infoBannerText}>
            Access to this workflow is configured per employee role. Only users with granted permission can view or manage records in this desk.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {onGrantAccess && (
            <TouchableOpacity
              style={styles.primaryGrantBtn}
              onPress={onGrantAccess}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="key-variant" size={16} color="#000000" />
              <Text style={styles.primaryGrantBtnText}>Grant Access (Enable Feature)</Text>
            </TouchableOpacity>
          )}

          {onBack && (
            <TouchableOpacity
              style={styles.secondaryBackBtn}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBackBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lockIconBox: {
    width: 44,
    height: 44,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalPill: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: YellowTheme.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  optionalPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#000000',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  infoBannerText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#0369A1',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  primaryGrantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: YellowTheme.primaryYellow,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  primaryGrantBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  secondaryBackBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBackBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#475569',
  },
});
