import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AttendanceReportsView } from '../../features/shared/components/AttendanceReportsView';

export default function PrincipalHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Principal Portal</Text>
          <TouchableOpacity onPress={() => router.push('/(principal)/profile')} style={styles.profileBtn}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color="#171717" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <AttendanceReportsView mode="institution" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8E5DC', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#171717' },
  profileBtn: { padding: 4 },
  content: { flex: 1 },
});
