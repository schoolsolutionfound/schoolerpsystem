import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  TransportStudent,
  assignStudentTransportApi,
  addTransportStopApi,
  deleteTransportRouteApi,
  deleteTransportStopApi,
  removeStudentTransportApi,
  searchTransportStudentsApi,
  updateTransportRouteApi,
  updateTransportStopApi,
} from '../../../api/transport';
import { FontFamily } from '../../../constants/fonts';
import { LocationPickerMap } from '../maps/LocationPickerMap';

interface TransportRouteEditorModalProps {
  visible: boolean;
  route: AdminBusRoute | null;
  vehicles: BusVehicle[];
  drivers: TransportDriver[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onDeleted: () => void;
}

const parseCoordinate = (value: string): number | null => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const TransportRouteEditorModal: React.FC<TransportRouteEditorModalProps> = ({
  visible,
  route,
  vehicles,
  drivers,
  onClose,
  onChanged,
  onDeleted,
}) => {
  const [name, setName] = useState('');
  const [driverId, setDriverId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [stopName, setStopName] = useState('');
  const [stopLat, setStopLat] = useState('');
  const [stopLng, setStopLng] = useState('');
  const [savingStop, setSavingStop] = useState(false);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<TransportStudent[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TransportStudent | null>(null);
  const [assignmentStopId, setAssignmentStopId] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!route) return;
    setName(route.name);
    setDriverId(route.driverId);
    setVehicleId(route.vehicleId);
    setEditingStopId(null);
    setStopName('');
    setStopLat('');
    setStopLng('');
    setAssignOpen(false);
    setSelectedStudent(null);
    setStudentSearch('');
    setAssignmentStopId(route.stops[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.id]);

  useEffect(() => {
    if (assignOpen && route?.id) {
      setAssignmentStopId((prev) => prev || route.stops[0]?.id || null);
    }
  }, [assignOpen, route?.id, route?.stops]);

  useEffect(() => {
    if (!assignOpen) return;
    let cancelled = false;
    setStudentLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchTransportStudentsApi(studentSearch.trim());
        if (!cancelled) setStudentResults(results);
      } catch {
        if (!cancelled) setStudentResults([]);
      } finally {
        if (!cancelled) setStudentLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [assignOpen, studentSearch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const assignedStudentIds = useMemo(
    () => new Set((route?.assignments || []).map((a) => a.studentId)),
    [route?.assignments]
  );

  const refresh = async () => {
    await onChanged();
  };

  const handleSaveDetails = async () => {
    if (!route) return;
    if (!name.trim()) {
      Alert.alert('Route name required', 'Please enter a name for this bus route.');
      return;
    }
    setSaving(true);
    try {
      await updateTransportRouteApi(route.id, {
        name: name.trim(),
        driverId,
        vehicleId,
      });
      await refresh();
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Could not update the route.');
    } finally {
      setSaving(false);
    }
  };

  const submitStop = async (coords?: { latitude: number; longitude: number }) => {
    if (!route) return;
    const latitude = coords ? coords.latitude : parseCoordinate(stopLat);
    const longitude = coords ? coords.longitude : parseCoordinate(stopLng);
    if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      Alert.alert('Invalid coordinates', 'Enter a latitude between -90 and 90 and longitude between -180 and 180.');
      return;
    }

    const sequence = editingStopId
      ? route.stops.find((s) => s.id === editingStopId)?.sequence
      : undefined;
    const finalName = (stopName.trim() || (coords ? `Stop ${route.stops.length + 1}` : '')).trim();
    if (!finalName) {
      Alert.alert('Stop name required', 'Enter a name for this stop.');
      return;
    }

    setSavingStop(true);
    try {
      if (editingStopId) {
        await updateTransportStopApi(editingStopId, {
          name: finalName,
          latitude,
          longitude,
          ...(sequence !== undefined ? { sequence } : {}),
        });
      } else {
        await addTransportStopApi(route.id, {
          name: finalName,
          latitude,
          longitude,
          ...(sequence !== undefined ? { sequence } : {}),
        });
      }
      setEditingStopId(null);
      setStopName('');
      setStopLat('');
      setStopLng('');
      await refresh();
    } catch (err: any) {
      Alert.alert('Stop not saved', err?.message || 'Could not save this stop.');
    } finally {
      setSavingStop(false);
    }
  };

  const handleMapPick = useCallback(
    async (coordinate: { latitude: number; longitude: number }) => {
      if (!route) return;
      if (editingStopId) {
        setStopLat(coordinate.latitude.toFixed(6));
        setStopLng(coordinate.longitude.toFixed(6));
        return;
      }
      setStopLat(coordinate.latitude.toFixed(6));
      setStopLng(coordinate.longitude.toFixed(6));
      setStopName((prev) => prev || `Stop ${route.stops.length + 1}`);
    },
    [editingStopId, route]
  );

  const handleEditStop = (stop: BusStop) => {
    setEditingStopId(stop.id);
    setStopName(stop.name);
    setStopLat(String(stop.latitude));
    setStopLng(String(stop.longitude));
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
            if (editingStopId === stop.id) {
              setEditingStopId(null);
              setStopName('');
              setStopLat('');
              setStopLng('');
            }
            await refresh();
          } catch (err: any) {
            Alert.alert('Could not delete stop', err?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteRoute = () => {
    if (!route) return;
    Alert.alert('Delete route', `Delete "${route.name}" and all of its stops?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransportRouteApi(route.id);
            onDeleted();
          } catch (err: any) {
            Alert.alert('Could not delete route', err?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  const handleAssign = async () => {
    if (!route || !selectedStudent || !assignmentStopId) {
      Alert.alert('Select a student and stop', 'Choose a student and the stop they will use.');
      return;
    }
    try {
      await assignStudentTransportApi({
        studentId: selectedStudent.id,
        routeId: route.id,
        stopId: assignmentStopId,
      });
      setSelectedStudent(null);
      await refresh();
    } catch (err: any) {
      Alert.alert('Could not assign student', err?.message || 'Try again.');
    }
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    Alert.alert('Remove student', 'Remove this student from the bus route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeStudentTransportApi(assignmentId);
            await refresh();
          } catch (err: any) {
            Alert.alert('Could not remove student', err?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  if (!route) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{route.name}</Text>
            <Text style={styles.headerSub}>
              {route.stops.length} stops · {route.assignments.length} students
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route details</Text>
            <Text style={styles.label}>Route name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. North City Morning Route"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Assign driver</Text>
            <View style={styles.chipWrap}>
              <TouchableOpacity
                style={[styles.chip, driverId === null && styles.chipActive]}
                onPress={() => setDriverId(null)}
              >
                <Text style={[styles.chipText, driverId === null && styles.chipTextActive]}>Unassigned</Text>
              </TouchableOpacity>
              {drivers.map((driver) => (
                <TouchableOpacity
                  key={driver.id}
                  style={[styles.chip, driverId === driver.id && styles.chipActive]}
                  onPress={() => setDriverId(driver.id)}
                >
                  <Text style={[styles.chipText, driverId === driver.id && styles.chipTextActive]}>
                    {driver.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {drivers.length === 0 && (
              <Text style={styles.hintText}>
                No driver accounts yet. Create a user with the Driver role in Admin → Users.
              </Text>
            )}

            <Text style={styles.label}>Assign bus</Text>
            <View style={styles.chipWrap}>
              <TouchableOpacity
                style={[styles.chip, vehicleId === null && styles.chipActive]}
                onPress={() => setVehicleId(null)}
              >
                <Text style={[styles.chipText, vehicleId === null && styles.chipTextActive]}>Unassigned</Text>
              </TouchableOpacity>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[styles.chip, vehicleId === vehicle.id && styles.chipActive]}
                  onPress={() => setVehicleId(vehicle.id)}
                >
                  <Text style={[styles.chipText, vehicleId === vehicle.id && styles.chipTextActive]}>
                    {vehicle.registrationNo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveDetails} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Text style={styles.primaryBtnText}>Save route details</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route map & stops</Text>
            <Text style={styles.sectionHint}>
              Tap the map to place a stop. You can fine-tune the location with latitude and longitude.
            </Text>
            <LocationPickerMap stops={route.stops} onPick={handleMapPick} height={250} />

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
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[styles.secondaryBtn, savingStop && styles.disabledBtn]}
                onPress={() => submitStop()}
                disabled={savingStop}
              >
                {savingStop ? (
                  <ActivityIndicator size="small" color="#1A1B1C" />
                ) : (
                  <Text style={styles.secondaryBtnText}>
                    {editingStopId ? 'Save stop changes' : 'Add stop'}
                  </Text>
                )}
              </TouchableOpacity>
              {editingStopId && (
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => {
                    setEditingStopId(null);
                    setStopName('');
                    setStopLat('');
                    setStopLng('');
                  }}
                >
                  <Text style={styles.ghostBtnText}>Cancel edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {route.stops.length === 0 ? (
              <Text style={styles.emptyText}>No stops yet. Tap the map or add coordinates above.</Text>
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
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleEditStop(stop)}>
                    <MaterialCommunityIcons name="pencil-outline" size={16} color="#1A1B1C" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteStop(stop)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Students on this route</Text>
              <TouchableOpacity style={styles.smallAction} onPress={() => setAssignOpen((prev) => !prev)}>
                <MaterialCommunityIcons name={assignOpen ? 'chevron-up' : 'account-plus-outline'} size={16} color="#1A1B1C" />
                <Text style={styles.smallActionText}>{assignOpen ? 'Hide' : 'Assign'}</Text>
              </TouchableOpacity>
            </View>

            {assignOpen && (
              <View style={styles.assignBox}>
                <TextInput
                  style={styles.input}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  placeholder="Search student by name or USN"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Pickup / drop stop</Text>
                <View style={styles.chipWrap}>
                  {route.stops.length === 0 && <Text style={styles.hintText}>Add a stop first.</Text>}
                  {route.stops.map((stop) => (
                    <TouchableOpacity
                      key={stop.id}
                      style={[styles.chip, assignmentStopId === stop.id && styles.chipActive]}
                      onPress={() => setAssignmentStopId(stop.id)}
                    >
                      <Text style={[styles.chipText, assignmentStopId === stop.id && styles.chipTextActive]}>
                        {stop.sequence}. {stop.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {studentLoading ? (
                  <ActivityIndicator size="small" color="#F4C430" style={{ marginVertical: 10 }} />
                ) : (
                  studentResults.map((student) => {
                    const alreadyAssigned = assignedStudentIds.has(student.id);
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <TouchableOpacity
                        key={student.id}
                        style={[styles.studentRow, isSelected && styles.studentRowSelected]}
                        onPress={() => setSelectedStudent(student)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentName}>{student.fullName}</Text>
                          <Text style={styles.studentMeta}>
                            {student.rollNoOrUSN || 'No USN'} {alreadyAssigned ? '· already on this route' : ''}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={18}
                          color={isSelected ? '#B45309' : '#9CA3AF'}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, (!selectedStudent || !assignmentStopId) && styles.disabledBtn]}
                  onPress={handleAssign}
                  disabled={!selectedStudent || !assignmentStopId}
                >
                  <Text style={styles.primaryBtnText}>Assign selected student</Text>
                </TouchableOpacity>
              </View>
            )}

            {route.assignments.length === 0 ? (
              <Text style={styles.emptyText}>No students assigned to this route yet.</Text>
            ) : (
              route.assignments.map((assignment) => {
                const stop = route.stops.find((s) => s.id === assignment.stopId);
                return (
                  <View key={assignment.id} style={styles.assignmentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{assignment.studentName || assignment.studentId}</Text>
                      <Text style={styles.studentMeta}>
                        {assignment.rollNo ? `${assignment.rollNo} · ` : ''}
                        {stop ? `Stop ${stop.sequence}: ${stop.name}` : 'Unknown stop'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleRemoveAssignment(assignment.id)}
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteRoute}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete this route</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  headerTitle: { fontSize: 17, fontFamily: FontFamily.bold, color: '#171717' },
  headerSub: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B7280', marginTop: 2 },
  closeBtn: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  sectionHint: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', lineHeight: 16 },
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
  disabledBtn: { opacity: 0.45 },
  secondaryBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#B45309' },
  ghostBtn: { height: 38, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B7280' },
  inlineActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordRow: { flexDirection: 'row', gap: 10 },
  coordField: { flex: 1 },
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
  emptyText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    paddingVertical: 8,
    textAlign: 'center',
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  smallActionText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#B45309' },
  assignBox: {
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  studentRowSelected: { backgroundColor: '#FFF4C7' },
  studentName: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#111827' },
  studentMeta: { fontSize: 10, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 1 },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#DC2626' },
});
