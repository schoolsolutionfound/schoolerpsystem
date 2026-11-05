import React from 'react';
import { useRouter } from 'expo-router';
import { performLogout } from '../../../utils/logout';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

interface StudentDrawerProps {
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
  { key: 'homework', label: 'Assignment', icon: 'book-plus-outline', tab: 'homework' },
  { key: 'bus', label: 'Bus Tracking', icon: 'bus', tab: 'bus' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline', tab: 'marks' },
  { key: 'fees', label: 'Fee Summary', icon: 'cash', tab: 'fees' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', tab: 'schedule' },
  { key: 'library', label: 'Library', icon: 'book-open-page-variant-outline', tab: 'library' },
  { key: 'feedback-page', label: 'Feedback', icon: 'message-draw', route: '/(student)/feedback' },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile', icon: 'account-outline', route: '/(student)/profile' },
];

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  visible,
  onClose,
  onSwitchTab,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
  const institutionType = useUserStore((s) => s.institutionType);

  const navigate = (route: string) => router.push(route as any);
  const switchTab = (tab: string) => onSwitchTab?.(tab);

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
      items: [
        ...PRIMARY.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          onPress: () => {
            if (item.route) navigate(item.route);
            else if (item.tab) switchTab(item.tab);
          },
        })),
        ...(institutionType === 'college'
          ? [{
              key: 'placement',
              label: 'Placement Cell',
              icon: 'briefcase-outline',
              onPress: () => navigate('/(student)/placement/index'),
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
        onPress: () => navigate(item.route),
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
