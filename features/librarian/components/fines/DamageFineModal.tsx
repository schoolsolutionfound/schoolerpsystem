import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Fine, StudentProfile, BookCopy, Book, DamageType, CopyCondition, CopyStatus } from '../../types';
import { apiClient } from '../../../../api/client';

export const DamageFineModal = ({
  visible,
  students,
  copies,
  books,
  defaultPenalty,
  onClose,
  onSaveDamageFine,
  modalStyles,
  commonStyles,
  fineStyles,
}: {
  visible: boolean;
  students: StudentProfile[];
  copies: BookCopy[];
  books: Book[];
  defaultPenalty: number;
  onClose: () => void;
  onSaveDamageFine: (newFine: Fine, updatedCopy?: BookCopy) => void;
  modalStyles: any;
  commonStyles: any;
  fineStyles: any;
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [damageType, setDamageType] = useState<DamageType>('TORN_PAGES');
  const [fineAmount, setFineAmount] = useState('10.00');
  const [damageNotes, setDamageNotes] = useState('');
  const [copyCondition, setCopyCondition] = useState<CopyCondition>('DAMAGED');
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('UNDER_REPAIR');
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [copySearch, setCopySearch] = useState('');

  const DAMAGE_PRESETS: { type: DamageType; label: string; icon: string; defaultFee: number }[] = [
    { type: 'TORN_PAGES', label: 'Torn / Ripped Pages', icon: 'file-document-outline', defaultFee: 10.0 },
    { type: 'WATER_DAMAGE', label: 'Water / Liquid Damage', icon: 'water-alert-outline', defaultFee: 20.0 },
    { type: 'BINDING_BROKEN', label: 'Broken Spine & Binding', icon: 'book-open-outline', defaultFee: 25.0 },
    { type: 'COVER_DAMAGED', label: 'Cover Damage / Detached', icon: 'book-variant-remove', defaultFee: 15.0 },
    { type: 'WRITING_ANNOTATIONS', label: 'Scribbling & Highlights', icon: 'pencil-off-outline', defaultFee: 8.0 },
    { type: 'MISSING_PAGES', label: 'Missing Pages / Chapters', icon: 'file-remove-outline', defaultFee: 30.0 },
    { type: 'SEVERE_MOLD', label: 'Severe Mold / Stains', icon: 'biohazard', defaultFee: 35.0 },
    { type: 'TOTAL_DESTRUCTION', label: 'Total Destruction / Unusable', icon: 'alert-decagram', defaultFee: 50.0 },
    { type: 'GENERAL_WEAR', label: 'Excessive Wear & Tear', icon: 'alert-circle-outline', defaultFee: 5.0 },
  ];

  useEffect(() => {
    if (visible) {
      setSelectedStudentId(students[0]?.id || '');
      setSelectedCopyId('');
      setDamageType('TORN_PAGES');
      setFineAmount('10.00');
      setDamageNotes('');
      setCopyCondition('DAMAGED');
      setCopyStatus('UNDER_REPAIR');
      setMemberSearch('');
      setCopySearch('');
    }
  }, [visible, students]);

  const handleSelectDamageType = (type: DamageType) => {
    setDamageType(type);
    const preset = DAMAGE_PRESETS.find((p) => p.type === type);
    if (preset) {
      setFineAmount(preset.defaultFee.toFixed(2));
    }
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return students;
    const q = memberSearch.toLowerCase();
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || (s.classSection || '').toLowerCase().includes(q)
    );
  }, [students, memberSearch]);

  const filteredCopies = useMemo(() => {
    return copies.filter((c) => {
      const bk = books.find((b) => b.id === c.bookId);
      if (!copySearch.trim()) return true;
      const q = copySearch.toLowerCase();
      return (
        c.accessionNumber.toLowerCase().includes(q) ||
        (c.barcode || '').toLowerCase().includes(q) ||
        (bk && bk.title.toLowerCase().includes(q))
      );
    });
  }, [copies, books, copySearch]);

  const selectedCopy = useMemo(() => copies.find((c) => c.id === selectedCopyId), [copies, selectedCopyId]);

  const handleSave = () => {
    if (!selectedStudentId) {
      Alert.alert('Required Field', 'Please select a library member.');
      return;
    }
    const amt = parseFloat(fineAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Fine Amount', 'Please enter a valid fine penalty amount greater than $0.');
      return;
    }
    if (!damageNotes.trim()) {
      Alert.alert('Required Field', 'Please enter a brief description of the damage sustained.');
      return;
    }

    setSubmitting(true);
    const newFine: Fine = {
      id: `fine-dmg-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: selectedStudentId,
      bookCopyId: selectedCopyId || undefined,
      fineType: 'DAMAGED_BOOK',
      damageType,
      damageNotes: damageNotes.trim(),
      amount: amt,
      paidAmount: 0,
      status: 'UNPAID',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      paymentTransactions: [],
    };

    let updatedCopy: BookCopy | undefined;
    if (selectedCopy) {
      updatedCopy = {
        ...selectedCopy,
        condition: copyCondition,
        status: copyStatus,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }

    // Save to backend database API (silent offline fallback)
    apiClient('/library/fines/damage', {
      method: 'POST',
      body: JSON.stringify({ fine: newFine, copy: updatedCopy }),
    }).catch(() => { });

    setSubmitting(false);
    onSaveDamageFine(newFine, updatedCopy);
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '94%' }]}>
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="book-alert-outline" size={22} color="#DC2626" />
              <Text style={modalStyles.headerTitle}>Assess & Issue Book Damage Fine</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Step 1: Member Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>1. Select Member Responsible *</Text>
              <TextInput
                style={[styles.formInput, { fontSize: 12, marginBottom: 6 }]}
                placeholder="🔍 Filter student by name or admission no..."
                value={memberSearch}
                onChangeText={setMemberSearch}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {filteredMembers.map((s) => {
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedStudentId(s.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {s.fullName} ({s.admissionNo})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 2: Book Copy Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>2. Select Damaged Physical Copy (Optional)</Text>
              <TextInput
                style={[styles.formInput, { fontSize: 12, marginBottom: 6 }]}
                placeholder="🔍 Search copy by barcode, accession, or book title..."
                value={copySearch}
                onChangeText={setCopySearch}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                <TouchableOpacity
                  style={[styles.chip, !selectedCopyId && styles.chipActive]}
                  onPress={() => setSelectedCopyId('')}
                >
                  <Text style={[styles.chipText, !selectedCopyId && styles.chipTextActive]}>None / General Book</Text>
                </TouchableOpacity>
                {filteredCopies.map((c) => {
                  const bk = books.find((b) => b.id === c.bookId);
                  const isSelected = selectedCopyId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedCopyId(c.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {c.accessionNumber} • {bk?.title || 'Book'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 3: Specific Damage Type Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>3. Specific Damage Classification *</Text>
              <View style={fineStyles.damageGrid}>
                {DAMAGE_PRESETS.map((preset) => {
                  const isSelected = damageType === preset.type;
                  return (
                    <TouchableOpacity
                      key={preset.type}
                      style={[fineStyles.damagePresetCard, isSelected && fineStyles.damagePresetCardActive]}
                      onPress={() => handleSelectDamageType(preset.type)}
                    >
                      <MaterialCommunityIcons
                        name={preset.icon as any}
                        size={20}
                        color={isSelected ? '#121316' : '#6B7280'}
                      />
                      <Text style={[fineStyles.damagePresetText, isSelected && fineStyles.damagePresetTextActive]}>
                        {preset.label}
                      </Text>
                      <Text style={[fineStyles.damagePresetFee, isSelected && { color: '#121316' }]}>
                        ${preset.defaultFee.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 4: Penalty Fine Amount */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Assess Fine Penalty ($) *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: 16, fontWeight: '900', color: '#DC2626' }]}
                  value={fineAmount}
                  onChangeText={setFineAmount}
                  keyboardType="numeric"
                />
              </View>

              {selectedCopy && (
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Update Copy Condition</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['DAMAGED', 'BAD'] as CopyCondition[]).map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[styles.chip, { flex: 1, alignItems: 'center' }, copyCondition === cond && styles.chipActive]}
                        onPress={() => setCopyCondition(cond)}
                      >
                        <Text style={[styles.chipText, copyCondition === cond && styles.chipTextActive]}>{cond}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Step 5: Damage Description & Remarks */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>4. Damage Inspection Description & Remarks *</Text>
              <TextInput
                style={[styles.formInput, { height: 75 }]}
                value={damageNotes}
                onChangeText={setDamageNotes}
                multiline
                placeholder="Describe exact condition, page numbers affected, torn cover, water spill, etc..."
              />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#DC2626', marginTop: 10 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>Issue Damage Fine & Save Record</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
