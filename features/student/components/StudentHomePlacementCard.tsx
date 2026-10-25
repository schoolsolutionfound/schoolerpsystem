import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listDrives } from '../../../api/placement';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { useUserStore } from '../../../store/useUserStore';

export const StudentHomePlacementCard: React.FC = () => {
  const router = useRouter();
  const institutionType = useUserStore((s) => s.institutionType);
  const [activeCount, setActiveCount] = useState<number | null>(null);

  useEffect(() => {
    // Only load for college students
    if (institutionType !== 'college') return;

    let mounted = true;
    listDrives()
      .then((drives) => {
        if (mounted && Array.isArray(drives)) {
          setActiveCount(drives.length);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [institutionType]);

  // Don't render for schools, only colleges
  if (institutionType !== 'college') return null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push('/(student)/placement/index')}
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="briefcase-outline" size={24} color="#F4C430" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Career & Job Drives</Text>
        <Text style={styles.subText}>
          {activeCount !== null && activeCount > 0
            ? `${activeCount} recruitment drive${activeCount > 1 ? 's' : ''} currently active`
            : 'Explore open campus drives & internships'}
        </Text>
      </View>
      <View style={styles.arrowWrap}>
        <Feather name="arrow-up-right" size={18} color="#F4C430" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  subText: {
    fontSize: 12,
    color: '#A0A0A0',
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
