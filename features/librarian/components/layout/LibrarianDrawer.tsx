import React from 'react';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../../shared/components/layout/UnifiedDrawer';

interface LibrarianDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch: (tab: string) => void;
  onLogout: () => void;
}

const PRIMARY = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline' },
  { key: 'books', label: 'Book Entry', icon: 'book-open-outline' },
  { key: 'issue', label: 'Issue / Return', icon: 'swap-horizontal' },
  { key: 'pyqs', label: 'Question Papers', icon: 'file-document-multiple-outline' },
  { key: 'fines', label: 'Fine Management', icon: 'cash-multiple' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar' },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile & Account', icon: 'account-outline' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

export const LibrarianDrawer: React.FC<LibrarianDrawerProps> = ({
  visible,
  onClose,
  onTabSwitch,
  onLogout,
}) => {
  const sections: UnifiedDrawerSection[] = [
    {
      key: 'main',
      label: 'MAIN',
      items: PRIMARY.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onTabSwitch(item.key),
      })),
    },
    {
      key: 'account',
      label: 'ACCOUNT',
      items: SECONDARY.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onTabSwitch(item.key),
      })),
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
