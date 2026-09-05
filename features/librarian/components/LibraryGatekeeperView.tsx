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
import { useLibraryStore } from '../store/useLibraryStore';
import { VisitorPurpose } from '../types/library';

const PURPOSES: VisitorPurpose[] = [
  'Self Study',
  'Book Issue / Return',
  'Research & Reference',
  'Digital Lab Access',
  'Class Reading Period',
  'Faculty Research',
];

export const LibraryGatekeeperView: React.FC = () => {
  const entryLogs = useLibraryStore((s) => s.entryLogs);
  const maxCapacity = useLibraryStore((s) => s.maxCapacity);
  const insideCount = useLibraryStore((s) => s.getInsideVisitorsCount());
  const checkInVisitor = useLibraryStore((s) => s.checkInVisitor);
  const checkOutVisitor = useLibraryStore((s) => s.checkOutVisitor);

  const [filter, setFilter] = useState<'inside' | 'all' | 'exited'>('inside');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Check-In Form
  const [visitorName, setVisitorName] = useState('Rohan Verma');
  const [visitorRole, setVisitorRole] = useState<'student' | 'teacher'>('student');
  const [className, setClassName] = useState('Class 10-A');
  const [purpose, setPurpose] = useState<VisitorPurpose>('Self Study');
  const [tableNumber, setTableNumber] = useState('Table T-12');

  const occupancyPct = Math.min(100, Math.round((insideCount / maxCapacity) * 100));

  const filteredLogs = entryLogs.filter((log) => {
    if (filter === 'inside' && log.status !== 'inside') return false;
    if (filter === 'exited' && log.status !== 'exited') return false;

    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      log.visitorName.toLowerCase().includes(q) ||
      (log.className && log.className.toLowerCase().includes(q)) ||
      log.purpose.toLowerCase().includes(q) ||
      (log.tableNumber && log.tableNumber.toLowerCase().includes(q))
    );
  });

  const handleOpenCheckIn = () => {
    setVisitorName('');
    setClassName('Class 10-A');
    setPurpose('Self Study');
    setTableNumber(`T-${Math.floor(1 + Math.random() * 30)}`);
    setShowCheckInModal(true);
  };

  const handleConfirmCheckIn = () => {
    if (!visitorName.trim()) {
      Alert.alert('Name Required', 'Please enter student or teacher name.');
      return;
    }

    checkInVisitor({
      visitorName: visitorName.trim(),
      visitorRole,
      className: className.trim(),
      purpose,
      tableNumber: tableNumber.trim(),
    });

    Alert.alert('Entry Logged', `${visitorName} marked INSIDE the library.`);
    setShowCheckInModal(false);
  };

  const handleCheckOut = (logId: string, name: string) => {
    Alert.alert('Log Exit', `Mark ${name} as exited from the library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Check Out',
        onPress: () => {
          checkOutVisitor(logId);
          Alert.alert('Exit Recorded', `${name} logged out. Total duration saved.`);
        },
      },
    ]);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Real-Time Gatekeeper Occupancy Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTagText}>DIGITAL GATEKEEPER & FOOTFALL</Text>
            </View>
            <Text style={styles.heroCount}>
              {insideCount} <Text style={styles.heroMax}>/ {maxCapacity} Capacity</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.quickCheckInBtn}
            onPress={handleOpenCheckIn}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="account-arrow-right" size={18} color="#FFFFFF" />
            <Text style={styles.quickCheckInText}>Check-In</Text>
          </TouchableOpacity>
        </View>

        {/* Occupancy Bar */}
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${occupancyPct}%`,
                backgroundColor:
                  occupancyPct > 85 ? '#EF4444' : occupancyPct > 60 ? '#F59E0B' : '#10B981',
              },
            ]}
          />
        </View>
        <Text style={styles.occupancySub}>
          {maxCapacity - insideCount} available study seats and workstations
        </Text>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search visitor, purpose, table..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterChipsRow}>
          {[
            { label: 'Inside Now', value: 'inside', count: insideCount },
            { label: 'All Today', value: 'all', count: entryLogs.length },
            {
              label: 'Exited',
              value: 'exited',
              count: entryLogs.filter((l) => l.status === 'exited').length,
            },
          ].map((f) => {
            const isSelected = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setFilter(f.value as any)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {f.label} ({f.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Visitor Logs List */}
      <ScrollView contentContainerStyle={styles.logsList} showsVerticalScrollIndicator={false}>
        {filteredLogs.map((log) => {
          const isInside = log.status === 'inside';
          return (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logTopRow}>
                <View style={styles.visitorInfo}>
                  <View
                    style={[
                      styles.avatarBadge,
                      { backgroundColor: isInside ? '#FEF3C7' : '#F1F5F9' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={log.visitorRole === 'teacher' ? 'account-tie' : 'account-school'}
                      size={20}
                      color={isInside ? '#D97706' : '#64748B'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.visitorName}>{log.visitorName}</Text>
                    <Text style={styles.visitorClass}>
                      {log.className || log.visitorRole.toUpperCase()}
                      {log.tableNumber ? ` • ${log.tableNumber}` : ''}
                    </Text>
                  </View>
                </View>

                {isInside ? (
                  <TouchableOpacity
                    style={styles.checkOutBtn}
                    onPress={() => handleCheckOut(log.id, log.visitorName)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="logout" size={14} color="#FFFFFF" />
                    <Text style={styles.checkOutBtnText}>Exit</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.exitedBadge}>
                    <Text style={styles.exitedBadgeText}>
                      Stayed {log.durationMinutes || 30}m
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.logBottomRow}>
                <View style={styles.purposePill}>
                  <MaterialCommunityIcons name="compass-outline" size={12} color="#4F46E5" />
                  <Text style={styles.purposeText}>{log.purpose}</Text>
                </View>

                <Text style={styles.timeLogText}>
                  In: {formatTime(log.entryTime)}
                  {log.exitTime ? ` • Out: ${formatTime(log.exitTime)}` : ' • Currently Active'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Check-In Modal */}
      <Modal visible={showCheckInModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Library Gate Check-In</Text>
              <TouchableOpacity onPress={() => setShowCheckInModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Visitor Role</Text>
              <View style={styles.roleToggleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, visitorRole === 'student' && styles.roleBtnActive]}
                  onPress={() => setVisitorRole('student')}
                >
                  <Text style={[styles.roleBtnText, visitorRole === 'student' && styles.roleBtnTextActive]}>
                    Student
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, visitorRole === 'teacher' && styles.roleBtnActive]}
                  onPress={() => setVisitorRole('teacher')}
                >
                  <Text style={[styles.roleBtnText, visitorRole === 'teacher' && styles.roleBtnTextActive]}>
                    Faculty / Teacher
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Visitor Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Student or Teacher Name"
                placeholderTextColor="#94A3B8"
                value={visitorName}
                onChangeText={setVisitorName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Class / Dept</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Class 10-A"
                    placeholderTextColor="#94A3B8"
                    value={className}
                    onChangeText={setClassName}
                  />
                </View>
                <View style={{ width: 110, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Desk / Table</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Table T-12"
                    placeholderTextColor="#94A3B8"
                    value={tableNumber}
                    onChangeText={setTableNumber}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Purpose of Visit</Text>
              <View style={styles.purposeGrid}>
                {PURPOSES.map((p) => {
                  const isSelected = purpose === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.purposeOption, isSelected && styles.purposeOptionActive]}
                      onPress={() => setPurpose(p)}
                    >
                      <Text style={[styles.purposeOptionText, isSelected && styles.purposeOptionTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.confirmCheckInBtn} onPress={handleConfirmCheckIn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="login" size={18} color="#FFFFFF" />
              <Text style={styles.confirmCheckInBtnText}>Confirm Entry & Assign Seat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.card,
    padding: 16,
    margin: 16,
    marginBottom: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveTagText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  heroCount: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  heroMax: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  quickCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  quickCheckInText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: { height: '100%', borderRadius: 3 },
  occupancySub: { fontSize: 11, color: '#94A3B8' },
  filterBar: { paddingHorizontal: 16, marginBottom: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  filterChipsRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  logsList: { paddingHorizontal: 16, paddingBottom: 40 },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  visitorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  visitorClass: { fontSize: 11, color: '#64748B', marginTop: 2 },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  checkOutBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  exitedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exitedBadgeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  logBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 10,
    paddingTop: 8,
  },
  purposePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  purposeText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  timeLogText: { fontSize: 10, color: '#94A3B8' },
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
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
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
  roleToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#D97706' },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  roleBtnTextActive: { color: '#FFFFFF' },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  purposeOption: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purposeOptionActive: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  purposeOptionText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  purposeOptionTextActive: { color: '#92400E', fontWeight: '800' },
  confirmCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  confirmCheckInBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
