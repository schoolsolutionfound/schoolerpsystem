import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/useUserStore';
import { usePlacementStore } from '../store/usePlacementStore';

export const PlacementHeader: React.FC = () => {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Training & Placement Officer';
  const institutionName = useUserStore((state) => state.institutionName) || 'Corporate Career Hub';
  const placementRate = usePlacementStore((s) => s.getPlacementRatePercentage());
  const activeDrives = usePlacementStore((s) => s.getActiveDrivesCount());

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="briefcase-check" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.institutionText}>{institutionName}</Text>
            <Text style={styles.tpoGreeting}>Welcome, {fullName}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* Live Placement Success Rate Pill */}
          <View style={styles.rateBadge}>
            <View style={styles.livePulse} />
            <Text style={styles.rateText}>{placementRate}% Placed</Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tpoGreeting: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  rateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
