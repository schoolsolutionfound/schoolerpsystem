import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { AppCard } from '../../shared/components/AppCard';
import { AppBadge } from '../../shared/components/AppBadge';
import { Institution } from '../types/developer.types';

interface InstitutionCardProps {
  institution: Institution;
  onViewDetails: (id: string) => void;
  onEdit: (item: Institution) => void;
  onDelete: (item: Institution) => void;
}

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  institution,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.codeWrap}>
          <MaterialCommunityIcons name="office-building" size={20} color={Colors.light.primary} />
          <Text style={styles.codeText}>{institution.institutionCode}</Text>
        </View>
        <View style={styles.badges}>
          <AppBadge label={institution.institutionType} type={institution.institutionType} />
          <AppBadge label={institution.subscriptionStatus} type={institution.subscriptionStatus} />
        </View>
      </View>

      <Text style={styles.nameText}>{institution.institutionName}</Text>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onViewDetails(institution.id)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="eye-outline" size={16} color={Colors.light.primary} />
          <Text style={[styles.actionText, { color: Colors.light.primary }]}>View Details</Text>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(institution)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.light.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconBtn, styles.deleteIconBtn]} onPress={() => onDelete(institution)}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.light.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.profileImage,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: '#FEF2F2',
  },
});
