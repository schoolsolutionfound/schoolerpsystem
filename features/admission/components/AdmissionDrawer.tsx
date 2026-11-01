import React from 'react';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

type AdmissionTab = 'students' | 'tracking' | 'transport' | 'profile';

interface AdmissionDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch?: (tab: AdmissionTab) => void;
}

export const AdmissionDrawer: React.FC<AdmissionDrawerProps> = ({
  visible,
  onClose,
  onTabSwitch,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
  const userRole = useUserStore((s) => s.userRole);

  const menuItems: { key: string; label: string; icon: string; tab: AdmissionTab }[] = [
    { key: 'students', label: 'Admissions Registry', icon: 'account-group-outline', tab: 'students' },
    { key: 'tracking', label: 'Seat Tracking & Matrix', icon: 'layers-outline', tab: 'tracking' },
    { key: 'transport', label: 'Transport & Bus Routes', icon: 'bus-outline', tab: 'transport' },
    { key: 'profile', label: 'Profile', icon: 'account-circle-outline', tab: 'profile' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    resetUser();
    router.replace('/auth');
  };

  const portalItems = [];
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
