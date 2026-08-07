import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface StudentHomeHeaderProps {
  fullName: string;
  profilePic?: string;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

export const StudentHomeHeader: React.FC<StudentHomeHeaderProps> = ({
  fullName,
  profilePic,
  onNotificationsPress,
  onProfilePress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="menu" size={22} color="#1A202C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress}>
          <Feather name="bell" size={22} color="#1A202C" />
          <View style={styles.dotBadge} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={36} color="#7E57C2" />
            </View>
          )}
        </View>

        <View style={styles.greetingTextWrap}>
          <Text style={styles.welcomeLabel}>Welcome,</Text>
          <View style={styles.nameRow}>
            <Text style={styles.userNameText}>{fullName}</Text>
            <Text style={styles.waveHand}>👋</Text>
          </View>
          <Text style={styles.timeGreeting}>Good Morning!</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color="#A0AEC0" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7E57C2',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: { flex: 1 },
  welcomeLabel: { fontSize: 13, color: '#718096' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userNameText: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  waveHand: { fontSize: 18 },
  timeGreeting: { fontSize: 12, color: '#A0AEC0', marginTop: 1 },
});
