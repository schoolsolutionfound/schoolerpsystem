import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '../common/Icons';
import { BookCopy, CopyStatus, CopyCondition } from '../../types';

export const CopyFormModal = ({
  visible,
  editingCopy,
  bookId,
  onClose,
  onSave,
  modalStyles,
  commonStyles,
}: {
  visible: boolean;
  editingCopy: BookCopy | null;
  bookId: string;
  onClose: () => void;
  onSave: (copyData: Partial<BookCopy>) => void;
  modalStyles: any;
  commonStyles: any;
}) => {
  const [accessionNumber, setAccessionNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [rack, setRack] = useState('Rack A');
  const [shelf, setShelf] = useState('Shelf 1');
  const [status, setStatus] = useState<CopyStatus>('AVAILABLE');
  const [condition, setCondition] = useState<CopyCondition>('GOOD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCopy) {
      setAccessionNumber(editingCopy.accessionNumber || '');
      setBarcode(editingCopy.barcode || '');
      setRack(editingCopy.rack || 'Rack A');
      setShelf(editingCopy.shelf || 'Shelf 1');
      setStatus(editingCopy.status || 'AVAILABLE');
      setCondition(editingCopy.condition || 'GOOD');
    } else {
      const randNum = String(Math.floor(100000 + Math.random() * 900000));
      setAccessionNumber(`ACC-${randNum}`);
      setBarcode(`BAR-${randNum}`);
      setRack('Rack A');
      setShelf('Shelf 1');
      setStatus('AVAILABLE');
      setCondition('GOOD');
    }
  }, [editingCopy, visible]);

  const generateNewBarcode = () => {
    const randNum = String(Math.floor(100000 + Math.random() * 900000));
    setAccessionNumber(`ACC-${randNum}`);
    setBarcode(`BAR-${randNum}`);
  };

  const handleSave = () => {
    if (!accessionNumber.trim()) {
      Alert.alert('Required Field', 'Accession Number is required.');
      return;
    }
    if (!barcode.trim()) {
      Alert.alert('Required Field', 'Barcode is required.');
      return;
    }

    setSubmitting(true);
    onSave({
      accessionNumber: accessionNumber.trim(),
      barcode: barcode.trim(),
      rack: rack.trim() || 'Rack A',
      shelf: shelf.trim() || 'Shelf 1',
      status,
      condition,
    });
    setSubmitting(false);
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingCopy ? 'Edit Inventory Copy' : 'Add Physical Inventory Copy'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Auto-generate Barcode / Accession Card */}
            <View style={copyFormStyles.barcodeCard}>
              <View style={{ flex: 1 }}>
                <Text style={copyFormStyles.barcodeTitle}>Inventory Tag Generator</Text>
                <Text style={copyFormStyles.barcodeSub}>Auto-assign unique barcode & accession number</Text>
              </View>
              <TouchableOpacity style={copyFormStyles.genBtn} onPress={generateNewBarcode}>
                <Feather name="refresh-cw" size={14} color="#121316" />
                <Text style={copyFormStyles.genBtnText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Accession Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={accessionNumber}
                  onChangeText={setAccessionNumber}
                  placeholder="e.g. ACC-000101"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Barcode Tag *</Text>
                <TextInput
                  style={styles.formInput}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="e.g. BAR-100101"
                />
              </View>
            </View>

            {/* Rack Location Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Rack Location (Storage Wing)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {['Rack A', 'Rack B', 'Rack C', 'Rack D', 'Rack E', 'Special Reserve', 'Archive Storage'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, rack === r && styles.chipActive]}
                    onPress={() => setRack(r)}
                  >
                    <Text style={[styles.chipText, rack === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.formInput, { marginTop: 4 }]}
                value={rack}
                onChangeText={setRack}
                placeholder="Or enter custom rack location..."
              />
            </View>

            {/* Shelf Location Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Shelf Location (Tier Level)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {['Shelf 1', 'Shelf 2', 'Shelf 3', 'Shelf 4', 'Shelf 5', 'Top Tier', 'Display Shelf'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, shelf === s && styles.chipActive]}
                    onPress={() => setShelf(s)}
                  >
                    <Text style={[styles.chipText, shelf === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.formInput, { marginTop: 4 }]}
                value={shelf}
                onChangeText={setShelf}
                placeholder="Or enter custom shelf level..."
              />
            </View>

            {/* Status Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Copy Availability Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {(['AVAILABLE', 'ISSUED', 'RESERVED', 'OVERDUE', 'LOST', 'DAMAGED', 'UNDER_REPAIR', 'WITHDRAWN'] as CopyStatus[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, status === st && styles.chipActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[styles.chipText, status === st && styles.chipTextActive]}>{st.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Condition Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Physical Condition Assessment</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {(['GOOD', 'FAIR', 'DAMAGED', 'BAD'] as CopyCondition[]).map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.chip,
                      { flex: 1, alignItems: 'center', justifyContent: 'center' },
                      condition === cond && styles.chipActive,
                    ]}
                    onPress={() => setCondition(cond)}
                  >
                    <Text style={[styles.chipText, condition === cond && styles.chipTextActive]}>{cond}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 16 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>{editingCopy ? 'Save Copy Details' : 'Add Inventory Copy'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const copyFormStyles = StyleSheet.create({
  barcodeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FDE047', gap: 10 },
  barcodeTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  barcodeSub: { fontSize: 11, color: '#B45309' },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF08A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  genBtnText: { fontSize: 12, fontWeight: '800', color: '#121316' },
});
