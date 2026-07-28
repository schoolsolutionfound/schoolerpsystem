import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { canManageInstitutions } from '../../features/shared/permissions/permissions';
import { Colors } from '../../constants/theme';

export default function DeveloperGroupLayout() {
  const router = useRouter();
  const userRole = useUserStore((state) => state.userRole);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!canManageInstitutions(userRole) && userRole !== 'loading') {
      router.replace('/auth');
    }
  }, [userRole, _hasHydrated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Colors.light.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="institutions"
        options={{
          title: 'Institutions',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="domain" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admins"
        options={{
          title: 'Admins',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="card-bulleted-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hide stack sub-routes from tab bar */}
      <Tabs.Screen
        name="dashboard/index"
        options={{ href: null }}
      />
    </Tabs>
  );
}
