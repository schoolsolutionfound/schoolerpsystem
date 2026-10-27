import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { getHomeRouteForRole, isRouteAllowedForRole } from '../utils/routeGuards';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [checking, setChecking] = useState(true);

  const userRole = useUserStore((state) => state.userRole);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);
  const activeGroup = segments.find((segment) => segment.startsWith('(') && segment.endsWith(')'));

  useEffect(() => {
    if (!isProfileSynced || userRole === 'loading') {
      return;
    }

    const targetRole = role || userRole;

    if (!isRouteAllowedForRole(pathname, targetRole, undefined, activeGroup)) {
      router.replace(getHomeRouteForRole(targetRole) as any);
    } else {
      setChecking(false);
    }
  }, [isProfileSynced, userRole, pathname, role, router, activeGroup]);

  if (checking || !isProfileSynced || userRole === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.loadingText}>Verifying access...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4C430',
  },
});
