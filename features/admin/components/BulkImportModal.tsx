import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FontFamily } from '../../../constants/fonts';
import { bulkCreateUsersApi, type BulkCreateRecord } from '../../../api/admin';
import { DropdownSelect, type DropdownOption } from './DropdownSelect';

export type BulkImportType = 'student' | 'teacher' | 'parent' | 'user';

interface BulkImportModalProps {
  visible: boolean;
  onClose: () => void;
  type: BulkImportType;
  /** user type only — staff role being imported */
  userRole?: string;
  /** user type only — role picker options (defaults to the current role) */
  roleOptions?: DropdownOption[];
  onImported?: () => void;
}

const MAX_ROWS = 500;

const TYPE_META: Record<BulkImportType, { title: string; subtitle: string; icon: string; plural: string }> = {
  student: {
    title: 'Import Students',
    subtitle: 'Add an entire class in one go — download the template, fill it, upload it back.',
    icon: 'account-school-outline',
    plural: 'Students',
  },
  teacher: {
    title: 'Import Teachers',
    subtitle: 'Onboard your whole staff list at once from a single CSV file.',
    icon: 'account-tie-outline',
    plural: 'Teachers',
  },
  parent: {
    title: 'Import Parents',
    subtitle: 'Create parent accounts and link them to students by email.',
    icon: 'account-group-outline',
    plural: 'Parents',
  },
  user: {
    title: 'Import Users',
    subtitle: 'Bulk-create staff accounts for the selected role.',
    icon: 'account-plus-outline',
    plural: 'Users',
  },
};

function buildTemplate(type: BulkImportType, userRole?: string): { headers: string[]; exampleRows: string[][] } {
  if (type === 'student') {
    return {
      headers: ['firstName', 'lastName', 'email', 'phone', 'rollNoOrUSN', 'password', 'department', 'academicYear', 'section'],
      exampleRows: [
        ['Aarav', 'Sharma', 'aarav.sharma@school.edu', '+91 98765 43210', '101', '', 'CSE', '2026', 'A'],
        ['Diya', 'Patel', 'diya.patel@school.edu', '+91 98765 43211', '102', 'School@123', 'CSE', '2026', 'A'],
      ],
    };
  }
  if (type === 'teacher') {
    return {
      headers: ['firstName', 'lastName', 'email', 'phone', 'password', 'department', 'employeeId'],
      exampleRows: [
        ['Priya', 'Nair', 'priya.nair@school.edu', '+91 98765 43210', '', 'CSE', 'EMP001'],
        ['Amit', 'Verma', 'amit.verma@school.edu', '+91 98765 43211', 'School@123', 'Maths', 'EMP002'],
      ],
    };
  }
  if (type === 'parent') {
    return {
      headers: ['firstName', 'lastName', 'email', 'phone', 'relation', 'childEmails'],
      exampleRows: [
        ['Rakesh', 'Kumar', 'rakesh.kumar@parent.edu', '+91 98765 43210', 'Father', 'aarav.sharma@school.edu'],
        ['Sunita', 'Devi', 'sunita.devi@parent.edu', '+91 98765 43211', 'Mother', 'aarav.sharma@school.edu;diya.patel@school.edu'],
      ],
    };
  }
  const officer = userRole === 'admission_officer';
  return {
    headers: officer
      ? ['firstName', 'lastName', 'email', 'phone', 'password', 'categoryName', 'seats']
      : ['firstName', 'lastName', 'email', 'phone', 'password'],
    exampleRows: officer
      ? [
          ['Vikram', 'Singh', 'vikram.singh@school.edu', '+91 98765 43210', '', 'Management Quota', '30'],
          ['Neha', 'Gupta', 'neha.gupta@school.edu', '+91 98765 43211', 'School@123', 'Government Quota', '20'],
        ]
      : [
          ['Rohit', 'Malhotra', 'rohit.malhotra@school.edu', '+91 98765 43210', ''],
          ['Kavita', 'Rao', 'kavita.rao@school.edu', '+91 98765 43211', 'School@123'],
        ],
  };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cur.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cur.push(field);
      field = '';
      if (cur.some((c) => c.trim() !== '')) rows.push(cur);
      cur = [];
    } else {
      field += ch;
    }
  }
  cur.push(field);
  if (cur.some((c) => c.trim() !== '')) rows.push(cur);
  return rows;
}

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
  tempPasswords: { email: string; tempPassword: string }[];
  note?: string;
}

