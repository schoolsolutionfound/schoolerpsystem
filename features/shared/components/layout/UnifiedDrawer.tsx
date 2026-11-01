import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export interface UnifiedDrawerItem {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
}

export interface UnifiedDrawerSection {
  key: string;
  label: string;
  items: UnifiedDrawerItem[];
}

interface UnifiedDrawerProps {
  visible: boolean;
  onClose: () => void;
  sections: UnifiedDrawerSection[];
  onLogout: () => void;
  version?: string;
}

export const UnifiedDrawer: React.FC<UnifiedDrawerProps> = ({
  visible,
  onClose,
  sections,
  onLogout,
  version = 'v1.0 School ERP',
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [slideX] = useState(() => new Animated.Value(-width));
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';

    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 320,
          useNativeDriver,
        }),
      ]).start();
    } else {
      slideX.setValue(-width);
      fade.setValue(0);
    }
  }, [visible, slideX, fade, width]);

  const requestClose = (afterClose?: () => void) => {
    const useNativeDriver = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -width,
        duration: 320,
        easing: Easing.in(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 260,
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      onClose();
      afterClose?.();
    });
  };

  const handleItemPress = (item: UnifiedDrawerItem) => {
    requestClose(item.onPress);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => requestClose(onLogout),
      },
    ]);
  };

  const visibleSections = sections.filter((section) => section.items.length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => requestClose()}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => requestClose()} />
        </Animated.View>

        <Animated.View style={[styles.drawerWrap, { transform: [{ translateX: slideX }] }]}>
          <SafeAreaView style={styles.drawer} edges={['bottom']}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
              <View style={styles.headerTopRow}>
                <View style={styles.brandRow}>
                  <Image
                    source={require('../../../../assets/logo-transparent.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.brandTitle}>KIVQUO</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => requestClose()} hitSlop={10}>
                  <Feather name="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {visibleSections.map((section, index) => {
                return (
                  <View key={section.key}>
                    <Text style={[styles.sectionLabel, index > 0 && styles.sectionLabelSpaced]}>
                      {section.label}
                    </Text>
                    {section.items.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                        onPress={() => handleItemPress(item)}
                      >
                        <View style={styles.menuIcon}>
                          <MaterialCommunityIcons
                            name={item.icon as any}
                            size={18}
                            color="#9A9A9A"
                          />
                        </View>
                        <Text style={styles.menuText}>{item.label}</Text>
                        <Feather name="chevron-right" size={16} color="#5A5A5A" />
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <MaterialCommunityIcons name="logout" size={18} color="#FBBF24" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.version}>{version}</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawerWrap: {
    width: '82%',
    maxWidth: 360,
  },
  drawer: {
    flex: 1,
    backgroundColor: '#1A1B1C',
    borderRightWidth: 1,
    borderRightColor: '#2A2B2C',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 34, height: 34 },
  brandTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#232425',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { paddingTop: 14, paddingHorizontal: 10, paddingBottom: 20 },
  sectionLabel: {
    fontSize: 10,
    color: '#6A6A6A',
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  sectionLabelSpaced: { marginTop: 18 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 5,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#232425',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E5E5E5' },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FBBF24', letterSpacing: 0.3 },
  version: { fontSize: 10, color: '#5A5A5A', textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },
});
