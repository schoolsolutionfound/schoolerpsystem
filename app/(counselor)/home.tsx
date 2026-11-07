import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { FontFamily } from '../../constants/fonts';
import {
  createCounselingRecordApi,
  fetchCounselingRecordsApi,
  updateCounselingStatusApi,
} from '../../api/principal';
import { CounselingRecord } from '../../features/principal/types/principal.types';
import { PrincipalWelfareCounselingView } from '../../features/principal/components/PrincipalWelfareCounselingView';
import { AddCounselingNoteModal } from '../../features/principal/components/modals/AddCounselingNoteModal';

export default function CounselorHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Counselor';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const resetUser = useUserStore((s) => s.resetUser);

  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchCounselingRecordsApi();
      setRecords(list);
    } catch (err: any) {
      Alert.alert('Could not load cases', err?.message || 'Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onToggleStatus = async (id: string, current: CounselingRecord['status']) => {
    const next: CounselingRecord['status'] = current === 'resolved' ? 'active' : 'resolved';
    const prev = records;
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));
    try {
      await updateCounselingStatusApi(id, next);
    } catch (err: any) {
      setRecords(prev);
      Alert.alert('Update failed', err?.message || 'Please retry.');
    }
  };

  const handleCreate = async (record: Omit<CounselingRecord, 'id'>) => {
    const created = await createCounselingRecordApi(record);
    setRecords((rs) => [created, ...rs]);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    resetUser();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.flex1}>
          <Text style={styles.hello}>Guidance & Counseling</Text>
          <Text style={styles.name}>{fullName}</Text>
          {!!institutionName && <Text style={styles.inst}>{institutionName}</Text>}
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut} style={styles.iconBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#9D174D" />
      ) : (
        <PrincipalWelfareCounselingView
          records={records}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpenCreateModal={() => setShowCreate(true)}
          onToggleStatus={onToggleStatus}
        />
      )}

      <AddCounselingNoteModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        defaultCounselorName={fullName || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE0',
  },
  flex1: { flex: 1 },
  hello: { fontSize: 12, color: '#6B7280', fontFamily: FontFamily.medium },
  name: { fontSize: 17, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  inst: { fontSize: 12, color: '#6B7280', fontFamily: FontFamily.regular, marginTop: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { marginTop: 48 },
});
