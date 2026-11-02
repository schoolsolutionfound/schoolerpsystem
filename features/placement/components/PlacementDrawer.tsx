import React from 'react';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

type PlacementTab = 'drives' | 'students' | 'team' | 'results' | 'profile';

interface PlacementDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch?: (tab: PlacementTab) => void;
}

export const PlacementDrawer: React.FC<PlacementDrawerProps> = ({
  visible,
  onClose,
  onTabSwitch,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
  const userRole = useUserStore((s) => s.userRole);
  const placementAccess = useUserStore((s) => s.placementAccess);

  const isHead =
    placementAccess === 'head' ||
    userRole === 'admin' ||
    (userRole as string) === 'placement_officer';

  const menuItems: { key: string; label: string; icon: string; tab: PlacementTab }[] = [
    { key: 'drives', label: 'Placement Drives', icon: 'briefcase-outline', tab: 'drives' },
    { key: 'students', label: 'Students Directory', icon: 'account-group-outline', tab: 'students' },
    { key: 'results', label: 'Placement Results', icon: 'clipboard-list-outline', tab: 'results' },
    ...(isHead
      ? [{ key: 'team', label: 'Placement Team', icon: 'account-multiple-outline', tab: 'team' as const }]
      : []),
    { key: 'profile', label: 'Profile', icon: 'account-circle-outline', tab: 'profile' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    resetUser();
    router.replace('/auth');
  };

  const portalItems: { key: string; label: string; icon: string; onPress: () => void }[] = [];
  if (userRole === 'teacher') {
    portalItems.push({
      key: 'teacher-portal',
      label: 'Teacher Portal',
      icon: 'school-outline',
      onPress: () => router.push('/(teacher)/home'),
    });
  }
  if (userRole === 'admin') {
    portalItems.push({
      key: 'admin-portal',
      label: 'Admin Portal',
      icon: 'shield-account-outline',
      onPress: () => router.push('/(admin)/home'),
    });
  }

  const sections: UnifiedDrawerSection[] = [
    {
      key: 'workspace',
      label: 'WORKSPACE',
      items: menuItems.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onTabSwitch?.(item.tab),
      })),
    },
    {
      key: 'portals',
      label: 'SWITCH PORTAL',
      items: portalItems,
    },
    {
      key: 'account',
      label: 'ACCOUNT',
      items: [
        {
          key: 'notifications',
          label: 'Notifications',
          icon: 'bell-outline',
          onPress: () => router.push('/notifications'),
        },
        {
          key: 'change-password',
          label: 'Change Password',
          icon: 'lock-reset',
          onPress: () => router.push('/change-password'),
        },
      ],
    },
  ];

  return (
    <UnifiedDrawer
      visible={visible}
      onClose={onClose}
      sections={sections}
      onLogout={handleLogout}
    />
  );
};
