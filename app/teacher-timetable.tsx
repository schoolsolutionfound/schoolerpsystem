import React from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ClassTeacherTimetableBuilder } from '../features/teacher/components/ClassTeacherTimetableBuilder';

export default function TeacherTimetableScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0C29', '#1A1740']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Build Timetable</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          <ClassTeacherTimetableBuilder />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0C29' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F8F9FB', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
});
