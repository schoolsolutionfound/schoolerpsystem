import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { usePlacementStore } from '../store/usePlacementStore';
import { JobDrive, JobType, DriveStatus } from '../types/placement';

export const PlacementDrivesView: React.FC = () => {
  const drives = usePlacementStore((s) => s.drives);
  const addDrive = usePlacementStore((s) => s.addDrive);
  const updateDrive = usePlacementStore((s) => s.updateDrive);
  const deleteDrive = usePlacementStore((s) => s.deleteDrive);
  const setDriveStatus = usePlacementStore((s) => s.setDriveStatus);

  const [filter, setFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState<JobDrive | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobType, setJobType] = useState<JobType>('Full-Time');
  const [packageCTC, setPackageCTC] = useState('18.0 LPA');
  const [packageLPA, setPackageLPA] = useState('18.0');
  const [location, setLocation] = useState('Bangalore / Remote');
  const [minPercentage, setMinPercentage] = useState('70');
  const [driveDate, setDriveDate] = useState('2026-09-25');
  const [deadline, setDeadline] = useState('2026-09-18');
  const [vacancies, setVacancies] = useState('10');
  const [description, setDescription] = useState('');

  const filteredDrives = drives.filter((d) => {
    if (filter !== 'all' && d.status !== filter) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      d.companyName.toLowerCase().includes(q) ||
      d.roleTitle.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      d.packageCTC.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingDrive(null);
    setCompanyName('');
    setRoleTitle('');
    setJobType('Full-Time');
    setPackageCTC('16.0 LPA');
    setPackageLPA('16.0');
    setLocation('Hyderabad / Bangalore');
    setMinPercentage('70');
    setDriveDate('2026-10-05');
    setDeadline('2026-09-28');
    setVacancies('15');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (d: JobDrive) => {
    setEditingDrive(d);
    setCompanyName(d.companyName);
    setRoleTitle(d.roleTitle);
    setJobType(d.jobType);
    setPackageCTC(d.packageCTC);
    setPackageLPA(String(d.packageLPA));
    setLocation(d.location);
    setMinPercentage(String(d.minPercentage));
    setDriveDate(d.driveDate);
    setDeadline(d.applicationDeadline);
    setVacancies(String(d.vacancies));
    setDescription(d.description);
    setShowModal(true);
  };

  const handleSaveDrive = () => {
    if (!companyName.trim() || !roleTitle.trim()) {
      Alert.alert('Missing Fields', 'Please enter Company Name and Role Title.');
      return;
    }

    const lpaNum = parseFloat(packageLPA) || 10;

    if (editingDrive) {
      updateDrive(editingDrive.id, {
        companyName: companyName.trim(),
        roleTitle: roleTitle.trim(),
        jobType,
        packageCTC: packageCTC.trim(),
        packageLPA: lpaNum,
        location: location.trim(),
        minPercentage: parseFloat(minPercentage) || 60,
        driveDate,
        applicationDeadline: deadline,
        vacancies: parseInt(vacancies, 10) || 5,
        description: description.trim(),
      });
      Alert.alert('Drive Updated', `Drive for ${companyName} updated.`);
    } else {
      addDrive({
        companyName: companyName.trim(),
        roleTitle: roleTitle.trim(),
        jobType,
        packageCTC: packageCTC.trim(),
        packageLPA: lpaNum,
        location: location.trim(),
        minPercentage: parseFloat(minPercentage) || 60,
        allowedBranches: ['Computer Science', 'Information Tech', 'All STEM'],
        maxBacklogs: 0,
        driveDate,
        applicationDeadline: deadline,
        rounds: ['Online Assessment', 'Technical Interview', 'HR Discussion'],
        status: 'upcoming',
        vacancies: parseInt(vacancies, 10) || 5,
        description: description.trim() || 'Exciting career opportunity for fresh graduates.',
      });
      Alert.alert('Drive Created', `New placement drive for ${companyName} posted.`);
    }

    setShowModal(false);
  };

  const handleDelete = (d: JobDrive) => {
    Alert.alert('Delete Drive', `Remove recruitment drive for ${d.companyName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDrive(d.id) },
    ]);
  };

  const handleToggleStatus = (d: JobDrive) => {
    const nextStatus: DriveStatus =
      d.status === 'upcoming'
        ? 'ongoing'
        : d.status === 'ongoing'
        ? 'completed'
        : 'upcoming';
    setDriveStatus(d.id, nextStatus);
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Add Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drive by company, role, package..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Drive</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { label: 'All Drives', value: 'all', count: drives.length },
          {
            label: 'Ongoing',
            value: 'ongoing',
            count: drives.filter((d) => d.status === 'ongoing').length,
          },
          {
            label: 'Upcoming',
            value: 'upcoming',
            count: drives.filter((d) => d.status === 'upcoming').length,
          },
          {
            label: 'Completed',
            value: 'completed',
            count: drives.filter((d) => d.status === 'completed').length,
          },
        ].map((f) => {
          const isSelected = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setFilter(f.value as any)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Drives List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredDrives.map((drive) => {
          const isOngoing = drive.status === 'ongoing';
          const isUpcoming = drive.status === 'upcoming';
          const isCompleted = drive.status === 'completed';

          return (
            <View key={drive.id} style={styles.driveCard}>
              <View style={styles.cardHeader}>
                <View style={styles.companyGroup}>
                  <View style={styles.companyIconWrap}>
                    <MaterialCommunityIcons name="domain" size={22} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyName}>{drive.companyName}</Text>
                    <Text style={styles.roleTitle}>{drive.roleTitle}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.statusTag,
                    isOngoing
                      ? styles.tagOngoing
                      : isUpcoming
                      ? styles.tagUpcoming
                      : styles.tagCompleted,
                  ]}
                  onPress={() => handleToggleStatus(drive)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isOngoing
                        ? { color: '#059669' }
                        : isUpcoming
                        ? { color: '#D97706' }
                        : { color: '#64748B' },
                    ]}
                  >
                    {drive.status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Package & Eligibility Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Package CTC</Text>
                  <Text style={styles.packageVal}>{drive.packageCTC}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Eligibility</Text>
                  <Text style={styles.eligibilityVal}>Min {drive.minPercentage}%</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Vacancies</Text>
                  <Text style={styles.vacancyVal}>{drive.vacancies} Seats</Text>
                </View>
              </View>

              {/* Dates & Location Row */}
              <View style={styles.detailsRow}>
                <View style={styles.detailPill}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color="#64748B" />
                  <Text style={styles.detailText}>{drive.location}</Text>
                </View>
                <View style={styles.detailPill}>
                  <MaterialCommunityIcons name="calendar-clock" size={12} color="#64748B" />
                  <Text style={styles.detailText}>Deadline: {drive.applicationDeadline}</Text>
                </View>
              </View>

              {drive.description ? (
                <Text style={styles.descText} numberOfLines={2}>
                  {drive.description}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => handleOpenEdit(drive)}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={14} color="#059669" />
                  <Text style={styles.actionTextSecondary}>Edit Drive</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => handleDelete(drive)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add / Edit Drive Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDrive ? 'Edit Recruitment Drive' : 'Post New Recruitment Drive'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Company Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Google India"
                placeholderTextColor="#94A3B8"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.inputLabel}>Job Role Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Associate Software Engineer"
                placeholderTextColor="#94A3B8"
                value={roleTitle}
                onChangeText={setRoleTitle}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Package (e.g. 24.0 LPA)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="24.0 LPA"
                    placeholderTextColor="#94A3B8"
                    value={packageCTC}
                    onChangeText={(val) => {
                      setPackageCTC(val);
                      setPackageLPA(val.replace(/[^0-9.]/g, ''));
                    }}
                  />
                </View>
                <View style={{ width: 110, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Min % / GPA</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="70"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                    value={minPercentage}
                    onChangeText={setMinPercentage}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Job Location</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Bangalore / Hybrid"
                    placeholderTextColor="#94A3B8"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
                <View style={{ width: 90, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Vacancies</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                    value={vacancies}
                    onChangeText={setVacancies}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Drive Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-09-25"
                    placeholderTextColor="#94A3B8"
                    value={driveDate}
                    onChangeText={setDriveDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Apply Deadline</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-09-18"
                    placeholderTextColor="#94A3B8"
                    value={deadline}
                    onChangeText={setDeadline}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Job Description & Requirements</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Key responsibilities and skills..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDrive} activeOpacity={0.8}>
              <MaterialCommunityIcons name="content-save-check" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{editingDrive ? 'Update Drive' : 'Publish Drive'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterTabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  driveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  companyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  roleTitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagOngoing: { backgroundColor: '#ECFDF5' },
  tagUpcoming: { backgroundColor: '#FEF3C7' },
  tagCompleted: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 9, fontWeight: '800' },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  packageVal: { fontSize: 13, fontWeight: '800', color: '#059669', marginTop: 2 },
  eligibilityVal: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2 },
  vacancyVal: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginTop: 2 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  detailText: { fontSize: 11, color: '#475569' },
  descText: { fontSize: 11, color: '#64748B', lineHeight: 16, marginBottom: 10 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    gap: 8,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionTextSecondary: { color: '#059669', fontSize: 11, fontWeight: '700' },
  actionBtnDelete: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
