import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { DropdownSelect } from './DropdownSelect';
import { fetchProfileFieldsApi, saveRoleProfileFieldsApi } from '../../../api/admin';
import {
  PROFILE_FIELD_TYPES,
  CONFIGURABLE_ROLES,
  newFieldId,
  fieldLabelForType,
  type ProfileFormField,
  type ProfileFieldType,
} from '../../shared/formFields/types';

type FieldsMap = Record<string, ProfileFormField[]>;

export const AdminSettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [map, setMap] = useState<FieldsMap>({});
  const [activeRole, setActiveRole] = useState<string>(CONFIGURABLE_ROLES[0].key);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  // Add-field form state
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<ProfileFieldType>('text');
  const [newOptions, setNewOptions] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [newEditable, setNewEditable] = useState(true);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetchProfileFieldsApi();
      setMap(res || {});
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not load the configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

  const persistRole = async (role: string, fields: ProfileFormField[]) => {
    const previous = map;
    setMap({ ...map, [role]: fields });
    setSavingRole(role);
    try {
      const res = await saveRoleProfileFieldsApi(role, fields);
      setMap(res || {});
    } catch (err: any) {
      setMap(previous);
      Alert.alert('Save Failed', err?.message || 'Could not save the field configuration.');
    } finally {
      setSavingRole(null);
    }
  };

  const roleFields = map[activeRole] || [];

  const handleAddField = () => {
    const label = newLabel.trim();
    if (!label) {
      Alert.alert('Field name required', 'Enter a name for the field you want to add.');
      return;
    }
    if (roleFields.some((f) => f.label.toLowerCase() === label.toLowerCase())) {
      Alert.alert('Duplicate field', `A field named "${label}" already exists for this role.`);
      return;
    }

    const options = newOptions
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (newType === 'dropdown' && options.length === 0) {
      Alert.alert('Options required', 'Enter at least one option for the dropdown (comma separated).');
      return;
    }

    const field: ProfileFormField = {
      id: newFieldId(),
      label,
      type: newType,
      required: newRequired,
      editable: newEditable,
      ...(newType === 'dropdown' ? { options } : {}),
    };

    setNewLabel('');
    setNewType('text');
    setNewOptions('');
    setNewRequired(false);
    setNewEditable(true);
    persistRole(activeRole, [...roleFields, field]);
  };

  const handleRemove = (fieldId: string) => {
    const field = roleFields.find((f) => f.id === fieldId);
    Alert.alert('Remove Field', `Remove "${field?.label}" from this role's form?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => persistRole(activeRole, roleFields.filter((f) => f.id !== fieldId)),
      },
    ]);
  };

  const handleToggle = (fieldId: string, key: 'required' | 'editable') => {
    persistRole(
      activeRole,
      roleFields.map((f) => (f.id === fieldId ? { ...f, [key]: !f[key] } : f))
    );
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const next = [...roleFields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persistRole(activeRole, next);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F4C430" />}
    >
      <View style={styles.introCard}>
        <View style={styles.introTextWrap}>
          <Text style={styles.introTitle}>Role Configuration</Text>
          <Text style={styles.introSub}>
            Choose what extra details each role fills in their profile. Name, email, phone and password are
            already collected when the account is created.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CHOOSE ROLE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>
        {CONFIGURABLE_ROLES.map((role) => {
          const isActive = role.key === activeRole;
          const count = (map[role.key] || []).length;
          return (
            <TouchableOpacity
              key={role.key}
              style={[styles.roleChip, isActive && styles.roleChipActive]}
              activeOpacity={0.75}
              onPress={() => setActiveRole(role.key)}
            >
              <MaterialCommunityIcons
                name={role.icon as any}
                size={15}
                color={isActive ? '#1A1B1C' : '#9A9A9A'}
              />
              <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>{role.label}</Text>
              {count > 0 && (
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#F4C430" />
          <Text style={styles.loadingText}>Loading fields…</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Add Field</Text>
              {savingRole === activeRole && <ActivityIndicator size="small" color="#F4C430" />}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Blood Group"
                placeholderTextColor="#9CA3AF"
                value={newLabel}
                onChangeText={setNewLabel}
              />
              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Field Type</Text>
              <DropdownSelect
                value={newType}
                options={PROFILE_FIELD_TYPES.map((t) => ({ key: t.value, label: t.label }))}
                onChange={(v) => setNewType(v as ProfileFieldType)}
                placeholder="Choose type"
                variant="inline"
                menuTitle="Field Type"
                leadingIcon="list-box-outline"
              />
            </View>

            {newType === 'dropdown' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Options (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Red, Blue, Green"
                  placeholderTextColor="#9CA3AF"
                  value={newOptions}
                  onChangeText={setNewOptions}
                />
              </View>
            )}

            <View style={styles.toggleRow}>
              <TouchableOpacity style={styles.tickRow} activeOpacity={0.7} onPress={() => setNewRequired((v) => !v)}>
                <View style={[styles.tickBox, newRequired && styles.tickBoxOn]}>
                  {newRequired && <Feather name="check" size={13} color="#1A1B1C" />}
                </View>
                <Text style={styles.tickLabel}>Required</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tickRow} activeOpacity={0.7} onPress={() => setNewEditable((v) => !v)}>
                <View style={[styles.tickBox, newEditable && styles.tickBoxOn]}>
                  {newEditable && <Feather name="check" size={13} color="#1A1B1C" />}
                </View>
                <Text style={styles.tickLabel}>Editable by user</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAddField}>
              <MaterialCommunityIcons name="plus" size={18} color="#1A1B1C" />
              <Text style={styles.addBtnText}>Add Field</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {CONFIGURABLE_ROLES.find((r) => r.key === activeRole)?.label} Fields
            </Text>
            {roleFields.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="playlist-remove" size={26} color="#C9C4B8" />
                <Text style={styles.emptyText}>No extra fields yet. Add one above.</Text>
              </View>
            ) : (
              roleFields.map((field, index) => (
                <View key={field.id} style={styles.fieldCard}>
                  <View style={styles.fieldCardTop}>
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel} numberOfLines={1}>{field.label}</Text>
                      <Text style={styles.typeText}>{fieldLabelForType(field.type)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.moveBtn}
                      onPress={() => handleMove(index, -1)}
                      disabled={index === 0}
                      hitSlop={6}
                    >
                      <Feather name="chevron-up" size={15} color={index === 0 ? '#D8D4CC' : '#6B6B6B'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.moveBtn}
                      onPress={() => handleMove(index, 1)}
                      disabled={index === roleFields.length - 1}
                      hitSlop={6}
                    >
                      <Feather name="chevron-down" size={15} color={index === roleFields.length - 1 ? '#D8D4CC' : '#6B6B6B'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemove(field.id)} hitSlop={8}>
                      <Feather name="trash-2" size={15} color="#D64545" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldCardToggles}>
                    <TouchableOpacity
                      style={styles.stateRow}
                      activeOpacity={0.7}
                      onPress={() => handleToggle(field.id, 'required')}
                    >
                      <Text style={styles.stateLabel} numberOfLines={1}>Required</Text>
                      <MaterialCommunityIcons
                        name={field.required ? 'toggle-switch' : 'toggle-switch-off-outline'}
                        size={30}
                        color={field.required ? '#F4C430' : '#C9C4B8'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stateRow}
                      activeOpacity={0.7}
                      onPress={() => handleToggle(field.id, 'editable')}
                    >
                      <Text style={styles.stateLabel} numberOfLines={1}>Editable</Text>
                      <MaterialCommunityIcons
                        name={field.editable ? 'toggle-switch' : 'toggle-switch-off-outline'}
                        size={30}
                        color={field.editable ? '#F4C430' : '#C9C4B8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  introCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  introTextWrap: { flex: 1, gap: 4 },
  introTitle: { fontSize: 16, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#171717' },
  introSub: { fontSize: 12, color: '#6B6B6B', lineHeight: 17, fontFamily: FontFamily.medium },

  sectionLabel: {
    fontSize: 10,
    color: '#6A6A6A',
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  roleRow: { gap: 8, paddingRight: 8 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  roleChipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  roleChipText: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  roleChipTextActive: { color: '#1A1B1C', fontWeight: '800', fontFamily: FontFamily.bold },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0EDE4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeActive: { backgroundColor: 'rgba(26,27,28,0.15)' },
  countText: { fontSize: 10, fontWeight: '800', color: '#6B6B6B' },
  countTextActive: { color: '#1A1B1C' },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 13, color: '#6B6B6B', fontFamily: FontFamily.medium },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717' },

  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#111827',
  },

  toggleRow: { flexDirection: 'row', gap: 20, paddingVertical: 2 },
  tickRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C9C4B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tickBoxOn: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  tickLabel: { fontSize: 13, color: '#171717', fontFamily: FontFamily.medium },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 12,
  },
  addBtnText: { fontSize: 14, fontWeight: '800', fontFamily: FontFamily.bold, color: '#1A1B1C' },

  emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontFamily: FontFamily.medium },

  fieldCard: {
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  fieldCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F0EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: { fontSize: 11, fontWeight: '800', fontFamily: FontFamily.bold, color: '#6B6B6B' },
  fieldLabel: { fontSize: 13, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717' },
  typeText: { fontSize: 11, color: '#6B6B6B', fontFamily: FontFamily.medium, marginTop: 1 },
  moveBtn: {
    width: 28,
    height: 28,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCardToggles: { flexDirection: 'row', gap: 8 },
  stateRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 3,
  },
  stateLabel: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#171717', flexShrink: 1 },
});
