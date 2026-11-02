import React from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { UnifiedDrawer, UnifiedDrawerSection } from '../../shared/components/layout/UnifiedDrawer';

type AdminTab = 'dashboard' | 'institution' | 'students' | 'parents' | 'teachers' | 'users' | 'academics' | 'announcements' | 'payments' | 'transport' | 'settings' | 'profile';

interface AdminDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: AdminTab) => void;
  onLogout: () => void;
  router?: any;
}

const PRIMARY: { key: AdminTab; label: string; icon: string; route?: string; adminOnly?: boolean }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', route: '/(admin)' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline' },
  { key: 'institution', label: 'Institution', icon: 'office-building' },
  { key: 'students', label: 'Students', icon: 'account-school-outline' },
  { key: 'parents', label: 'Parents', icon: 'account-multiple-outline' },
  { key: 'teachers', label: 'Teachers', icon: 'human-male-board' },
  { key: 'users', label: 'Users', icon: 'account-group-outline' },
  { key: 'academics', label: 'Academics', icon: 'school-outline' },
  { key: 'transport', label: 'Transport & Bus', icon: 'bus' },
  { key: 'payments', label: 'Payment Settings', icon: 'credit-card-outline' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline', adminOnly: true },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline' },
];

const SECONDARY = [
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline' },
  { key: 'change-password', label: 'Change Password', icon: 'lock-reset' },
];

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  visible,
  onClose,
  onNavigate,
  onLogout,
  router,
}) => {
  const placementAccess = useUserStore((s) => s.placementAccess);
  const institutionType = useUserStore((s) => s.institutionType);
  const userRole = useUserStore((s) => s.userRole);
  const fallbackRouter = useRouter();
  const localRouter = router || fallbackRouter;
  const menuItems = PRIMARY.filter((item) => !item.adminOnly || userRole === 'admin');

  const selectPrimary = (item: typeof PRIMARY[number]) => {
    if (item.route) localRouter.push(item.route as any);
    else onNavigate(item.key);
  };

  const sections: UnifiedDrawerSection[] = [
    {
      key: 'workspace',
      label: 'WORKSPACE',
      items: [
        ...menuItems.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          onPress: () => selectPrimary(item),
        })),
        ...(institutionType === 'college' && (placementAccess === 'head' || placementAccess === 'member')
          ? [{
              key: 'placement',
              label: 'Placement Admin',
              icon: 'briefcase-outline',
              onPress: () => localRouter.push('/(placement)/drives' as any),
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
        onPress: () => localRouter.push(`/${item.key}` as any),
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
