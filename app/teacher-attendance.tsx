import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TeacherTimetableView } from '../features/teacher/components/TeacherTimetableView';
import { AttendanceMarkingView } from '../features/teacher/components/AttendanceMarkingView';

export default function TeacherAttendanceScreen() {
  const router = useRouter();
  const [activeSlot, setActiveSlot] = useState<{ slotId: string; subjectName: string } | null>(null);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (activeSlot ? setActiveSlot(null) : router.back())}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.title}>{activeSlot ? 'Mark Attendance' : 'My Periods'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          {activeSlot ? (
            <AttendanceMarkingView
              slotId={activeSlot.slotId}
              subjectName={activeSlot.subjectName}
              onSaved={() => setActiveSlot(null)}
            />
          ) : (
            <TeacherTimetableView onOpenAttendance={(slotId, subjectName) => setActiveSlot({ slotId, subjectName })} />
          )}
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
