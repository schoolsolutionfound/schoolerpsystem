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
  Alert,
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
  const [prevSectionId, setPrevSectionId] = useState<string | null>(section?.id || null);

  if (section && section.id !== prevSectionId) {
    setPrevSectionId(section.id);
    setSelectedTeacherId(section.homeroomTeacherId || '');
    setSearch('');
  }

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

    if (teacher.assignedClass && teacher.assignedClass !== section.name) {
      Alert.alert(
        'Teacher Unavailable',
        `${teacher.fullName} is already assigned to ${teacher.assignedClass}. Please choose a teacher without an existing homeroom assignment.`
      );
      return;
    }

    setSaving(true);
    try {
      await onAssign(section.id, teacher.id, teacher.fullName);
      onClose();
    } catch (err: any) {
      Alert.alert('Assignment Failed', err.message || 'Server failed to save homeroom assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = () => {
    Alert.alert(
      'Confirm Unassignment',
      `Are you sure you want to unassign ${section.homeroomTeacherName || 'the teacher'} from ${section.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await onAssign(section.id, '', '');
              onClose();
            } catch (err: any) {
              Alert.alert('Unassign Failed', err.message || 'Server failed to unassign teacher.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="google-classroom" size={20} color="#111827" />
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
            <View style={styles.currentInfoLeft}>
              <Text style={styles.infoLabel}>Currently Assigned To:</Text>
              <Text style={styles.currentTeacherName}>
                {section.homeroomTeacherName ? section.homeroomTeacherName : 'None (Unassigned Class)'}
              </Text>
            </View>
            {!!section.homeroomTeacherId && (
              <TouchableOpacity
                style={styles.unassignBtn}
                onPress={handleUnassign}
                disabled={saving}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={14} color="#DC2626" />
                <Text style={styles.unassignBtnText}>Unassign</Text>
              </TouchableOpacity>
            )}
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
              const isAssignedElsewhere = Boolean(
                teacher.assignedClass && teacher.assignedClass !== section.name
              );
              return (
                <TouchableOpacity
                  key={teacher.id}
                  style={[
                    styles.teacherRow,
                    isSelected && styles.teacherRowActive,
                    isAssignedElsewhere && { opacity: 0.55 },
                  ]}
                  onPress={() => {
                    if (isAssignedElsewhere) return;
                    setSelectedTeacherId(teacher.id);
                  }}
                  disabled={isAssignedElsewhere}
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
                    {isAssignedElsewhere ? (
                      <Text style={[styles.alreadyAssignedText, { color: '#DC2626' }]}>
                        Assigned to: {teacher.assignedClass} (Unavailable)
                      </Text>
                    ) : teacher.assignedClass ? (
                      <Text style={styles.alreadyAssignedText}>
                        Current Homeroom: {teacher.assignedClass}
                      </Text>
                    ) : null}
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
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-bold" size={16} color="#111827" />
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
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentInfoLeft: {
    flex: 1,
  },
  unassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  unassignBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: FontFamily.bold,
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
    borderColor: '#111827',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F4C430',
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
    backgroundColor: '#F4C430',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  saveBtnDisabled: {
    backgroundColor: '#E8E5DC',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
});
