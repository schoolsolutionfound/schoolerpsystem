import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/useUserStore';
import { AppCard } from '../../../features/shared/components/AppCard';
import { AppButton } from '../../../features/shared/components/AppButton';
import { Colors, BorderRadius } from '../../../constants/theme';

export default function DeveloperSettingsScreen() {
  const router = useRouter();
  const resetUser = useUserStore((state) => state.resetUser);
  const fullName = useUserStore((state) => state.fullName) || 'Super Admin';
  const email = useUserStore((state) => state.email) || 'admin@school.com';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of Developer Panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const devSettingsItems = [
    { icon: 'account-outline', label: 'Developer Profile', sub: 'Manage personal info & credentials' },
    { icon: 'account-group-outline', label: 'Team Members', sub: 'Manage developer panel access' },
    { icon: 'bell-outline', label: 'Notifications', sub: 'Manage alerts & email preferences' },
    { icon: 'format-list-bulleted-square', label: 'System Activity Logs', sub: 'View system events & audit trails' },
  ];

  const systemSettingsItems = [
    { icon: 'card-bulleted-outline', label: 'Subscription Plans', sub: 'Manage subscription limits' },
    { icon: 'key-outline', label: 'API Keys', sub: 'Manage API keys & integrations' },
    { icon: 'tune', label: 'System Configuration', sub: 'Configure global system preferences' },
    { icon: 'database-outline', label: 'Backup & Restore', sub: 'Manage data backups & recovery' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>{fullName} ({email})</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Developer Settings */}
        <Text style={styles.sectionTitle}>Developer Settings</Text>
        <AppCard style={styles.groupCard}>
          {devSettingsItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.itemRow} activeOpacity={0.7}>
                <View style={styles.itemIconContainer}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.light.muted} />
              </TouchableOpacity>
              {index < devSettingsItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </AppCard>

        {/* System Settings */}
        <Text style={styles.sectionTitle}>System Settings</Text>
        <AppCard style={styles.groupCard}>
          {systemSettingsItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.itemRow} activeOpacity={0.7}>
                <View style={styles.itemIconContainer}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.light.muted} />
              </TouchableOpacity>
              {index < systemSettingsItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </AppCard>

        {/* Logout */}
        <AppButton
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 8,
  },
  groupCard: {
    padding: 0,
    marginBottom: 16,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemSub: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 56,
  },
  logoutButton: {
    borderColor: Colors.light.danger,
    marginTop: 12,
    marginBottom: 32,
  },
});
