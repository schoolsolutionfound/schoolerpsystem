import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface AdminHomeHeaderProps {
  fullName: string;
  institutionName: string;
  onNotificationsPress: () => void;
}

export const AdminHomeHeader: React.FC<AdminHomeHeaderProps> = ({
  fullName,
  institutionName,
  onNotificationsPress,
}) => {
  return (
    <View style={styles.headerRow}>
      <View style={styles.userInfo}>
        <View style={styles.adminAvatar}>
          <MaterialCommunityIcons name="shield-crown" size={26} color="#F4C430" />
        </View>
        <View>
          <Text style={styles.greetingText}>Welcome, {fullName} 👋</Text>
          <Text style={styles.schoolNameText}>{institutionName}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress}>
        <Feather name="bell" size={20} color="#171717" />
        <View style={styles.dotBadge} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: { fontSize: 18, fontWeight: '800', color: '#171717' },
  schoolNameText: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  dotBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
