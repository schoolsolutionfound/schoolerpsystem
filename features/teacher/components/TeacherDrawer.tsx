import React from 'react';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

export type TeacherDrawerTab =
  | 'home'
  | 'schedule'
  | 'attendance'
  | 'marks'
  | 'reports'
  | 'homework'
  | 'library'
  | 'chat'
  | 'locate'
  | 'announcements'
  | 'announcements-manage'
  | 'profile'
  | 'leave'
  | 'settings';

interface TeacherDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch?: (tab: TeacherDrawerTab) => void;
}

interface DrawerMenuItem {
  key: string;
  label: string;
  icon: string;
  tab?: TeacherDrawerTab;
  route?: string;
}

const PRIMARY: DrawerMenuItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', tab: 'home' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline', tab: 'announcements' },
  { key: 'schedule', label: 'My Schedule', icon: 'calendar-outline', tab: 'schedule' },
  { key: 'attendance', label: 'Mark Attendance', icon: 'clipboard-check-outline', tab: 'attendance' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline', tab: 'marks' },
  { key: 'homework', label: 'Homework', icon: 'book-plus-outline', tab: 'homework' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar', tab: 'reports' },
];

const SECONDARY: DrawerMenuItem[] = [
  { key: 'library', label: 'Library', icon: 'book-open-page-variant-outline', tab: 'library' },
  { key: 'leave', label: 'Leave', icon: 'calendar-clock-outline', tab: 'leave' },
  { key: 'profile', label: 'Profile & Account', icon: 'account-outline', tab: 'profile' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline', tab: 'settings' },
];

export const TeacherDrawer: React.FC<TeacherDrawerProps> = ({
  visible,
  onClose,
  onTabSwitch,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
  const placementAccess = useUserStore((s) => s.placementAccess);
  const institutionType = useUserStore((s) => s.institutionType);

  const switchTab = (tab: TeacherDrawerTab) => {
    if (onTabSwitch) {
      onTabSwitch(tab);
      return;
    }
    router.push({ pathname: '/(teacher)/home', params: { tab } } as any);
  };

  const selectItem = (item: DrawerMenuItem) => {
    if (item.route) router.push(item.route as any);
    else switchTab(item.tab ?? 'home');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    resetUser();
    router.replace('/auth');
  };

  const sections: UnifiedDrawerSection[] = [
    {
      key: 'main',
      label: 'MAIN',
      items: [
        ...PRIMARY.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          onPress: () => selectItem(item),
        })),
        ...(institutionType === 'college' && (placementAccess === 'head' || placementAccess === 'member')
          ? [{
              key: 'placement',
              label: 'Placement Cell',
              icon: 'briefcase-outline',
              onPress: () => router.push('/(placement)/home' as any),
            }]
          : []),
      ],
    },
    {
      key: 'account',
      label: 'ACCOUNT',
      items: SECONDARY.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => selectItem(item),
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
