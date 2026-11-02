import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  BusStop,
  BusVehicle,
  TransportDriver,
  addTransportStopApi,
  createTransportRouteApi,
  deleteTransportStopApi,
  updateTransportRouteApi,
} from '../../../api/transport';
import { FontFamily } from '../../../constants/fonts';
import { LocationPickerMap } from '../maps/LocationPickerMap';

interface BusDetailViewProps {
  vehicle: BusVehicle;
  route: AdminBusRoute | null;
  drivers: TransportDriver[];
  onBack: () => void;
  onChanged: () => Promise<void> | void;
  onOpenRouteEditor: (routeId: string) => void;
}

const parseCoordinate = (value: string): number | null => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const BusDetailView: React.FC<BusDetailViewProps> = ({
  vehicle,
  route,
  drivers,
  onBack,
  onChanged,
  onOpenRouteEditor,
}) => {
  const [routeName, setRouteName] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingDriver, setSavingDriver] = useState<string | null>(null);

  const [stopName, setStopName] = useState('');
  const [stopLat, setStopLat] = useState('');
  const [stopLng, setStopLng] = useState('');
  const [savingStop, setSavingStop] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setRouteName(route?.name || `${vehicle.registrationNo} Route`);
    setStopName('');
    setStopLat('');
    setStopLng('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.id, vehicle.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCreateRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert('Route name required', 'Enter a name for the route.');
      return;
    }
    setCreating(true);
    try {
      await createTransportRouteApi({ name: routeName.trim(), vehicleId: vehicle.id });
      await onChanged();
    } catch (err: any) {
      Alert.alert('Could not create route', err?.message || 'Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignDriver = async (driverId: string | null) => {
    if (!route) return;
    setSavingDriver(driverId || 'none');
    try {
      await updateTransportRouteApi(route.id, { driverId });
      await onChanged();
    } catch (err: any) {
      Alert.alert('Could not assign driver', err?.message || 'Try again.');
    } finally {
      setSavingDriver(null);
    }
  };

  const handleMapPick = (coordinate: { latitude: number; longitude: number }) => {
    setStopLat(coordinate.latitude.toFixed(6));
    setStopLng(coordinate.longitude.toFixed(6));
    setStopName((prev) => prev || `Stop ${(route?.stops.length || 0) + 1}`);
  };

  const handleAddStop = async () => {
    if (!route) return;
    const name = stopName.trim();
    const latitude = parseCoordinate(stopLat);
    const longitude = parseCoordinate(stopLng);
    if (!name) {
      Alert.alert('Stop name required', 'Enter a name for this stop.');
      return;
    }
    if (
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      Alert.alert('Location required', 'Tap the map or enter valid latitude and longitude.');
      return;
    }
    setSavingStop(true);
    try {
      await addTransportStopApi(route.id, {
        name,
        latitude,
        longitude,
      });
      setStopName('');
      setStopLat('');
      setStopLng('');
      await onChanged();
    } catch (err: any) {
      Alert.alert('Stop not saved', err?.message || 'Try again.');
    } finally {
      setSavingStop(false);
    }
  };

  const handleDeleteStop = (stop: BusStop) => {
    Alert.alert('Delete stop', `Remove "${stop.name}" from this route?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransportStopApi(stop.id);
            await onChanged();
          } catch (err: any) {
            Alert.alert('Could not delete stop', err?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  const pendingLat = parseCoordinate(stopLat);
  const pendingLng = parseCoordinate(stopLng);
  const pendingPoint =
    pendingLat !== null && pendingLng !== null
      ? { latitude: pendingLat, longitude: pendingLng }
      : null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#1A1B1C" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{vehicle.registrationNo}</Text>
          <Text style={styles.headerSub}>
            Capacity {vehicle.capacity} · {vehicle.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bus details</Text>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="bus" size={18} color="#1A1B1C" />
            <Text style={styles.detailText}>Bus number: {vehicle.registrationNo}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="seat" size={18} color="#1A1B1C" />
            <Text style={styles.detailText}>Capacity: {vehicle.capacity}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="steering" size={18} color="#1A1B1C" />
            <Text style={styles.detailText}>
              Driver: {route?.driver?.fullName || 'Not linked'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="routes" size={18} color="#1A1B1C" />
            <Text style={styles.detailText}>Route: {route?.name || 'Not added'}</Text>
          </View>
        </View>

        {!route ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add route</Text>
            <Text style={styles.sectionHint}>
              Name the route, then place the stops on the map. Each stop saves its latitude and
              longitude.
            </Text>
            <Text style={styles.label}>Route name</Text>
            <TextInput
              style={styles.input}
              value={routeName}
              onChangeText={setRouteName}
              placeholder={`e.g. ${vehicle.registrationNo} Morning Route`}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateRoute} disabled={creating}>
              {creating ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Text style={styles.primaryBtnText}>Create route for this bus</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Driver for this route</Text>
              <View style={styles.chipWrap}>
                <TouchableOpacity
                  style={[styles.chip, !route.driverId && styles.chipActive]}
                  onPress={() => handleAssignDriver(null)}
                  disabled={savingDriver !== null}
                >
                  <Text style={[styles.chipText, !route.driverId && styles.chipTextActive]}>
                    Not linked
                  </Text>
                </TouchableOpacity>
                {drivers.map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    style={[styles.chip, route.driverId === driver.id && styles.chipActive]}
                    onPress={() => handleAssignDriver(driver.id)}
                    disabled={savingDriver !== null}
                  >
                    <Text
                      style={[styles.chipText, route.driverId === driver.id && styles.chipTextActive]}
                    >
                      {driver.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {drivers.length === 0 && (
                <Text style={styles.hintText}>
                  No driver accounts yet. Create a Driver user in Admin → Users.
                </Text>
              )}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => onOpenRouteEditor(route.id)}
              >
                <MaterialCommunityIcons name="account-group-outline" size={16} color="#B45309" />
                <Text style={styles.secondaryBtnText}>Students & route editor</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route map & stops</Text>
              <Text style={styles.sectionHint}>
                Search a place or tap the map, then drag the red pin to set the exact stop location.
              </Text>
              <LocationPickerMap
                stops={route.stops}
                onPick={handleMapPick}
                height={250}
                pendingPoint={pendingPoint}
                searchEnabled
              />

              <View style={styles.coordRow}>
                <View style={styles.coordField}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={stopLat}
                    onChangeText={setStopLat}
                    keyboardType="numbers-and-punctuation"
                    placeholder="12.971600"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.coordField}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={stopLng}
                    onChangeText={setStopLng}
                    keyboardType="numbers-and-punctuation"
                    placeholder="77.594600"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <Text style={styles.label}>Stop name</Text>
              <TextInput
                style={styles.input}
                value={stopName}
                onChangeText={setStopName}
                placeholder="e.g. Green Park Gate"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.secondaryBtn, savingStop && styles.disabledBtn]}
                onPress={handleAddStop}
                disabled={savingStop}
              >
                {savingStop ? (
                  <ActivityIndicator size="small" color="#1A1B1C" />
                ) : (
                  <Text style={styles.secondaryBtnText}>Add stop</Text>
                )}
              </TouchableOpacity>

              {route.stops.length === 0 ? (
                <Text style={styles.emptyText}>No stops yet. Tap the map or enter coordinates.</Text>
              ) : (
                route.stops.map((stop) => (
                  <View key={stop.id} style={styles.stopRow}>
                    <View style={styles.stopBadge}>
                      <Text style={styles.stopBadgeText}>{stop.sequence}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      <Text style={styles.stopCoords}>
                        {Number(stop.latitude).toFixed(5)}, {Number(stop.longitude).toFixed(5)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteStop(stop)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: FontFamily.bold, color: '#171717' },
  headerSub: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B7280', marginTop: 2 },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  sectionHint: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', lineHeight: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  detailText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#374151' },
  label: {
    fontSize: 11,
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
  primaryBtn: {
    marginTop: 6,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  primaryBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  secondaryBtn: {
    marginTop: 6,
    height: 38,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#B45309' },
  disabledBtn: { opacity: 0.45 },
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
  hintText: { fontSize: 11, fontFamily: FontFamily.regular, color: '#9CA3AF', lineHeight: 16 },
  coordRow: { flexDirection: 'row', gap: 10 },
  coordField: { flex: 1 },
  emptyText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    paddingVertical: 8,
    textAlign: 'center',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBadgeText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  stopName: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#111827' },
  stopCoords: { fontSize: 10, fontFamily: FontFamily.regular, color: '#9CA3AF', marginTop: 1 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
