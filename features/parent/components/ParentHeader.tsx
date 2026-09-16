import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/useUserStore';
import { BorderRadius } from '../../../constants/theme';

interface Props {
  childName?: string;
  childClass?: string;
}

export const ParentHeader: React.FC<Props> = ({ childName = 'Rohan Verma', childClass = 'Class 10-A' }) => {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Parent';
  const institutionName = useUserStore((state) => state.institutionName) || 'DPS International';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.schoolInfo}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="shield-account-outline" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.schoolName}>{institutionName}</Text>
            <Text style={styles.parentGreeting}>Welcome, {fullName}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#1E293B" />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(parent)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.profileInitial}>{fullName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Child Selector & Info Banner */}
      <View style={styles.childBanner}>
        <View style={styles.childIconCircle}>
          <MaterialCommunityIcons name="account-school" size={22} color="#4F46E5" />
        </View>
        <View style={styles.childDetails}>
          <View style={styles.childHeaderRow}>
            <Text style={styles.childName}>{childName}</Text>
            <View style={styles.classTag}>
              <Text style={styles.classTagText}>{childClass}</Text>
            </View>
          </View>
          <Text style={styles.childSub}>Roll #14 • Adm #SCH-2024-1082</Text>
        </View>
        <TouchableOpacity style={styles.switchChildBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="swap-horizontal" size={16} color="#4F46E5" />
          <Text style={styles.switchChildText}>Active</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  parentGreeting: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  childBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.card,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  childIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childDetails: {
    flex: 1,
  },
  childHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  childName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  classTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  classTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  childSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  switchChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  switchChildText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
