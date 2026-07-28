import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface AdminHomeFeedBannerProps {
  onPress: () => void;
}

export const AdminHomeFeedBanner: React.FC<AdminHomeFeedBannerProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.feedBannerCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.bannerIconCircle}>
        <MaterialCommunityIcons name="cloud-upload" size={28} color="#FFFFFF" />
      </View>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>Bulk Feed Students & Teachers</Text>
        <Text style={styles.bannerSub}>Import CSV/Excel records or add single accounts in seconds</Text>
      </View>

      <View style={styles.bannerArrowCircle}>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#7E57C2" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  feedBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.card,
    padding: 16,
    gap: 14,
    elevation: 3,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  bannerSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', marginTop: 2 },
  bannerArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
