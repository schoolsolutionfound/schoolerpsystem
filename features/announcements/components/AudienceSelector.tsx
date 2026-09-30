import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { TargetType, AnnouncementTarget } from '../types';
import { Colors, BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchClassSectionsApi } from '../../../api/academics';

interface AudienceSelectorProps {
  targets: AnnouncementTarget[];
  onChange: (targets: AnnouncementTarget[]) => void;
}

const TARGET_TYPES: { label: string; value: TargetType; icon: string }[] = [
  { label: 'Everyone', value: 'all', icon: 'account-group-outline' },
  { label: 'Specific Role', value: 'role', icon: 'account-tie-outline' },
  { label: 'Class / Section', value: 'class', icon: 'google-classroom' },
];

const ROLES: { label: string; value: string }[] = [
  { label: 'All Roles', value: '' },
  { label: 'Students', value: 'student' },
  { label: 'Teachers', value: 'teacher' },
  { label: 'Parents', value: 'parent' },
  { label: 'Staff (Teachers & Admins)', value: 'staff' },
];

export const AudienceSelector: React.FC<AudienceSelectorProps> = ({ targets, onChange }) => {
  const currentTarget = targets[0] || { targetType: 'all', targetRole: '', classId: '', sectionId: '' };

  const { data: classSections = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['class-sections'],
    queryFn: async () => {
      try {
        const res = await fetchClassSectionsApi();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: currentTarget.targetType === 'class' || currentTarget.targetType === 'section',
  });

  const handleTypeSelect = (type: TargetType) => {
    onChange([
      {
        targetType: type,
        targetRole: type === 'role' ? 'student' : '',
        classId: '',
        sectionId: '',
      },
    ]);
  };

  const handleRoleSelect = (role: string) => {
    onChange([
      {
        ...currentTarget,
        targetType: 'role',
        targetRole: role,
      },
    ]);
  };

  const handleClassSelect = (csId: string) => {
    onChange([
      {
        ...currentTarget,
        targetType: 'class',
        classId: csId,
        sectionId: csId,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Target Audience</Text>
      
      <View style={styles.typeSelectorRow}>
        {TARGET_TYPES.map((t) => {
          const selected = currentTarget.targetType === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeCard, selected && styles.typeCardSelected]}
              onPress={() => handleTypeSelect(t.value)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={t.icon as any}
                size={22}
                color={selected ? Colors.light.primary : Colors.light.muted}
              />
              <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {currentTarget.targetType === 'role' && (
        <View style={styles.subContainer}>
          <Text style={styles.subLabel}>Select Target Role:</Text>
          <View style={styles.roleWrap}>
            {ROLES.map((r) => {
              const selected = currentTarget.targetRole === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleChip, selected && styles.roleChipSelected]}
                  onPress={() => handleRoleSelect(r.value)}
                >
                  <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {(currentTarget.targetType === 'class' || currentTarget.targetType === 'section') && (
        <View style={styles.subContainer}>
          <Text style={styles.subLabel}>Select Target Class / Section:</Text>
          {loadingClasses ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : classSections.length === 0 ? (
            <Text style={styles.noDataText}>No class sections found. Selection will target all classes.</Text>
          ) : (
            <View style={styles.roleWrap}>
              {classSections.map((cs: any) => {
                const selected = currentTarget.classId === cs.id || currentTarget.sectionId === cs.id;
                const csLabel = cs.name || `${cs.department || ''} ${cs.section || ''}`.trim() || cs.id;
                return (
                  <TouchableOpacity
                    key={cs.id}
                    style={[styles.roleChip, selected && styles.roleChipSelected]}
                    onPress={() => handleClassSelect(cs.id)}
                  >
                    <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{csLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  typeCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#FFF4C7',
  },
  typeText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.muted,
  },
  typeTextSelected: {
    color: Colors.light.text,
    fontFamily: FontFamily.bold,
  },
  subContainer: {
    marginTop: 6,
    gap: 8,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.muted,
  },
  roleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleChipSelected: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.secondary,
  },
  roleText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.text,
  },
  roleTextSelected: {
    color: '#FFFFFF',
  },
  noDataText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.light.muted,
  },
});
