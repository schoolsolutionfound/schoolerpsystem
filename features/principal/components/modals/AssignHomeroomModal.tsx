import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import { HomeroomSection, PrincipalStaffMember } from '../../types/principal.types';

interface AssignHomeroomModalProps {
  visible: boolean;
  section: HomeroomSection | null;
  staffList: PrincipalStaffMember[];
  onClose: () => void;
  onAssign: (sectionId: string, teacherId: string, teacherName: string) => Promise<void>;
}

export const AssignHomeroomModal: React.FC<AssignHomeroomModalProps> = ({
  visible,
  section,
  staffList,
  onClose,
  onAssign,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(section?.homeroomTeacherId || '');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync state if section changes
  React.useEffect(() => {
    setSelectedTeacherId(section?.homeroomTeacherId || '');
    setSearch('');
  }, [section]);

  if (!section) return null;

  const eligibleTeachers = staffList.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.department?.toLowerCase().includes(q) ||
      t.designation.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!selectedTeacherId) return;
    const teacher = staffList.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    setSaving(true);
    try {
      await onAssign(section.id, teacher.id, teacher.fullName);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="google-classroom" size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.title}>Assign Class Teacher</Text>
                <Text style={styles.subTitle}>
                  {section.name} • {section.roomNumber || 'Room unassigned'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          {/* Current Homeroom Status */}
          <View style={styles.currentInfoCard}>
            <Text style={styles.infoLabel}>Currently Assigned To:</Text>
            <Text style={styles.currentTeacherName}>
              {section.homeroomTeacherName ? section.homeroomTeacherName : '⚠️ None (Unassigned Class)'}
            </Text>
          </View>

          {/* Search Faculty */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search faculty name, subject, wing..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Teacher Selection List */}
          <Text style={styles.listHeaderLabel}>Select Faculty Member ({eligibleTeachers.length} available)</Text>
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {eligibleTeachers.map((teacher) => {
              const isSelected = selectedTeacherId === teacher.id;
              return (
                <TouchableOpacity
                  key={teacher.id}
                  style={[styles.teacherRow, isSelected && styles.teacherRowActive]}
                  onPress={() => setSelectedTeacherId(teacher.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                    <Text style={[styles.avatarText, isSelected && styles.avatarTextActive]}>
                      {teacher.fullName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher.fullName}</Text>
                    <Text style={styles.teacherMeta}>
                      {teacher.department || 'General'} • {teacher.experienceYears || 5} yrs exp
                    </Text>
                    {teacher.assignedClass && (
                      <Text style={styles.alreadyAssignedText}>
                        Already Homeroom for: {teacher.assignedClass}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!selectedTeacherId || saving}
              style={[styles.saveBtn, (!selectedTeacherId || saving) && styles.saveBtnDisabled]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-bold" size={16} color="#FFFFFF" />
                  <Text style={styles.saveText}>Confirm Assignment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  subTitle: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  currentInfoCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
  },
  currentTeacherName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },
  listHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  scrollList: {
    maxHeight: 260,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 6,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.card,
    gap: 12,
  },
  teacherRowActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleActive: {
    backgroundColor: '#0284C7',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    fontFamily: FontFamily.extrabold,
  },
  avatarTextActive: {
    color: '#FFFFFF',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  teacherMeta: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  alreadyAssignedText: {
    fontSize: 11,
    color: '#D97706',
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0284C7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.semibold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
