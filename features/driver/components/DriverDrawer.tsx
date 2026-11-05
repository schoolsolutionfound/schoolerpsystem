import React from 'react';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

export type DriverTab = 'trips' | 'announcements' | 'profile';

interface DriverDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  profilePic?: string;
  institutionName: string;
  activeTab?: DriverTab;
  onNavigate?: (tab: DriverTab) => void;
  onChangePassword?: () => void;
  onLogout: () => void;
}

const MENU_ITEMS: { key: DriverTab; label: string; icon: string }[] = [
  { key: 'trips', label: 'My Trips', icon: 'bus-clock' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline' },
  { key: 'profile', label: 'My Profile', icon: 'account-outline' },
];

const ACCOUNT_ITEMS = [
  { key: 'change-password', label: 'Change Password', icon: 'lock-reset' },
];

export const DriverDrawer: React.FC<DriverDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
  onChangePassword,
  onLogout,
}) => {
  const sections: UnifiedDrawerSection[] = [
    {
      key: 'main',
      label: 'MAIN',
      items: MENU_ITEMS.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onNavigate?.(item.key),
      })),
    },
    {
      key: 'account',
      label: 'ACCOUNT',
      items: ACCOUNT_ITEMS.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onChangePassword?.(),
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
