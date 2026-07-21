import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';
import { usePathname, useRouter } from 'expo-router';

const periods = [
  { label: '1st Period', time: '08:00 AM\n- 08:50 AM', subject: 'English', room: 'Room 101', icon: 'book' as any, iconBg: '#E8EAF6', status: 'done' },
  { label: '2nd Period', time: '08:50 AM\n- 09:40 AM', subject: 'Science', room: 'Room 203', icon: 'flask-outline' as any, iconBg: '#FFF3E0', status: 'done' },
  { label: '3rd Period', time: '09:40 AM\n- 10:30 AM', subject: 'Mathematics', room: 'Room 204', icon: 'calculator-variant-outline' as any, iconBg: '#EDE7F6', status: 'now' },
  { label: '4th Period', time: '10:45 AM\n- 11:35 AM', subject: 'Social Studies', room: 'Room 105', icon: 'earth' as any, iconBg: '#E8F5E9', status: 'upcoming' },
  { label: '5th Period', time: '11:35 AM\n- 12:25 PM', subject: 'Music', room: 'Room 301', icon: 'music-note' as any, iconBg: '#FCE4EC', status: 'upcoming' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning!';
  if (hour < 17) return 'Good Afternoon!';
  return 'Good Evening!';
}

function PeriodIcon({ name, bg }: { name: any; bg: string }) {
  return (
    <View style={[styles.periodIcon, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={name} size={20} color="#1E3A5F" />
    </View>
  );
}

export default function HomeScreen() {
  const fullName = useUserStore((state) => state.fullName);
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { label: 'Home', icon: 'home' as any, route: '/home' },
    { label: 'Attendance', icon: 'account-outline' as any, route: '/home' },
    { label: 'Schedule', icon: 'calendar-outline' as any, route: '/home' },
    { label: 'Reports', icon: 'chart-bar' as any, route: '/home' },
    { label: 'Profile', icon: 'account-circle-outline' as any, route: '/home' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={24} color="#2D3748" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#2D3748" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile + Greeting */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={40} color="#B0B0B0" />
            </View>
            <View style={styles.greetingBox}>
              <Text style={styles.welcomeLabel}>Welcome,</Text>
              <Text style={styles.studentName}>{fullName || 'Student'} 👋</Text>
              <Text style={styles.greetingMsg}>{getGreeting()}</Text>
            </View>
          </View>

          {/* Attendance + Current Period */}
          <View style={styles.topCards}>
            {/* Attendance */}
            <View style={styles.attendanceCard}>
              <Text style={styles.cardTitle}>Attendance</Text>
              <View style={styles.attendanceBody}>
                <View>
                  <Text style={styles.attendancePercent}>92%</Text>
                  <Text style={styles.attendanceMonth}>This Month</Text>
                </View>
                <View style={styles.attendanceRingOuter}>
                  <View style={styles.attendanceRingMiddle}>
                    <View style={styles.attendanceRingInner}>
                      <MaterialCommunityIcons name="calendar-check-outline" size={24} color="#4CAF50" />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Current Period */}
            <View style={styles.currentPeriodCard}>
              <Text style={styles.cardTitle}>Current Period</Text>
              <Text style={styles.currentSubject}>Mathematics</Text>
              <Text style={styles.currentSubject}>Mathematics</Text>
              <Text style={styles.currentTime}>09:40 AM - 10:30 AM</Text>
              <View style={styles.roomPill}>
                <Text style={styles.roomPillText}>Room 204</Text>
              </View>
              <View style={styles.bookIconCircle}>
                <MaterialCommunityIcons name="book-open-variant" size={22} color="#7E57C2" />
              </View>
            </View>
          </View>

          {/* Announcement */}
          <View style={styles.announcementCard}>
            <View style={styles.announcementIconWrap}>
              <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#7E57C2" />
            </View>
            <View style={styles.announcementBody}>
              <View style={styles.announcementTop}>
                <Text style={styles.announcementTitle}>Announcement</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>{'View All  >'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.announcementDesc}>
                Parents-Teacher Meeting is scheduled on 24th May 2025 (Saturday) at 10:00 AM.
              </Text>
            </View>
          </View>

          {/* Today's Periods */}
          <View style={styles.periodsCard}>
            <View style={styles.periodsTitleRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#2D3748" />
              <Text style={styles.periodsHeading}>Today's Periods</Text>
            </View>

            {periods.map((item, index) => {
              const isNow = item.status === 'now';
              const isDone = item.status === 'done';
              return (
                <View
                  key={index}
                  style={[
                    styles.periodItem,
                    isNow && styles.periodItemActive,
                    index === periods.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {isNow && <View style={styles.activeBar} />}

                  {/* Left: Period + Time */}
                  <View style={styles.periodLeft}>
                    <Text style={styles.periodLabel}>{item.label}</Text>
                    <Text style={styles.periodTime}>{item.time}</Text>
                  </View>

                  {/* Divider */}
                  <View style={styles.periodDivider} />

                  {/* Center: Icon + Subject */}
                  <View style={styles.periodCenter}>
                    <PeriodIcon name={item.icon} bg={item.iconBg} />
                    <View style={styles.periodInfo}>
                      <Text style={styles.periodSubject}>{item.subject}</Text>
                      <Text style={styles.periodRoom}>{item.room}</Text>
                    </View>
                  </View>

                  {/* Right: Status */}
                  <View style={styles.periodRight}>
                    {isDone && (
                      <View style={styles.checkCircle}>
                        <MaterialCommunityIcons name="check" size={16} color="#4CAF50" />
                      </View>
                    )}
                    {isNow && (
                      <View style={styles.nowPill}>
                        <Text style={styles.nowPillText}>Now</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
          <View style={styles.tabRow}>
            {tabs.map((tab, index) => {
              const isActive = index === 0;
              return (
                <TouchableOpacity key={index} style={styles.tabItem}>
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={22}
                    color={isActive ? '#7E57C2' : '#A0AEC0'}
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F9',
  },
  safeTop: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#7E57C2',
    borderWidth: 2,
    borderColor: '#F5F5F9',
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E0D6F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C5BDE8',
    marginRight: 14,
  },
  greetingBox: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 14,
    color: '#718096',
  },
  studentName: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 1,
  },
  greetingMsg: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 1,
  },

  // Top Cards Row
  topCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },

  // Attendance Card
  attendanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6F7E6',
  },
  cardTitle: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 8,
  },
  attendanceBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendancePercent: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#48BB78',
  },
  attendanceMonth: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
  },
  attendanceRingOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: '#C6F6D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceRingMiddle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#9AE6B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceRingInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Current Period Card
  currentPeriodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE9F6',
    overflow: 'hidden',
  },
  currentSubject: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#7E57C2',
    marginBottom: 2,
  },
  currentTime: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
    marginBottom: 8,
  },
  roomPill: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roomPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E57C2',
  },
  bookIconCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Announcement
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9F6',
    alignItems: 'flex-start',
  },
  announcementIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementBody: {
    flex: 1,
  },
  announcementTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  viewAllText: {
    fontSize: 12,
    color: '#7E57C2',
    fontWeight: '600',
  },
  announcementDesc: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
  },

  // Today's Periods
  periodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  periodsHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A202C',
  },

  // Period Row
  periodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    overflow: 'hidden',
  },
  periodItemActive: {
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 3,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#7E57C2',
  },
  periodLeft: {
    width: 68,
    marginLeft: 6,
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D3748',
  },
  periodTime: {
    fontSize: 9,
    color: '#A0AEC0',
    marginTop: 3,
    lineHeight: 12,
  },
  periodDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  periodCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  periodIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  periodInfo: {
    flex: 1,
  },
  periodSubject: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  periodRoom: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 1,
  },
  periodRight: {
    width: 42,
    alignItems: 'flex-end',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9AE6B4',
  },
  nowPill: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nowPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7E57C2',
  },

  // Bottom Tab Bar
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  safeBottom: {},
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 4,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: '#A0AEC0',
  },
  tabLabelActive: {
    color: '#7E57C2',
    fontWeight: '600',
  },
});
