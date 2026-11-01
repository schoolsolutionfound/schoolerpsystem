import React from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { PrincipalTab } from '../types/principal.types';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

interface PrincipalDrawerProps {
  visible: boolean;
  activeTab: PrincipalTab;
  onClose: () => void;
  onNavigate: (tab: PrincipalTab) => void;
  onLogout: () => void;
}

const MAIN_NAV: { key: PrincipalTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
  { key: 'fees', label: 'Fee Ledger', icon: 'cash-multiple' },
  { key: 'notices', label: 'Announcements', icon: 'bullhorn-outline' },
  { key: 'homerooms', label: 'Students', icon: 'account-group-outline' },
  { key: 'timetable', label: 'Timetable', icon: 'calendar-edit' },
  { key: 'staff', label: 'Faculty', icon: 'account-group-outline' },
  { key: 'events', label: 'Events & Calendar', icon: 'calendar-multiselect' },
  { key: 'leaves', label: 'Leave Approvals', icon: 'account-clock-outline' },
  { key: 'document_requests', label: 'Document Desk', icon: 'file-certificate-outline' },
  { key: 'reviews', label: 'Student Reviews', icon: 'clipboard-text-outline' },
];

const TEACHING_NAV: { key: PrincipalTab; label: string; icon: string }[] = [
  { key: 'schedule', label: 'My Schedule', icon: 'calendar-clock' },
  { key: 'mark_attendance', label: 'Mark Attendance', icon: 'clipboard-check-outline' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline' },
  { key: 'homework', label: 'Homework', icon: 'book-plus-outline' },
];

export const PrincipalDrawer: React.FC<PrincipalDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const router = useRouter();
  const hasModuleAccess = useUserStore((state) => state.hasModuleAccess);

  const sections: UnifiedDrawerSection[] = [
    {
      key: 'main',
      label: 'MAIN',
      items: MAIN_NAV
        .filter((item) => hasModuleAccess(item.key))
        .map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          onPress: () => onNavigate(item.key),
        })),
    },
    {
      key: 'operations',
      label: 'OPERATIONS',
      items: TEACHING_NAV
        .filter((item) => hasModuleAccess(item.key))
        .map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          onPress: () => onNavigate(item.key),
        })),
    },
    {
      key: 'account',
      label: 'ACCOUNT',
      items: [
        {
          key: 'profile',
          label: 'Profile & Account',
          icon: 'account-outline',
          onPress: () => onNavigate('profile'),
        },
        {
          key: 'notifications',
          label: 'Notifications',
          icon: 'bell-outline',
          onPress: () => router.push('/notifications'),
        },
      ],
    },
  ];

  return (
    <UnifiedDrawer
      visible={visible}
      onClose={onClose}
      sections={sections}
      onLogout={onLogout}
    />
  );
};
