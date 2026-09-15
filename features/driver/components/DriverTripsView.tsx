import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

export const DriverTripsView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Hero Block */}
      <View style={styles.heroBlock}>
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="bus" size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Today&apos;s Trip</Text>
            <Text style={styles.heroSub}>{today}</Text>
          </View>
          <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
            <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
              {isActive ? 'LIVE' : 'IDLE'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color="#F4C430" />
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLabel}>Route</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#F4C430" />
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#F4C430" />
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
        </View>
      </View>

      {/* Start/Stop Tracking Button */}
      <TouchableOpacity
        style={[styles.trackBtn, isActive && styles.trackBtnActive]}
        onPress={() => setIsActive(!isActive)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={isActive ? 'bus-alert' : 'bus'}
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.trackBtnText}>
          {isActive ? 'Stop Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      {/* Route Info Placeholder */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#0EA5E9" />
          <Text style={styles.infoTitle}>Route Information</Text>
        </View>
        <Text style={styles.infoSub}>
          {isActive
            ? 'Your live location is being shared with students.'
            : 'Start tracking to share your live location with students on the bus.'}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => Linking.openURL('tel:100')}>
          <MaterialCommunityIcons name="phone-alert" size={24} color="#DC3545" />
          <Text style={styles.actionText}>Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <MaterialCommunityIcons name="map-outline" size={24} color="#0EA5E9" />
          <Text style={styles.actionText}>View Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <MaterialCommunityIcons name="message-alert-outline" size={24} color="#16A34A" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  heroBlock: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 14,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#8A8A8A', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(138, 138, 138, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(138, 138, 138, 0.3)',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  statusText: { fontSize: 10, fontWeight: '800', color: '#8A8A8A', letterSpacing: 0.8 },
  statusTextActive: { color: '#22C55E' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNum: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 16,
  },
  trackBtnActive: {
    backgroundColor: '#DC3545',
  },
  trackBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#171717' },
  infoSub: { fontSize: 12, color: '#6B6B6B', lineHeight: 18 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: '#171717' },
});
