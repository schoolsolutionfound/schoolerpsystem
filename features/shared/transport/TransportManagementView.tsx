import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  TransportOverview,
  createTransportRouteApi,
  createTransportVehicleApi,
  getTransportOverviewApi,
} from '../../../api/transport';
import { FontFamily } from '../../../constants/fonts';
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

  const [createVisible, setCreateVisible] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newDriverId, setNewDriverId] = useState<string | null>(null);
  const [newVehicleId, setNewVehicleId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [busVisible, setBusVisible] = useState(false);
  const [busRegNo, setBusRegNo] = useState('');
  const [busCapacity, setBusCapacity] = useState('30');
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

  const totalAssigned =
    overview?.routes.reduce((sum, route) => sum + route.assignments.length, 0) || 0;

  const handleCreateRoute = async () => {
    if (!newRouteName.trim()) {
      Alert.alert('Route name required', 'Enter a name for the new route.');
      return;
    }
    setCreating(true);
    try {
      const created: any = await createTransportRouteApi({
        name: newRouteName.trim(),
        driverId: newDriverId,
        vehicleId: newVehicleId,
      });
      setCreateVisible(false);
      setNewRouteName('');
      setNewDriverId(null);
      setNewVehicleId(null);
      await load();
      if (created?.id) setSelectedRouteId(created.id);
    } catch (err: any) {
      Alert.alert('Could not create route', err?.message || 'Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateBus = async () => {
    if (!busRegNo.trim()) {
      Alert.alert('Bus number required', 'Enter the bus registration number.');
      return;
    }
    const capacity = Number(busCapacity);
    setSavingBus(true);
    try {
      await createTransportVehicleApi({
        registrationNo: busRegNo.trim(),
        capacity: Number.isFinite(capacity) && capacity > 0 ? Math.round(capacity) : 30,
      });
      setBusVisible(false);
      setBusRegNo('');
      setBusCapacity('30');
      await load();
    } catch (err: any) {
      Alert.alert('Could not add bus', err?.message || 'Try again.');
    } finally {
      setSavingBus(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.loadingText}>Loading transport routes...</Text>
      </View>
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setCreateVisible(true)}>
            <MaterialCommunityIcons name="plus" size={18} color="#171717" />
            <Text style={styles.primaryBtnText}>New route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setBusVisible(true)}>
            <MaterialCommunityIcons name="bus-multiple" size={18} color="#1A1B1C" />
            <Text style={styles.secondaryBtnText}>Add bus</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Bus routes</Text>
        {!overview || overview.routes.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="map-marker-path" size={34} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No routes yet</Text>
            <Text style={styles.emptyText}>
              Create a route, drop stops on the map, and assign the driver and bus.
            </Text>
          </View>
        ) : (
          overview.routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => setSelectedRouteId(route.id)}
              activeOpacity={0.85}
            >
              <View style={styles.routeTopRow}>
                <View style={styles.routeIcon}>
                  <MaterialCommunityIcons name="routes" size={18} color="#1A1B1C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeMeta}>
                    {route.driver?.fullName || 'No driver'} · {route.vehicle?.registrationNo || 'No bus'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
              <View style={styles.routeBadges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{route.stops.length} stops</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{route.assignments.length} students</Text>
                </View>
                {route.stops.length === 0 && (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={[styles.badgeText, styles.badgeWarningText]}>Add stops</Text>
                  </View>
                )}
                {!route.driver && (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={[styles.badgeText, styles.badgeWarningText]}>No driver</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionTitle}>Buses</Text>
        {!overview || overview.vehicles.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="bus" size={30} color="#D1D5DB" />
            <Text style={styles.emptyText}>No buses added yet. Add a bus to assign it to a route.</Text>
          </View>
        ) : (
          overview.vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.busRow}>
              <MaterialCommunityIcons name="bus" size={18} color="#1A1B1C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.busReg}>{vehicle.registrationNo}</Text>
                <Text style={styles.busMeta}>Capacity {vehicle.capacity}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  vehicle.status === 'active' ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>{vehicle.status}</Text>
              </View>
            </View>
          ))
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

      <Modal visible={createVisible} transparent animationType="fade" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New bus route</Text>
            <Text style={styles.label}>Route name</Text>
            <TextInput
              style={styles.input}
              value={newRouteName}
              onChangeText={setNewRouteName}
              placeholder="e.g. East City Morning Route"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Driver</Text>
            <View style={styles.chipWrap}>
              <TouchableOpacity
                style={[styles.chip, newDriverId === null && styles.chipActive]}
                onPress={() => setNewDriverId(null)}
              >
                <Text style={[styles.chipText, newDriverId === null && styles.chipTextActive]}>Later</Text>
              </TouchableOpacity>
              {(overview?.drivers || []).map((driver) => (
                <TouchableOpacity
                  key={driver.id}
                  style={[styles.chip, newDriverId === driver.id && styles.chipActive]}
                  onPress={() => setNewDriverId(driver.id)}
                >
                  <Text style={[styles.chipText, newDriverId === driver.id && styles.chipTextActive]}>
                    {driver.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Bus</Text>
            <View style={styles.chipWrap}>
              <TouchableOpacity
                style={[styles.chip, newVehicleId === null && styles.chipActive]}
                onPress={() => setNewVehicleId(null)}
              >
                <Text style={[styles.chipText, newVehicleId === null && styles.chipTextActive]}>Later</Text>
              </TouchableOpacity>
              {(overview?.vehicles || []).map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[styles.chip, newVehicleId === vehicle.id && styles.chipActive]}
                  onPress={() => setNewVehicleId(vehicle.id)}
                >
                  <Text style={[styles.chipText, newVehicleId === vehicle.id && styles.chipTextActive]}>
                    {vehicle.registrationNo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setCreateVisible(false)}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateRoute} disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color="#171717" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create route</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                {savingBus ? (
                  <ActivityIndicator size="small" color="#171717" />
                ) : (
                  <Text style={styles.primaryBtnText}>Add bus</Text>
                )}
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B7280' },

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
