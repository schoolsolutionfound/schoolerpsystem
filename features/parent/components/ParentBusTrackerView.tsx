import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface BusStop {
  id: string;
  name: string;
  morningTime: string;
  eveningTime: string;
  status: 'passed' | 'next' | 'upcoming';
  isChildStop?: boolean;
}

const STOPS: BusStop[] = [
  {
    id: 's1',
    name: 'Sector 14 Central Market',
    morningTime: '07:15 AM',
    eveningTime: '04:15 PM',
    status: 'passed',
  },
  {
    id: 's2',
    name: 'Green Park Avenue (Child Stop)',
    morningTime: '07:35 AM',
    eveningTime: '03:55 PM',
    status: 'next',
    isChildStop: true,
  },
  {
    id: 's3',
    name: 'South Extension Flyover',
    morningTime: '07:50 AM',
    eveningTime: '03:40 PM',
    status: 'upcoming',
  },
  {
    id: 's4',
    name: 'DPS International Main Gate',
    morningTime: '08:10 AM',
    eveningTime: '03:20 PM',
    status: 'upcoming',
  },
];

export const ParentBusTrackerView: React.FC = () => {
  const [activeShift, setActiveShift] = useState<'morning' | 'evening'>('morning');

  const handleCallDriver = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Driver', `Contacting Ramesh Kumar at ${phone}`);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Live Route Hero Card */}
      <View style={styles.busHeroCard}>
        <View style={styles.busHeroTop}>
          <View>
            <View style={styles.livePill}>
              <View style={styles.livePulse} />
              <Text style={styles.livePillText}>LIVE GPS TRACKING</Text>
            </View>
            <Text style={styles.routeTitle}>Route #4 • Green Park Line</Text>
          </View>
          <View style={styles.busNumberBadge}>
            <Text style={styles.busNumberText}>DL 01 AB 4421</Text>
          </View>
        </View>

        <View style={styles.busMetricsRow}>
          <View style={styles.busMetric}>
            <Text style={styles.busMetricVal}>38 km/h</Text>
            <Text style={styles.busMetricLabel}>Current Speed</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.busMetric}>
            <Text style={[styles.busMetricVal, { color: '#FCD34D' }]}>6 mins</Text>
            <Text style={styles.busMetricLabel}>ETA to Child Stop</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.busMetric}>
            <Text style={styles.busMetricVal}>On Time</Text>
            <Text style={styles.busMetricLabel}>Schedule Status</Text>
          </View>
        </View>
      </View>

      {/* Driver Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverAvatar}>
          <MaterialCommunityIcons name="steering" size={24} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName}>Ramesh Kumar</Text>
          <Text style={styles.driverRole}>Bus Driver • 8 Yrs Exp • Route #4</Text>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => handleCallDriver('+919876543210')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Shift Selector */}
      <View style={styles.shiftRow}>
        <TouchableOpacity
          style={[styles.shiftBtn, activeShift === 'morning' && styles.shiftBtnActive]}
          onPress={() => setActiveShift('morning')}
        >
          <MaterialCommunityIcons
            name="weather-sunset-up"
            size={18}
            color={activeShift === 'morning' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.shiftBtnText, activeShift === 'morning' && styles.shiftBtnTextActive]}
          >
            Morning Pickup (7:15 AM)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shiftBtn, activeShift === 'evening' && styles.shiftBtnActive]}
          onPress={() => setActiveShift('evening')}
        >
          <MaterialCommunityIcons
            name="weather-sunset-down"
            size={18}
            color={activeShift === 'evening' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.shiftBtnText, activeShift === 'evening' && styles.shiftBtnTextActive]}
          >
            Evening Drop (3:20 PM)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeline Stops */}
      <Text style={styles.sectionTitle}>Route Stops & Schedule</Text>
      <View style={styles.timelineContainer}>
        {STOPS.map((stop, index) => {
          const isNext = stop.status === 'next';
          const isPassed = stop.status === 'passed';
          return (
            <View key={stop.id} style={styles.timelineItem}>
              {/* Timeline Indicator Column */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.stopCircle,
                    isPassed && styles.circlePassed,
                    isNext && styles.circleNext,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isPassed ? 'check' : isNext ? 'bus' : 'circle-medium'}
                    size={isNext ? 16 : 14}
                    color={isPassed ? '#FFFFFF' : isNext ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>
                {index < STOPS.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isPassed && styles.linePassed,
                    ]}
                  />
                )}
              </View>

              {/* Stop Content */}
              <View
                style={[
                  styles.stopCard,
                  stop.isChildStop && styles.childStopHighlight,
                  isNext && styles.nextStopHighlight,
                ]}
              >
                <View style={styles.stopCardTop}>
                  <Text style={[styles.stopName, stop.isChildStop && styles.childStopName]}>
                    {stop.name}
                  </Text>
                  <Text style={styles.stopTime}>
                    {activeShift === 'morning' ? stop.morningTime : stop.eveningTime}
                  </Text>
                </View>

                {stop.isChildStop && (
                  <View style={styles.childStopBadge}>
                    <MaterialCommunityIcons name="account-star" size={14} color="#4F46E5" />
                    <Text style={styles.childStopBadgeText}>Your Child&apos;s Designated Stop</Text>
                  </View>
                )}

                {isNext && (
                  <Text style={styles.arrivingSoonText}>
                    ⚡ Bus arriving in approx. 6 minutes
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  busHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.card,
    padding: 20,
    marginBottom: 16,
  },
  busHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  livePillText: { fontSize: 10, fontWeight: '800', color: '#FCA5A5' },
  routeTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  busNumberBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  busNumberText: { fontSize: 12, fontWeight: '800', color: '#F8FAFC' },
  busMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 12,
  },
  busMetric: { alignItems: 'center', flex: 1 },
  metricDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
  busMetricVal: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  busMetricLabel: { fontSize: 10, color: '#CBD5E1', marginTop: 2 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  driverRole: { fontSize: 12, color: '#64748B', marginTop: 2 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  callBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  shiftRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  shiftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  shiftBtnActive: { backgroundColor: '#4F46E5' },
  shiftBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  shiftBtnTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  timelineContainer: {
    paddingLeft: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  stopCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePassed: { backgroundColor: '#10B981' },
  circleNext: { backgroundColor: '#4F46E5' },
  timelineLine: {
    width: 2,
    height: 48,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  linePassed: { backgroundColor: '#10B981' },
  stopCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  childStopHighlight: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F3FF',
  },
  nextStopHighlight: {
    borderColor: '#818CF8',
    backgroundColor: '#EEF2FF',
  },
  stopCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1 },
  childStopName: { color: '#4338CA', fontWeight: '800' },
  stopTime: { fontSize: 12, fontWeight: '700', color: '#64748B', marginLeft: 8 },
  childStopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  childStopBadgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  arrivingSoonText: { fontSize: 11, fontWeight: '700', color: '#4338CA', marginTop: 6 },
});
