import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { getHomeRouteForRole, isRouteAllowedForRole } from '../utils/routeGuards';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  const userRole = useUserStore((state) => state.userRole);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);

  useEffect(() => {
    if (!isProfileSynced || userRole === 'loading') {
      return;
    }

    const targetRole = role || userRole;

    if (!isRouteAllowedForRole(pathname, targetRole)) {
      router.replace(getHomeRouteForRole(targetRole) as any);
    } else {
      setChecking(false);
    }
  }, [isProfileSynced, userRole, pathname, role, router]);

  if (checking || !isProfileSynced || userRole === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7E57C2" />
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
    backgroundColor: '#F8F9FB',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E57C2',
  },
});