function StepBadge({ n }: { n: number }) {
  return (
    <View style={styles.stepBadge}>
      <Text style={styles.stepBadgeText}>{n}</Text>
    </View>
  );
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  visible,
  onClose,
  type,
  userRole,
  roleOptions,
  onImported,
}) => {
  const meta = TYPE_META[type];
  const [role, setRole] = useState(userRole || 'admin');
  // Re-sync the role picker when the modal opens (e.g. the admin switched the
  // role in the Create User form before tapping Import).
  useEffect(() => {
    if (visible && type === 'user' && userRole) setRole(userRole);
  }, [visible, type, userRole]);
  const activeRole = type === 'user' ? role : undefined;
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const template = useMemo(() => buildTemplate(type, activeRole), [type, activeRole]);

  const [picked, setPicked] = useState<{ name: string; size: string; uri: string } | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setPicked(null);
    setRowCount(0);
    setResult(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    setRoleMenuOpen(false);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const csv =
        [template.headers.join(','), ...template.exampleRows.map((r) => r.join(','))].join('\n') + '\n';
      const fileName = `import_${type}${type === 'user' ? `_${activeRole || 'user'}` : ''}_template.csv`;
      const file = new File(Paths.cache, fileName);
      try {
        file.create({ overwrite: true, intermediates: true });
      } catch {
        // File may already exist from a previous download — overwrite is fine.
      }
      file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Save CSV template',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('CSV Template', csv);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not create the template file.');
    }
  };

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const response = await fetch(asset.uri);
      const text = await response.text();
      const rows = parseCsvRows(text);
      if (rows.length < 2) {
        Alert.alert('Empty File', 'The selected file has no data rows. Download the template and fill it in.');
        return;
      }
      const dataRows = rows.slice(1);
      if (dataRows.length > MAX_ROWS) {
        Alert.alert('Too Many Rows', `Maximum ${MAX_ROWS} rows per import. This file has ${dataRows.length}.`);
        return;
      }
      setPicked({
        name: asset.name,
        size: asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : '',
        uri: asset.uri,
      });
      setRowCount(dataRows.length);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not read the selected file.');
    }
  };

  const handleImport = async () => {
    if (!picked) {
      Alert.alert('Select File', 'Choose the CSV file to import first.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(picked.uri);
      const text = await response.text();
      const rows = parseCsvRows(text);
      const header = (rows[0] || []).map((h) => h.trim().toLowerCase());
      const required = ['firstname', 'lastname', 'email', ...(type === 'parent' ? ['relation', 'childemails'] : [])];
      const missing = required.filter((h) => !header.includes(h));
      if (missing.length) {
        Alert.alert(
          'Missing Columns',
          `The CSV must include these columns: ${missing.join(', ')}. Download the template for the exact format.`
        );
        setBusy(false);
        return;
      }
      const cell = (row: string[], name: string) => {
        const idx = header.indexOf(name);
        return idx >= 0 ? (row[idx] || '').trim() : '';
      };
      const records: BulkCreateRecord[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.some((c) => c.trim() !== '')) continue;
        const rec: BulkCreateRecord = {
          firstName: cell(row, 'firstname'),
          lastName: cell(row, 'lastname'),
          email: cell(row, 'email').toLowerCase(),
        };
        const phone = cell(row, 'phone');
        if (phone) rec.phone = phone;
        const password = cell(row, 'password');
        if (password) rec.password = password;
        if (type === 'student') {
          const rollNoOrUSN = cell(row, 'rollnousn');
          if (rollNoOrUSN) rec.rollNoOrUSN = rollNoOrUSN;
          const department = cell(row, 'department');
          if (department) rec.department = department;
          const academicYear = cell(row, 'academicyear');
          if (academicYear) rec.academicYear = academicYear;
          const section = cell(row, 'section');
          if (section) rec.section = section;
        }
        if (type === 'teacher') {
          const department = cell(row, 'department');
          if (department) rec.department = department;
          const employeeId = cell(row, 'employeeid');
          if (employeeId) rec.employeeId = employeeId;
        }
        if (type === 'parent') {
          rec.relation = cell(row, 'relation');
          rec.childEmails = cell(row, 'childemails')
            .split(/[;|,]/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        }
        if (type === 'user' && activeRole === 'admission_officer') {
          const categoryName = cell(row, 'categoryname');
          if (categoryName) rec.categoryName = categoryName;
          const seatsRaw = cell(row, 'seats');
          if (/^\d+$/.test(seatsRaw)) rec.seats = Number(seatsRaw);
        }
        records.push(rec);
      }
      if (records.length === 0) {
        Alert.alert('No Rows', 'No valid data rows were found in the file.');
        setBusy(false);
        return;
      }
      const res: any = await bulkCreateUsersApi(activeRole || type, records);
      const data = res?.data || res;
      const importResult: ImportResult = {
        total: data?.total ?? records.length,
        created: data?.created ?? 0,
        skipped: data?.skipped ?? 0,
        failed: data?.failed ?? 0,
        errors: Array.isArray(data?.errors) ? data.errors : [],
        tempPasswords: Array.isArray(data?.tempPasswords) ? data.tempPasswords : [],
        note: data?.note,
      };
      setResult(importResult);
      onImported?.();
    } catch (err: any) {
      Alert.alert('Import Failed', err?.message || 'Something went wrong while importing.');
    } finally {
      setBusy(false);
    }
  };

  const success = !result || result.created > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={busy ? undefined : handleClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeChip} onPress={handleClose} disabled={busy}>
              <MaterialCommunityIcons name="close" size={18} color="#6B6B6B" />
            </TouchableOpacity>
            <View style={[styles.heroIcon, result ? (success ? styles.heroIconOk : styles.heroIconBad) : null]}>
              <MaterialCommunityIcons
                name={
                  result
                    ? success
                      ? 'check'
                      : 'alert-outline'
                    : (meta.icon as any)
                }
                size={result ? 30 : 26}
                color={result ? '#FFFFFF' : '#1A1B1C'}
              />
            </View>
            <Text style={styles.headerTitle}>
              {result ? (success ? 'Import complete' : 'Nothing imported') : meta.title}
            </Text>
            <Text style={styles.headerSub}>
              {result
                ? `${result.created} of ${result.total} ${meta.plural.toLowerCase()} created`
                : meta.subtitle}
            </Text>
          </View>

          {result ? (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {/* Stat row */}
              <View style={styles.statRow}>
                <View style={[styles.statCard, styles.statCardGreen]}>
                  <Text style={styles.statValue}>{result.created}</Text>
                  <Text style={styles.statLabel}>Created</Text>
                </View>
                <View style={[styles.statCard, styles.statCardAmber]}>
                  <Text style={styles.statValue}>{result.skipped}</Text>
                  <Text style={styles.statLabel}>Skipped</Text>
                </View>
                <View style={[styles.statCard, styles.statCardRed]}>
                  <Text style={styles.statValue}>{result.failed}</Text>
                  <Text style={styles.statLabel}>Failed</Text>
                </View>
              </View>

              {!!result.note && (
                <View style={styles.noteBanner}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#92400E" />
                  <Text style={styles.noteText}>{result.note}</Text>
                </View>
              )}

              {result.errors.length > 0 && (
                <View style={[styles.detailCard, styles.detailCardDanger]}>
                  <View style={styles.detailHead}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC3545" />
                    <Text style={[styles.detailTitle, { color: '#DC3545' }]}>Needs attention</Text>
                  </View>
                  {result.errors.slice(0, 50).map((e, i) => (
                    <Text key={i} style={styles.errorLine}>
                      <Text style={styles.errorRow}>Row {e.row}</Text>
                      {'  ·  '}
                      {e.message}
                    </Text>
                  ))}
                  {result.errors.length > 50 && (
                    <Text style={styles.errorLine}>…and {result.errors.length - 50} more</Text>
                  )}
                </View>
              )}

              {result.tempPasswords.length > 0 && (
                <View style={styles.secretCard}>
                  <View style={styles.detailHead}>
                    <MaterialCommunityIcons name="key-variant" size={15} color="#F4C430" />
                    <Text style={[styles.detailTitle, { color: '#F4C430' }]}>Temporary passwords — shown once</Text>
                  </View>
                  {result.tempPasswords.slice(0, 50).map((t, i) => (
                    <View key={i} style={styles.secretRow}>
                      <Text style={styles.secretEmail}>{t.email}</Text>
                      <Text style={styles.secretPass}>{t.tempPassword}</Text>
                    </View>
                  ))}
                  {result.tempPasswords.length > 50 && (
                    <Text style={styles.secretMore}>+{result.tempPasswords.length - 50} more</Text>
                  )}
                </View>
              )}

              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => { setResult(null); setPicked(null); setRowCount(0); }}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
                  <Text style={styles.ghostBtnText}>Import more</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleClose}>
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {type === 'user' && (
                <View style={[styles.card, roleMenuOpen && styles.cardLifted]}>
                  <View style={styles.stepHead}>
                    <StepBadge n={1} />
                    <Text style={styles.stepTitle}>Choose the role</Text>
                  </View>
                  <DropdownSelect
                    value={activeRole || 'admin'}
                    options={roleOptions || [{ key: 'admin', label: 'Admin' }]}
                    onChange={setRole}
                    onOpenChange={setRoleMenuOpen}
                    menuTitle="Select role"
                    leadingIcon="shield-account-outline"
                  />
                </View>
              )}

              {/* Template */}
              <View style={styles.card}>
                <View style={styles.stepHead}>
                  <StepBadge n={type === 'user' ? 2 : 1} />
                  <Text style={styles.stepTitle}>Download the CSV template</Text>
                </View>
                <Text style={styles.cardHint}>
                  Keep the header row exactly as-is. Column order doesn’t matter — names are matched. Optional
                  columns can be left blank.
                </Text>
                <View style={styles.headerStrip}>
                  {template.headers.map((h) => (
                    <View key={h} style={styles.chip}>
                      <Text style={styles.chipText}>{h}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.goldBtn} onPress={handleDownloadTemplate} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="download-outline" size={16} color="#1A1B1C" />
                  <Text style={styles.goldBtnText}>Download Template</Text>
                </TouchableOpacity>
              </View>

              {/* File picker */}
              <View style={styles.card}>
                <View style={styles.stepHead}>
                  <StepBadge n={type === 'user' ? 3 : 2} />
                  <Text style={styles.stepTitle}>Upload the filled CSV</Text>
                </View>
                {!picked ? (
                  <TouchableOpacity style={styles.uploadBox} onPress={handlePickFile} disabled={busy} activeOpacity={0.8}>
                    <View style={styles.uploadIconCircle}>
                      <MaterialCommunityIcons name="cloud-upload-outline" size={26} color="#1A1B1C" />
                    </View>
                    <Text style={styles.uploadTitle}>Tap to browse files</Text>
                    <Text style={styles.uploadHint}>CSV · up to {MAX_ROWS} rows</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.fileCard}>
                    <View style={styles.fileIconCircle}>
                      <MaterialCommunityIcons name="file-document-outline" size={20} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{picked.name}</Text>
                      <View style={styles.filePills}>
                        {!!picked.size && (
                          <View style={styles.pill}>
                            <Text style={styles.pillText}>{picked.size}</Text>
                          </View>
                        )}
                        <View style={[styles.pill, styles.pillGolden]}>
                          <Text style={[styles.pillText, { color: '#1A1B1C' }]}>
                            {rowCount} row{rowCount === 1 ? '' : 's'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => { setPicked(null); setRowCount(0); }}
                      disabled={busy}
                      style={styles.fileRemove}
                    >
                      <MaterialCommunityIcons name="close-circle" size={20} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnGlow, (!picked || busy) && styles.btnDisabled]}
                onPress={handleImport}
                disabled={!picked || busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <>
                    <ActivityIndicator size="small" color="#1A1B1C" />
                    <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Creating accounts…</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="file-import-outline" size={18} color="#1A1B1C" />
                    <Text style={[styles.primaryBtnText, { marginLeft: 6 }]}>
                      Import {rowCount > 0 ? `${rowCount} ` : ''}{meta.plural}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 27, 28, 0.55)',
  },
  sheet: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 5,
    backgroundColor: '#E8E5DC',
    marginTop: 10,
    marginBottom: 2,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 6,
  },
  closeChip: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#F4C430',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroIconOk: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  heroIconBad: {
    backgroundColor: '#DC3545',
    shadowColor: '#DC3545',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#1A1B1C',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12.5,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  body: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#171717',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
    flex: 1,
  },
  cardHint: { fontSize: 11, color: '#6B6B6B', lineHeight: 16 },
  cardLifted: { zIndex: 10, elevation: 8 },
  headerStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#FFF7D6',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F0E4B8',
    padding: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F0E4B8',
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: FontFamily.medium,
    color: '#1A1B1C',
  },
  goldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1A1B1C',
  },
  goldBtnText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFDF7',
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 5,
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F0E4B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
  uploadHint: { fontSize: 10.5, color: '#9CA3AF' },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  fileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { fontSize: 13, fontWeight: '800', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  filePills: { flexDirection: 'row', gap: 6, marginTop: 5 },
  pill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  pillGolden: { backgroundColor: '#F4C430' },
  pillText: { fontSize: 10, fontWeight: '700', color: '#6B6B6B' },
  fileRemove: { padding: 2 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 15,
    marginBottom: 12,
    minHeight: 52,
  },
  primaryBtnGlow: {
    shadowColor: '#F4C430',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#1A1B1C',
  },
  btnDisabled: { opacity: 0.55, shadowOpacity: 0, elevation: 0 },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    paddingVertical: 12,
    gap: 2,
  },
  statCardGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statCardAmber: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statCardRed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#1A1B1C',
  },
  statLabel: { fontSize: 10.5, fontWeight: '700', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.4 },
  noteBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
    padding: 12,
    marginBottom: 12,
  },
  noteText: { flex: 1, fontSize: 11.5, color: '#92400E', lineHeight: 16 },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    marginBottom: 12,
  },
  detailCardDanger: {
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545',
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  errorLine: { fontSize: 11.5, color: '#7F1D1D', marginBottom: 4, lineHeight: 16 },
  errorRow: { fontWeight: '800', color: '#DC3545' },
  secretCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: 5,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  secretRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244,196,48,0.15)',
  },
  secretEmail: { fontSize: 11.5, color: '#E5E5E5', flex: 1 },
  secretPass: {
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#F4C430',
  },
  secretMore: { fontSize: 10.5, color: '#9CA3AF', marginTop: 6 },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#1A1B1C',
    borderRadius: 5,
    paddingVertical: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
});
