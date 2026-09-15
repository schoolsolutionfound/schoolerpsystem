import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ClassTeacherTimetableBuilder } from '../features/teacher/components/ClassTeacherTimetableBuilder';

export default function TeacherTimetableScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
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
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 17, fontWeight: '800', color: '#171717' },
  body: { flex: 1 },
});
