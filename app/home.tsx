import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import PlacementHomeScreen from './(placement)/home';
import AdmissionHomeScreen from './(admission)/home';
import StudentHomeScreen from './(student)/home';
import TeacherHomeScreen from './(teacher)/home';
import AdminHomeScreen from './(admin)/home';
import PrincipalHomeScreen from './(principal)/home';
import ParentHomeScreen from './(parent)/home';
import DriverHomeScreen from './(driver)/home';
import DeveloperHomeScreen from './(developer)/home';
import AccountantHomeScreen from './(accountant)/home';
import HODHomeScreen from './(hod)/home';
import LibrarianHomeScreen from './(librarian)/home';
import CounselorHomeScreen from './(counselor)/home';

export default function RootHomeScreen() {
  const router = useRouter();
  const userRole = useUserStore((state) => state.userRole);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!userRole || userRole === 'loading') {
      router.replace('/auth');
    }
  }, [_hasHydrated, userRole, router]);

  if (!_hasHydrated || !userRole || userRole === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1B1C" />
      </View>
    );
  }

  const role = userRole.toLowerCase().trim();

  if (role === 'placement_officer') {
    return <PlacementHomeScreen />;
  }
  if (role === 'admission_officer') {
    return <AdmissionHomeScreen />;
  }
  if (role === 'student') {
    return <StudentHomeScreen />;
  }
  if (role === 'teacher') {
    return <TeacherHomeScreen />;
  }
  if (role === 'admin' || role === 'institution admin') {
    return <AdminHomeScreen />;
  }
  if (role === 'principal') {
    return <PrincipalHomeScreen />;
  }
  if (role === 'parent') {
    return <ParentHomeScreen />;
  }
  if (role === 'driver') {
    return <DriverHomeScreen />;
  }
  if (role === 'accountant') {
    return <AccountantHomeScreen />;
  }
  if (role === 'hod') {
    return <HODHomeScreen />;
  }
  if (role === 'librarian') {
    return <LibrarianHomeScreen />;
  }
  if (role === 'counselor') {
    return <CounselorHomeScreen />;
  }
  if (role === 'dev' || role === 'developer') {
    return <DeveloperHomeScreen />;
  }

  return (
    <View style={styles.center}>
      <Text style={styles.fallbackText}>No home screen is configured for your role ({role}).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
  },
  fallbackText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
