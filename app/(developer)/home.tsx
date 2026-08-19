import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { DeveloperDashboardContent } from '../../features/developer/components/DeveloperDashboardContent';
import { InstitutionListScreen } from '../../features/developer/screens/InstitutionListScreen';
import { DeveloperAdminsContent } from '../../features/developer/components/DeveloperAdminsContent';
import { DeveloperPlansContent } from '../../features/developer/components/DeveloperPlansContent';
import { DeveloperProfileContent } from '../../features/developer/components/DeveloperProfileContent';

type DevTab = 'home' | 'institutions' | 'admins' | 'plans' | 'profile';

const TABS: { key: DevTab; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'institutions', label: 'Institutions', icon: 'domain' },
  { key: 'admins', label: 'Admins', icon: 'account-group-outline' },
  { key: 'plans', label: 'Plans', icon: 'card-bulleted-outline' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline' },
];

export default function DeveloperHomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DevTab>('home');
  const fullName = useUserStore((state) => state.fullName) || 'Super Admin';
  const email = useUserStore((state) => state.email) || '';
  const resetUser = useUserStore((state) => state.resetUser);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of Developer Panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1 }}>
          {activeTab === 'home' && <DeveloperDashboardContent />}
          {activeTab === 'institutions' && <InstitutionListScreen />}
          {activeTab === 'admins' && <DeveloperAdminsContent />}
          {activeTab === 'plans' && <DeveloperPlansContent />}
          {activeTab === 'profile' && (
            <DeveloperProfileContent
              fullName={fullName}
              email={email}
              onChangePassword={() => router.push('/change-password')}
              onLogout={handleLogout}
            />
          )}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={22}
                  color={isActive ? '#7E57C2' : '#94A3B8'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 3 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '700' },
});
