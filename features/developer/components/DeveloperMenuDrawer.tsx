import React from 'react';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

interface DeveloperMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
  fullName: string;
  email: string;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'institutions', label: 'Institutions', icon: 'domain' },
  { key: 'admins', label: 'Admins', icon: 'account-group-outline' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline' },
];

export const DeveloperMenuDrawer: React.FC<DeveloperMenuDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const sections: UnifiedDrawerSection[] = [
    {
      key: 'workspace',
      label: 'WORKSPACE',
      items: MENU_ITEMS.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onPress: () => onNavigate(item.key),
      })),
    },
  ];

  return (
    <UnifiedDrawer
      visible={visible}
      onClose={onClose}
      sections={sections}
      onLogout={onLogout}
      version="v1.0 Developer Console"
    />
  );
};
