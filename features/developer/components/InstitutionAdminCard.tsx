import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { InstitutionAdmin } from '../types/developer.types';
import { AppCard } from '../../shared/components/AppCard';
import { AppBadge } from '../../shared/components/AppBadge';
import { Colors, BorderRadius } from '../../../constants/theme';

interface InstitutionAdminCardProps {
  admin: InstitutionAdmin;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const InstitutionAdminCard: React.FC<InstitutionAdminCardProps> = ({
  admin,
  onPress,
  onEdit,
  onDelete,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const departmentsList = admin.scope?.departments || [];
  const yearsList = admin.scope?.academicYears || [];

  const cardContent = (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(admin.fullName)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {admin.fullName}
            </Text>
            {Boolean(admin.role) && (
              <AppBadge
                label={admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                type="college"
                style={styles.roleBadge}
              />
            )}
            {Boolean(admin.title) && (
              <AppBadge
                label={admin.title}
                type="school"
                style={styles.titleBadge}
              />
            )}
          </View>

          <Text style={styles.institutionText} numberOfLines={1}>
            {admin.institutionName}
          </Text>
          <Text style={styles.emailText} numberOfLines={1}>
            {admin.email}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={Colors.light.primary}
              />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={Colors.light.danger}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.scopeContainer}>
        <View style={styles.scopeRow}>
          <Text style={styles.scopeLabel}>Departments:</Text>
          <Text style={styles.scopeValue} numberOfLines={1}>
            {departmentsList.length > 0 ? departmentsList.join(', ') : 'All'}
          </Text>
        </View>

        <View style={styles.scopeRow}>
          <Text style={styles.scopeLabel}>Years:</Text>
          <Text style={styles.scopeValue} numberOfLines={1}>
            {yearsList.length > 0 ? yearsList.join(', ') : 'All'}
          </Text>
          <View style={styles.statusBadgeContainer}>
            <AppBadge
              label={admin.status === 'inactive' ? 'Inactive' : 'Active'}
              type={admin.status === 'inactive' ? 'inactive' : 'active'}
            />
          </View>
        </View>
      </View>
    </AppCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: BorderRadius.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '700',
    marginRight: 6,
  },
  roleBadge: {
    marginVertical: 2,
    marginRight: 4,
  },
  titleBadge: {
    marginVertical: 2,
  },
  institutionText: {
    fontSize: 12,
    color: Colors.light.icon,
    fontWeight: '600',
  },
  emailText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  scopeContainer: {
    marginTop: 4,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scopeLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    width: 85,
  },
  scopeValue: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600',
    flex: 1,
  },
  statusBadgeContainer: {
    marginLeft: 'auto',
  },
});
