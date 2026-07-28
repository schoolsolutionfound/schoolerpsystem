import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showSubtitle = true }) => {
  const getIconSize = () => {
    switch (size) {
      case 'small': return 28;
      case 'medium': return 38;
      case 'large': return 52;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 22;
      case 'large': return 30;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { width: getIconSize() * 1.6, height: getIconSize() * 1.6, borderRadius: getIconSize() * 0.8 }]}>
        <MaterialCommunityIcons name="school" size={getIconSize()} color="#FFFFFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { fontSize: getFontSize() }]}>
          Campus<Text style={styles.titleHighlight}>Sync</Text>
        </Text>
        {showSubtitle && <Text style={styles.subtitle}>Smart College ERP</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    backgroundColor: '#7E57C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: '#7E57C2',
  },
  subtitle: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
    marginTop: -2,
  },
});
