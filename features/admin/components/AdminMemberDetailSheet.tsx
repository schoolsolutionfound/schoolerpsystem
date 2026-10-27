import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

export interface AdminDetailRow {
  label: string;
  value?: string | number | null;
  valueColor?: string;
}

export interface AdminDetailSection {
  title: string;
  rows: AdminDetailRow[];
}

export interface AdminDetailAction {
  label: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface AdminMemberDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  sections: AdminDetailSection[];
  actions?: AdminDetailAction[];
}

const displayValue = (value?: string | number | null) =>
  value === undefined || value === null || value === '' ? '—' : String(value);

export const AdminMemberDetailSheet: React.FC<AdminMemberDetailSheetProps> = ({
  visible,
  onClose,
  fullName,
  email,
  sections,
  actions = [],
}) => {
  const initials = (fullName || '?').substring(0, 2).toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{fullName || '—'}</Text>
                <Text style={styles.email} numberOfLines={1}>{email || '—'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.rows.map((row, index) => (
                  <View key={`${section.title}-${row.label}-${index}`} style={styles.row}>
                    <Text style={styles.label}>{row.label}</Text>
                    <Text style={[styles.value, row.valueColor ? { color: row.valueColor } : null]} numberOfLines={3}>
                      {displayValue(row.value)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {actions.length > 0 && (
              <View style={styles.actions}>
                {actions.map((action) => (
                  <TouchableOpacity key={action.label} style={styles.actionBtn} onPress={action.onPress}>
                    <MaterialCommunityIcons name={action.icon as any} size={18} color={action.color || '#F4C430'} />
                    <Text style={[styles.actionText, action.color ? { color: action.color } : null]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#D97706' },
  name: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  email: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 1 },
  body: { paddingBottom: 20 },
  section: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 6,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, gap: 12 },
  label: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  value: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#1A1B1C', flex: 1, textAlign: 'right' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontFamily: FontFamily.semibold, color: '#1A1B1C' },
});
