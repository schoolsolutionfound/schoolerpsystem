import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const ADMIN_FEATURES = [
  { icon: 'account-group', title: 'Students', desc: 'Manage all students', gradient: ['#667EEA', '#764BA2'], screen: '/admin-students' },
  { icon: 'account-tie', title: 'Teachers', desc: 'Manage staff', gradient: ['#F093FB', '#F5576C'], screen: '/admin-teachers' },
  { icon: 'calendar-check', title: 'Attendance', desc: 'Reports & analytics', gradient: ['#4FACFE', '#00F2FE'], screen: '/admin-attendance' },
  { icon: 'file-document', title: 'Results', desc: 'Exam management', gradient: ['#43E97B', '#38F9D7'], screen: '/admin-results' },
  { icon: 'cash-multiple', title: 'Fees', desc: 'Collections & reports', gradient: ['#FA709A', '#FEE140'], screen: '/admin-fees' },
  { icon: 'timetable', title: 'Timetable', desc: 'Schedule manager', gradient: ['#A18CD1', '#FBC2EB'], screen: '/admin-timetable' },
  { icon: 'bullhorn', title: 'Announcements', desc: 'Post updates', gradient: ['#FF9A9E', '#FECFEF'], screen: '/admin-announcements' },
  { icon: 'cog', title: 'Settings', desc: 'School config', gradient: ['#667EEA', '#43E97B'], screen: '/admin-settings' },
];

export default function AdminHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName);
  const schoolName = useUserStore((state) => state.schoolName);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = ADMIN_FEATURES.map(() => ({
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(20)).current,
  }));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    ADMIN_FEATURES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(cardAnims[i].opacity, { toValue: 1, duration: 400, delay: 100 + i * 70, useNativeDriver: true }),
        Animated.timing(cardAnims[i].translateY, { toValue: 0, duration: 400, delay: 100 + i * 70, useNativeDriver: true }),
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
            <Text style={styles.greeting}>Welcome, {fullName || 'Admin'} 👋</Text>
            <Text style={styles.schoolName}>{schoolName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/admin-profile')} style={styles.settingsBtn}>
            <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.settingsGradient}>
              <Feather name="settings" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
          <Text style={styles.sectionTitle}>Admin Dashboard</Text>
          <View style={styles.grid}>
            {ADMIN_FEATURES.map((item, i) => (
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
  settingsBtn: { elevation: 6 },
  settingsGradient: {
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
