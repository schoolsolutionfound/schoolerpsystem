import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const TEACHER_FEATURES = [
  { icon: 'calendar-check', title: 'Mark Attendance', desc: 'Take class roll', gradient: ['#667EEA', '#764BA2'], screen: '/teacher-attendance' },
  { icon: 'timetable', title: 'My Schedule', desc: 'Today\'s periods', gradient: ['#43E97B', '#38F9D7'], screen: '/teacher-attendance' },
  { icon: 'calendar-edit', title: 'Build Timetable', desc: 'For your class', gradient: ['#4FACFE', '#00F2FE'], screen: '/teacher-timetable' },
  { icon: 'file-document-edit', title: 'Enter Grades', desc: 'Post exam marks', gradient: ['#F093FB', '#F5576C'], screen: '/teacher-attendance' },
  { icon: 'account-group', title: 'My Classes', desc: 'Assigned sections', gradient: ['#FA709A', '#FEE140'], screen: '/teacher-attendance' },
  { icon: 'bell', title: 'Notifications', desc: 'School updates', gradient: ['#A18CD1', '#FBC2EB'], screen: '/notifications' },
];

export default function TeacherHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName);
  const institutionName = useUserStore((state) => state.institutionName);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = TEACHER_FEATURES.map(() => ({
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(20)).current,
  }));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    TEACHER_FEATURES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(cardAnims[i].opacity, { toValue: 1, duration: 400, delay: 100 + i * 80, useNativeDriver: true }),
        Animated.timing(cardAnims[i].translateY, { toValue: 0, duration: 400, delay: 100 + i * 80, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0C29', '#1A1740']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.greeting}>Hello, {fullName || 'Teacher'} 👋</Text>
            <Text style={styles.schoolName}>{institutionName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(teacher)/profile')} style={styles.avatarBtn}>
            <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.avatarGradient}>
              <Feather name="user" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
          <Text style={styles.sectionTitle}>Teacher Dashboard</Text>
          <View style={styles.grid}>
            {TEACHER_FEATURES.map((item, i) => (
              <Animated.View
                key={i}
                style={[styles.cardWrapper, { opacity: cardAnims[i].opacity, transform: [{ translateY: cardAnims[i].translateY }] }]}
              >
                <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(item.screen as any)}>
                  <LinearGradient
                    colors={item.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                  >
                    <MaterialCommunityIcons name={item.icon as any} size={26} color="#FFF" />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0C29' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 10, paddingBottom: 6,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  schoolName: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '500' },
  avatarBtn: { elevation: 6 },
  avatarGradient: {
    width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#667EEA', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  gridContent: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 14 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrapper: { width: CARD_WIDTH },
  card: {
    borderRadius: 18, padding: 16, minHeight: 120,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#FFF', marginTop: 12 },
  cardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '500' },
});
