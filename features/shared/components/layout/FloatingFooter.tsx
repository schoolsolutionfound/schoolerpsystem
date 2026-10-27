import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../../constants/fonts';

export type FloatingFooterIcon = string;
type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface FloatingFooterTab<T extends string = string> {
  key: T;
  label: string;
  icon: FloatingFooterIcon;
  iconFilled?: FloatingFooterIcon;
}

export interface FloatingFooterProps<T extends string = string> {
  tabs: readonly FloatingFooterTab<T>[];
  activeKey: T;
  onTabPress: (key: T) => void;
  centerKey?: T;
  centerIcon?: FloatingFooterIcon;
}

export function FloatingFooter<T extends string>({
  tabs,
  activeKey,
  onTabPress,
  centerKey,
  centerIcon,
}: FloatingFooterProps<T>) {
  return (
    <View style={styles.tabBarBg}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          const isCenter = centerKey === tab.key;

          if (isCenter) {
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.centerBtnWrap}
                onPress={() => onTabPress(tab.key)}
                activeOpacity={0.85}
              >
                <View style={styles.centerBtnOuter}>
                  <MaterialCommunityIcons
                    name={(centerIcon ?? tab.iconFilled ?? tab.icon) as MaterialIconName}
                    size={28}
                    color="#111827"
                  />
                </View>
                <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                <MaterialCommunityIcons
                  name={(isActive ? tab.iconFilled ?? tab.icon : tab.icon) as MaterialIconName}
                  size={22}
                  color={isActive ? '#111827' : '#9CA3AF'}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F2EFE8',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabIconBg: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#FDC836',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  activeIndicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FDC836',
    marginTop: 3,
  },
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    marginTop: -26,
  },
  centerBtnOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDC836',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 4,
  },
  centerLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
});
