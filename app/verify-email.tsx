import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const userRole = useUserStore((s) => s.userRole) || 'student';
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    const timer = setTimeout(() => {
      router.replace(getHomeRouteForRole(userRole) as any);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="email-check-outline" size={48} color="#7E57C2" />
        <Text style={styles.title}>Email Verification Disabled</Text>
        <Text style={styles.subtitle}>Redirecting to dashboard...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  subtitle: { fontSize: 14, color: '#718096' },
});
