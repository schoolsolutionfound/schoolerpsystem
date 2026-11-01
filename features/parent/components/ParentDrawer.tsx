import React from 'react';
import { useRouter } from 'expo-router';
import { performLogout } from '../../../utils/logout';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

interface ParentDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: string) => void;
  fullName: string;
  email: string;
  profilePic?: string;
  institutionName?: string;
  rollNoOrUSN?: string;
}

const PRIMARY = [
  { key: 'home', label: 'Home', icon: 'home-outline', tab: 'home' },
  { key: 'attendance', label: 'Attendance', icon: 'book-outline', tab: 'attendance' },
  { key: 'homework', label: 'Homework', icon: 'book-plus-outline', tab: 'homework' },
  { key: 'bus', label: 'Bus Tracking', icon: 'bus', tab: 'bus' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline', tab: 'marks' },
  { key: 'fees', label: 'Fee Summary', icon: 'cash', tab: 'fees' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', tab: 'schedule' },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile', icon: 'account-outline', route: '/(parent)/profile' },
];

export const ParentDrawer: React.FC<ParentDrawerProps> = ({
  visible,
  onClose,
  onSwitchTab,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);

  const handleLogout = async () => {
    try {
      await performLogout();
    } catch {}
    resetUser();
    router.replace('/auth');
  };

  const sections: UnifiedDrawerSection[] = [
    {
      key: 'main',
      label: 'MAIN',
      items: PRIMARY.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onSwitchTab?.(item.tab),
      })),
    },
    {
      key: 'account',
      label: 'ACCOUNT',
      items: SECONDARY.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => router.push(item.route as any),
      })),
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
