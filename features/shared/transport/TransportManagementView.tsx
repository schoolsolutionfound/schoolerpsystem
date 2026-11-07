import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  AdminBusRoute,
  BusVehicle,
  TransportOverview,
  createTransportVehicleApi,
  getTransportOverviewApi,
} from '../../../api/transport';
import { FontFamily } from '../../../constants/fonts';
import { ShimmerSkeleton, ShimmerProvider } from '../../student/components/ShimmerSkeleton';
import { BorderRadius } from '../../../constants/theme';
import { BusDetailView } from './BusDetailView';
import { TransportRouteEditorModal } from './TransportRouteEditorModal';

interface TransportManagementViewProps {
  roleLabel?: string;
}

export const TransportManagementView: React.FC<TransportManagementViewProps> = ({
  roleLabel = 'Transport manager',
}) => {
  const [overview, setOverview] = useState<TransportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [busVisible, setBusVisible] = useState(false);
  const [busRegNo, setBusRegNo] = useState('');
  const [busCapacity, setBusCapacity] = useState('');
  const [savingBus, setSavingBus] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTransportOverviewApi();
      setOverview(data);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not load transport data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const selectedRoute: AdminBusRoute | null =
    overview?.routes.find((route) => route.id === selectedRouteId) || null;

  const selectedVehicle: BusVehicle | null =
    overview?.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null;

  const assignedRouteForBus = (vehicleId: string) =>
    overview?.routes.find((route) => route.vehicleId === vehicleId) || null;

  const totalAssigned =
    overview?.routes.reduce((sum, route) => sum + route.assignments.length, 0) || 0;

  const handleCreateBus = async () => {
    if (!busRegNo.trim()) {
      Alert.alert('Bus number required', 'Enter the bus registration number.');
      return;
    }
    const capacity = Number(busCapacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      Alert.alert('Capacity required', 'Enter a valid passenger capacity.');
      return;
    }
    setSavingBus(true);
    try {
      await createTransportVehicleApi({
        registrationNo: busRegNo.trim(),
        capacity: Math.round(capacity),
      });
      setBusVisible(false);
      setBusRegNo('');
      setBusCapacity('');
      await load();
    } catch (err: any) {
      Alert.alert('Could not add bus', err?.message || 'Try again.');
    } finally {
      setSavingBus(false);
    }
  };

  if (loading) {
    return (
      <ShimmerProvider>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonHero}>
            <ShimmerSkeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <ShimmerSkeleton width="55%" height={16} borderRadius={4} />
              <ShimmerSkeleton width="80%" height={11} borderRadius={3} />
              <ShimmerSkeleton width="40%" height={10} borderRadius={3} />
            </View>
          </View>

          <View style={styles.skeletonStatRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonStatCard}>
                <ShimmerSkeleton width={36} height={24} borderRadius={4} />
                <ShimmerSkeleton width="60%" height={9} borderRadius={3} />
              </View>
            ))}
          </View>

          <ShimmerSkeleton width="35%" height={13} borderRadius={4} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <ShimmerSkeleton width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, gap: 6 }}>
                <ShimmerSkeleton width="50%" height={13} borderRadius={4} />
                <ShimmerSkeleton width="70%" height={10} borderRadius={3} />
                <ShimmerSkeleton width="35%" height={9} borderRadius={3} />
              </View>
              <ShimmerSkeleton width={52} height={26} borderRadius={BorderRadius.chip} />
            </View>
          ))}
        </View>
      </ShimmerProvider>
    );
  }

  if (selectedVehicle) {
    return (
      <BusDetailView
        vehicle={selectedVehicle}
        route={assignedRouteForBus(selectedVehicle.id)}
        drivers={overview?.drivers || []}
        onBack={() => setSelectedVehicleId(null)}
        onChanged={load}
        onOpenRouteEditor={(routeId) => {
          setSelectedVehicleId(null);
          setSelectedRouteId(routeId);
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" colors={['#000000']} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="bus-school" size={26} color="#1A1B1C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Transport &amp; Live Bus</Text>
            <Text style={styles.heroSub}>
              Build routes on the map, assign a driver and bus, then students and parents see the live bus.
            </Text>
            <Text style={styles.heroRole}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.routes.length || 0}</Text>
            <Text style={styles.statLabel}>Routes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.vehicles.length || 0}</Text>
            <Text style={styles.statLabel}>Buses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.drivers.length || 0}</Text>
            <Text style={styles.statLabel}>Drivers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalAssigned}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setBusVisible(true)}>
            <MaterialCommunityIcons name="plus" size={18} color="#171717" />
            <Text style={styles.primaryBtnText}>Add bus</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Buses</Text>
        {!overview || overview.vehicles.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="bus" size={30} color="#D1D5DB" />
            <Text style={styles.emptyText}>No buses added yet. Tap “Add bus” above to create one.</Text>
          </View>
        ) : (
          overview.vehicles.map((vehicle) => {
            const assignedRoute = assignedRouteForBus(vehicle.id);
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.busRow}
                onPress={() => setSelectedVehicleId(vehicle.id)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="bus" size={18} color="#1A1B1C" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.busReg}>{vehicle.registrationNo}</Text>
                  <Text style={styles.busMeta}>
                    Capacity {vehicle.capacity} · {assignedRoute ? assignedRoute.name : 'No route assigned'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    vehicle.status === 'active' ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <Text style={styles.statusText}>{vehicle.status}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })
        )}

        {overview && overview.drivers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Driver accounts</Text>
            <View style={styles.driverWrap}>
              {overview.drivers.map((driver) => {
                const assignedRoute = overview.routes.find((r) => r.driverId === driver.id);
                return (
                  <View key={driver.id} style={styles.driverChip}>
                    <MaterialCommunityIcons name="steering" size={14} color="#1A1B1C" />
                    <View>
                      <Text style={styles.driverName}>{driver.fullName}</Text>
                      <Text style={styles.driverMeta}>
                        {assignedRoute ? assignedRoute.name : 'Not assigned'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <TransportRouteEditorModal
        visible={!!selectedRoute}
        route={selectedRoute}
        vehicles={overview?.vehicles || []}
        drivers={overview?.drivers || []}
        onClose={() => setSelectedRouteId(null)}
        onChanged={load}
        onDeleted={() => {
          setSelectedRouteId(null);
          load();
        }}
      />

      <Modal visible={busVisible} transparent animationType="fade" onRequestClose={() => setBusVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a bus</Text>
            <Text style={styles.label}>Registration number</Text>
            <TextInput
              style={styles.input}
              value={busRegNo}
              onChangeText={setBusRegNo}
              placeholder="e.g. KA-01-AB-1234"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
            <Text style={styles.label}>Seat capacity</Text>
            <TextInput
              style={styles.input}
              value={busCapacity}
              onChangeText={setBusCapacity}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setBusVisible(false)}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateBus} disabled={savingBus}>
                <Text style={styles.primaryBtnText}>{savingBus ? 'Adding...' : 'Add bus'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  skeletonContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  skeletonHero: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    alignItems: 'center',
  },
  skeletonStatRow: { flexDirection: 'row', gap: 8 },
  skeletonStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },

  hero: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#171717' },
  heroSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', lineHeight: 16, marginTop: 2 },
  heroRole: { fontSize: 10, fontFamily: FontFamily.bold, color: '#B45309', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },

  statRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontFamily: FontFamily.bold, color: '#171717' },
  statLabel: { fontSize: 9, fontFamily: FontFamily.semibold, color: '#6B7280', textTransform: 'uppercase', marginTop: 2 },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 11, fontFamily: FontFamily.medium, color: '#B91C1C' },

  actionRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  primaryBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' },

  sectionTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717', marginTop: 4 },

  emptyCard: {
    alignItems: 'center',
    gap: 6,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  emptyTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#374151' },
  emptyText: { fontSize: 11, fontFamily: FontFamily.regular, color: '#9CA3AF', textAlign: 'center', lineHeight: 16 },

  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  routeTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeName: { fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' },
  routeMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },
  routeBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 9, fontFamily: FontFamily.semibold, color: '#4B5563' },
  badgeWarning: { backgroundColor: '#FEF3C7' },
  badgeWarningText: { color: '#B45309' },

  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  busReg: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  busMeta: { fontSize: 10, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 1 },
  routePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
  routePickActive: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  routePickName: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  routePickMeta: { fontSize: 10, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInactive: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 9, fontFamily: FontFamily.bold, color: '#374151', textTransform: 'capitalize' },

  driverWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  driverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    minWidth: '47%',
  },
  driverName: { fontSize: 11, fontFamily: FontFamily.bold, color: '#171717' },
  driverMeta: { fontSize: 9, fontFamily: FontFamily.regular, color: '#6B7280' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  modalTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#171717', marginBottom: 2 },
  label: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: { backgroundColor: '#F4C430', borderColor: '#EAB308' },
  chipText: { fontSize: 11, fontFamily: FontFamily.medium, color: '#4B5563' },
  chipTextActive: { color: '#171717', fontFamily: FontFamily.bold },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8 },
  ghostBtn: { height: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280' },
});
