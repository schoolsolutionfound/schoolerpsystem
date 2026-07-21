import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon';
}

export default function Logo({ size = 120, variant = 'full' }: LogoProps) {
  const iconSize = size * 0.45;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBg, { width: size, height: size, borderRadius: size * 0.28 }]}
        >
          <MaterialCommunityIcons name="school" size={iconSize} color="#FFFFFF" />
        </LinearGradient>
        <View style={[styles.glow, { width: size * 1.15, height: size * 1.15, borderRadius: size * 0.32 }]} />
      </View>
      {variant === 'full' && (
        <View style={styles.textContainer}>
          <Text style={[styles.name, { fontSize: size * 0.14 }]}>SchoolHub</Text>
          <Text style={[styles.tagline, { fontSize: size * 0.075 }]}>Smart School Management</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBg: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    top: -8,
    left: -8,
    zIndex: -1,
  },
  textContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  name: {
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#8E8EA0',
    marginTop: 4,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});
