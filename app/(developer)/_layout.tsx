import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { canManageInstitutions } from '../../features/shared/permissions/permissions';

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="dashboard/index" />
      <Stack.Screen name="institutions/[id]" />
      <Stack.Screen name="admins/create" />
      <Stack.Screen name="admins/edit/[id]" />
    </Stack>
  );
}
