import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import PlacementHomeScreen from './(placement)/home';
import StudentHomeScreen from './(student)/home';
import TeacherHomeScreen from './(teacher)/home';
import AdminHomeScreen from './(admin)/home';
import PrincipalHomeScreen from './(principal)/home';
import ParentHomeScreen from './(parent)/home';
import DriverHomeScreen from './(driver)/home';
import DeveloperHomeScreen from './(developer)/home';

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
  if (role === 'dev' || role === 'developer') {
    return <DeveloperHomeScreen />;
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1A1B1C" />
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
});
