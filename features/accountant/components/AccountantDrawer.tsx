import React from 'react';
import { useRouter } from 'expo-router';
import { performLogout } from '../../../utils/logout';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

interface AccountantDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: string) => void;
  fullName: string;
  email: string;
  profilePic?: string;
  institutionName?: string;
}

const PRIMARY = [
  { key: 'overview', label: 'Overview', icon: 'view-dashboard-outline', tab: 'overview' },
  { key: 'fees', label: 'Student Fees', icon: 'school-outline', tab: 'fees' },
  { key: 'dues', label: 'Pending Dues', icon: 'clock-alert-outline', tab: 'dues' },
  { key: 'income', label: 'Income Ledger', icon: 'cash-plus', tab: 'income' },
  { key: 'payments', label: 'Online Payments', icon: 'credit-card-outline', tab: 'payments' },
  { key: 'expenses', label: 'Expenses', icon: 'cash-minus', tab: 'expenses' },
  { key: 'accounts', label: 'Accounts & Tally', icon: 'calculator-variant-outline', tab: 'accounts' },
  { key: 'announcements', label: 'News', icon: 'bullhorn-outline', tab: 'announcements' },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile', icon: 'account-outline', route: '/(accountant)/profile' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', route: '/notifications' },
  { key: 'change-password', label: 'Change Password', icon: 'lock-reset', route: '/change-password' },
];

export const AccountantDrawer: React.FC<AccountantDrawerProps> = ({
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
      key: 'finance',
      label: 'FINANCE',
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
