import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, RefreshControl, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { fetchParentAttendanceApi } from '../../api/academics';
import { fetchAdmissionsApi } from '../../api/admissions';
import { auth } from '../../firebaseConfig';
import { ParentHomeHeader } from '../../features/parent/components/ParentHomeHeader';
import { ParentHomeDashboard } from '../../features/parent/components/ParentHomeDashboard';
import { ParentAttendanceView } from '../../features/parent/components/ParentAttendanceView';
import { ParentMarksView } from '../../features/parent/components/ParentMarksView';
import { ParentHomeworkView } from '../../features/parent/components/ParentHomeworkView';
import { ParentTrackView } from '../../features/parent/components/ParentTrackView';
import { ParentDrawer } from '../../features/parent/components/ParentDrawer';
import { SchoolDiscoveryFeed } from '../../features/parent/components/SchoolDiscoveryFeed';
import { ApplicationStatusTracker } from '../../features/parent/components/ApplicationStatusTracker';
import { FontFamily } from '../../constants/fonts';

type Tab = 'home' | 'fees' | 'track' | 'attendance' | 'marks' | 'homework' | 'discover' | 'applications';

const TABS: { key: Tab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline', iconFilled: 'compass' },
  { key: 'fees', label: 'Fees', icon: 'cash', iconFilled: 'cash' },
  { key: 'track', label: 'Track', icon: 'bus', iconFilled: 'bus' },
  { key: 'attendance', label: 'Attendance', icon: 'book-outline', iconFilled: 'book' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline', iconFilled: 'certificate' },
];

export default function ParentHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Parent';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || 'home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [overall, setOverall] = useState<{ present: number; total: number; percentage: number } | null>(null);
  const storeChildName = useUserStore((state) => state.childName) || '';
  const [childName, setChildName] = useState(storeChildName);
  const [childProfile, setChildProfile] = useState<any>(null);
  const [showChildProfile, setShowChildProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const storeLinkedStudentUSN = useUserStore((state) => state.linkedStudentUSN) || '';
  const storeRelation = useUserStore((state) => state.relation) || '';
  const storeChildId = useUserStore((state) => state.childId) || '';
  const storeEmail = useUserStore((state) => state.email) || '';

  useEffect(() => {
    if (storeChildName && !childName) {
      setChildName(storeChildName);
    }
  }, [storeChildName]);

  const fetchAttendance = useCallback(async () => {
    let foundChildName = '';
    try {
      const res = await fetchParentAttendanceApi();
      setOverall(res?.overall || null);
      if (res) {
        setChildProfile(res);
        if (res.childName) {
          foundChildName = res.childName;
          setChildName(res.childName);
          useUserStore.getState().setUserProfile({
            childName: res.childName,
            childId: res.childId || '',
            linkedStudentUSN: res.childUSN || '',
            relation: res.relation || '',
          });
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes('No linked student found')) {
        console.warn('[ParentHome] fetchAttendance error:', err);
      }
    }

    // If attendance didn't resolve a linked child, check store or accepted admissions
    if (!foundChildName) {
      if (storeChildName) {
        setChildName(storeChildName);
        foundChildName = storeChildName;
      }

      // Check if parent has any officially accepted admission application
      try {
        const currentUid = auth.currentUser?.uid;
        if (currentUid) {
          const admissions = await fetchAdmissionsApi({ parentId: currentUid });
          const acceptedApp = (admissions || []).find((a) => a.status === 'accepted');
          if (acceptedApp) {
            setChildName(acceptedApp.childFullName);
            setChildProfile({
              childName: acceptedApp.childFullName,
              childClassSectionName: acceptedApp.gradeApplyingFor,
              schoolName: acceptedApp.schoolName,
              childUSN: acceptedApp.schoolId,
              relation: 'Parent',
              overall: { present: 0, total: 0, percentage: 100 },
            });
            useUserStore.getState().setUserProfile({
              childName: acceptedApp.childFullName,
              schoolName: acceptedApp.schoolName,
              institutionName: acceptedApp.schoolName,
              institutionCode: acceptedApp.schoolId,
              schoolId: acceptedApp.schoolId,
              relation: 'Parent',
            });
          }
        }
      } catch (admErr) {
        console.warn('[ParentHome] admissions fetch error:', admErr);
      }
    }
  }, [storeChildName]);

  const openChildProfile = useCallback(async () => {
    setShowChildProfile(true);
    setProfileLoading(true);
    try {
      const res = await fetchParentAttendanceApi();
      if (res) {
        setChildProfile(res);
        setOverall(res.overall || null);
        if (res.childName) {
          setChildName(res.childName);
          useUserStore.getState().setUserProfile({
            childName: res.childName,
            childId: res.childId || '',
            linkedStudentUSN: res.childUSN || '',
            relation: res.relation || '',
          });
        }
      }
    } catch (err: any) {
      if (!err?.message?.includes('No linked student found')) {
        console.warn('[ParentHome] openChildProfile fetch error:', err);
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAttendance();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAttendance]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#1A1B1C"
      colors={['#1A1B1C']}
      progressBackgroundColor="#FFFFFF"
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            <ParentHomeDashboard
              childName={childName || storeChildName}
              overallAttendance={overall}
              onTabSwitch={(tab) => setActiveTab(tab as Tab)}
              onViewProfile={openChildProfile}
            />
          </ScrollView>
        );
      case 'attendance':
        return <ParentAttendanceView />;
      case 'fees':
        return (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.placeholderCard}>
              <MaterialCommunityIcons name="cash" size={40} color="#E8E5DC" />
              <Text style={styles.placeholderTitle}>Fee Module</Text>
              <Text style={styles.placeholderSub}>Fee management coming soon.</Text>
            </View>
          </ScrollView>
        );
      case 'track':
        return <ParentTrackView />;
      case 'marks':
        return <ParentMarksView />;
      case 'homework':
        return <ParentHomeworkView />;
      case 'discover':
        return <SchoolDiscoveryFeed />;
      case 'applications':
        return <ApplicationStatusTracker />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ParentHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(parent)/profile')}
        />

        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Floating pill tab bar — center FAB for Track */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isCenter = tab.key === 'track';
              const isActive = activeTab === tab.key;

              if (isCenter) {
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.centerBtnWrap}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.centerBtnRing, isActive && styles.centerBtnRingActive]}>
                      <View style={[styles.centerBtn, isActive && styles.centerBtnActive]}>
                        <MaterialCommunityIcons
                          name={tab.iconFilled as any}
                          size={26}
                          color={isActive ? '#F4C430' : '#E8E5DC'}
                        />
                      </View>
                    </View>
                    <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                    <MaterialCommunityIcons
                      name={isActive ? (tab.iconFilled as any) : (tab.icon as any)}
                      size={22}
                      color={isActive ? '#1A1B1C' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <ParentDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSwitchTab={(tab: string) => setActiveTab(tab as Tab)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
      />

      {/* Child Profile Modal */}
      <Modal visible={showChildProfile} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowChildProfile(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFEFE' }}>
          <View style={styles.profileModalHeader}>
            <TouchableOpacity onPress={() => setShowChildProfile(false)} style={styles.profileCloseBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#1A1B1C" />
            </TouchableOpacity>
            <Text style={styles.profileModalTitle}>Child Profile</Text>
            <View style={{ width: 36 }} />
          </View>
          {profileLoading && !childProfile ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="account-school-outline" size={40} color="#E8E5DC" />
              <Text style={{ fontSize: 13, fontFamily: FontFamily.medium, color: '#6B6B6B' }}>Loading child profile...</Text>
            </View>
          ) : (
          <ScrollView contentContainerStyle={styles.profileScroll} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={styles.profileHero}>
              <View style={styles.profileAvatar}>
                <MaterialCommunityIcons name="account" size={40} color="#1A1B1C" />
              </View>
              <Text style={styles.profileName}>{childProfile?.childName || storeChildName || '—'}</Text>
              <Text style={styles.profileEmail}>{childProfile?.childEmail || storeEmail || '—'}</Text>
              <View style={styles.profileBadgeRow}>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>Student</Text>
                </View>
                <View style={styles.profileBadgeDark}>
                  <Text style={styles.profileBadgeDarkText}>{childProfile?.relation || storeRelation || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatCell}>
                <Text style={styles.profileStatVal}>{childProfile?.childUSN || storeLinkedStudentUSN || '—'}</Text>
                <Text style={styles.profileStatLabel}>USN</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatCell}>
                <Text style={styles.profileStatVal}>{childProfile?.childSection || '—'}</Text>
                <Text style={styles.profileStatLabel}>Section</Text>
              </View>
            </View>

            {/* Academic Info */}
            <View style={styles.profileCard}>
              <View style={styles.profileCardHeader}>
                <MaterialCommunityIcons name="school" size={16} color="#F4C430" />
                <Text style={styles.profileCardTitle}>Academic Info</Text>
              </View>
              <View style={styles.profileGridRow}>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Class</Text>
                  <Text style={styles.profileInfoVal}>{childProfile?.childDepartment || '—'}</Text>
                </View>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Year</Text>
                  <Text style={styles.profileInfoVal}>{childProfile?.childAcademicYear || '—'}</Text>
                </View>
              </View>
              <View style={styles.profileGridRow}>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Section</Text>
                  <Text style={styles.profileInfoVal}>{childProfile?.childSection || '—'}</Text>
                </View>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Class</Text>
                  <Text style={styles.profileInfoVal}>{childProfile?.childClassSectionName || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Contact */}
            <View style={styles.profileCard}>
              <View style={styles.profileCardHeader}>
                <MaterialCommunityIcons name="phone-outline" size={16} color="#F4C430" />
                <Text style={styles.profileCardTitle}>Contact</Text>
              </View>
              <View style={styles.profileGridRow}>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Phone</Text>
                  <Text style={styles.profileInfoVal}>{childProfile?.childPhone || '—'}</Text>
                </View>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Email</Text>
                  <Text style={styles.profileInfoVal} numberOfLines={1}>{childProfile?.childEmail || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Attendance Summary */}
            <View style={styles.profileCard}>
              <View style={styles.profileCardHeader}>
                <MaterialCommunityIcons name="book-check" size={16} color="#F4C430" />
                <Text style={styles.profileCardTitle}>Attendance</Text>
              </View>
              <View style={styles.profileGridRow}>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Present</Text>
                  <Text style={styles.profileInfoVal}>{overall?.present ?? '—'}</Text>
                </View>
                <View style={styles.profileGridCell}>
                  <Text style={styles.profileInfoLabel}>Total</Text>
                  <Text style={styles.profileInfoVal}>{overall?.total ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.profileGridRow}>
                <View style={[styles.profileGridCell, { flex: 2 }]}>
                  <Text style={styles.profileInfoLabel}>Percentage</Text>
                  <Text style={styles.profileInfoVal}>{overall?.percentage ?? 0}%</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  placeholderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: '#1A1B1C',
    marginTop: 12,
    marginBottom: 4,
  },
  placeholderSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 18,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    alignItems: 'flex-start',
  },
  announcementIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: { flex: 1, gap: 4 },
  announcementTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  announcementBody: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', lineHeight: 17 },
  announcementSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', lineHeight: 15 },
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabIconBg: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    marginTop: -28,
  },
  centerBtnRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  centerBtnRingActive: {
    borderColor: '#F4C430',
    shadowColor: '#F4C430',
    shadowOpacity: 0.35,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnActive: {
    backgroundColor: '#171717',
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 5,
  },
  centerLabelActive: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },

  // Child Profile Modal
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  profileCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
  profileScroll: { padding: 16, paddingBottom: 40 },

  profileHero: {
    backgroundColor: '#1A1B1C',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#9A9A9A',
    marginBottom: 10,
  },
  profileBadgeRow: { flexDirection: 'row', gap: 8 },
  profileBadge: {
    backgroundColor: 'rgba(244,196,48,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.3)',
  },
  profileBadgeText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#F4C430' },
  profileBadgeDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileBadgeDarkText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#9A9A9A' },

  profileStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  profileStatCell: { flex: 1, alignItems: 'center', gap: 2 },
  profileStatVal: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  profileStatLabel: { fontSize: 9, fontFamily: FontFamily.bold, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileStatDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileCardTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' },
  profileGridRow: { flexDirection: 'row', gap: 12 },
  profileGridCell: { flex: 1, gap: 4 },
  profileInfoLabel: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.3 },
  profileInfoVal: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
});
