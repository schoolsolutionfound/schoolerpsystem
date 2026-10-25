import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { Feather } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import { TeacherSettingsSkeleton } from './skeletons/TeacherSettingsSkeleton';
import {
  useTeacherSettingsStore,
  ExamTypeItem,
  ListTypeItem,
  PassingThresholdType,
} from '../services/teacherSettingsStore';

interface TeacherSettingsViewProps {
  onBack?: () => void;
}

export const TeacherSettingsView: React.FC<TeacherSettingsViewProps> = ({ onBack }) => {
  const {
    examTypes,
    listTypes,
    calculationSettings,
    addExamType,
    updateExamMaxMarks,
    removeExamType,
    toggleListType,
    addListType,
    updateListTypeMaxMarks,
    removeListType,
    updateCalculationSettings,
    resetToDefaults,
  } = useTeacherSettingsStore();

  // Local state for editable max marks for each exam
  const [maxMarksMap, setMaxMarksMap] = useState<Record<string, string>>({});
  // Local state for editable max marks for each list type
  const [listMarksMap, setListMarksMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Calculation logic local state
  const [passingType, setPassingType] = useState<PassingThresholdType>(
    calculationSettings.passingThresholdType || 'percentage'
  );
  const [passingThreshold, setPassingThreshold] = useState<string>(
    String(
      calculationSettings.passingThresholdValue ??
      calculationSettings.passingPercentage ??
      35
    )
  );

  useEffect(() => {
    const examMap: Record<string, string> = {};
    examTypes.forEach((exam) => {
      examMap[exam.id] = String(exam.maxMarks);
    });
    setMaxMarksMap(examMap);

    const lMap: Record<string, string> = {};
    listTypes.forEach((item) => {
      lMap[item.id] = String(item.maxMarks ?? 25);
    });
    setListMarksMap(lMap);

    setPassingType(calculationSettings.passingThresholdType || 'percentage');
    setPassingThreshold(
      String(
        calculationSettings.passingThresholdValue ??
        calculationSettings.passingPercentage ??
        35
      )
    );
  }, [examTypes, listTypes, calculationSettings]);

  // Add Exam Type Modal State
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState<'25' | '50' | '100'>('100');
  const [newExamCategory, setNewExamCategory] = useState<'Periodic' | 'Term' | 'Cumulative'>('Periodic');

  // Add List Type Modal State
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListTypeName, setNewListTypeName] = useState('');
  const [newListCategory, setNewListCategory] = useState('Evaluation');
  const [newListMaxMarks, setNewListMaxMarks] = useState('25');

  const handleMaxMarksChange = (examId: string, val: string) => {
    setMaxMarksMap((prev) => ({ ...prev, [examId]: val }));
  };

  const handleListMarksChange = (listId: string, val: string) => {
    setListMarksMap((prev) => ({ ...prev, [listId]: val }));
  };

  const handleSaveExamType = () => {
    if (!newExamName.trim()) {
      Alert.alert('Missing Name', 'Please enter a valid exam title.');
      return;
    }
    const marks = parseInt(newExamMaxMarks, 10) || 100;
    addExamType(newExamName.trim(), marks, newExamCategory);
    setNewExamName('');
    setShowAddExamModal(false);
    Alert.alert('Exam Type Added', `"${newExamName.trim()}" is now configured.`);
  };

  const handleDeleteExamType = (exam: ExamTypeItem) => {
    Alert.alert(
      'Delete Exam Type',
      `Are you sure you want to remove "${exam.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeExamType(exam.id),
        },
      ]
    );
  };

  const handleSaveListType = () => {
    if (!newListTypeName.trim()) {
      Alert.alert('Missing Name', 'Please enter a valid list type name.');
      return;
    }
    const marks = parseInt(newListMaxMarks, 10) || 25;
    addListType(newListTypeName.trim(), newListCategory.trim() || 'Evaluation', marks);
    setNewListTypeName('');
    setNewListMaxMarks('25');
    setShowAddListModal(false);
    Alert.alert('List Type Added', `"${newListTypeName.trim()}" has been added and enabled.`);
  };

  const handleDeleteListType = (item: ListTypeItem) => {
    Alert.alert(
      'Delete List Type',
      `Are you sure you want to remove "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeListType(item.id),
        },
      ]
    );
  };

  const handleSaveConfiguration = () => {
    // 1. Commit all edited exam max marks to store
    examTypes.forEach((exam) => {
      const rawVal = maxMarksMap[exam.id];
      if (rawVal) {
        const parsed = parseInt(rawVal, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed !== exam.maxMarks) {
          updateExamMaxMarks(exam.id, parsed);
        }
      }
    });

    // 2. Commit all edited list type max marks to store
    listTypes.forEach((item) => {
      const rawVal = listMarksMap[item.id];
      if (rawVal) {
        const parsed = parseInt(rawVal, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed !== item.maxMarks) {
          updateListTypeMaxMarks(item.id, parsed);
        }
      }
    });

    // 3. Commit calculation logic settings to store
    const parsedThreshold = parseInt(passingThreshold, 10);
    const validVal = !isNaN(parsedThreshold) && parsedThreshold > 0 ? parsedThreshold : 35;
    updateCalculationSettings({
      ...calculationSettings,
      passingThresholdType: passingType,
      passingThresholdValue: validVal,
      passingPercentage: passingType === 'percentage' ? validVal : calculationSettings.passingPercentage,
    });

    Alert.alert(
      'System Configuration Saved',
      'Your exam types, list types, and calculation rules have been updated successfully.'
    );
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to restore default exam types, list types, and calculation rules?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Settings Reset', 'Restored default system settings.');
          },
        },
      ]
    );
  };

  // Group items into pairs for the 2-column small containers
  const pairedExams: ExamTypeItem[][] = [];
  for (let i = 0; i < examTypes.length; i += 2) {
    if (i + 1 < examTypes.length) {
      pairedExams.push([examTypes[i], examTypes[i + 1]]);
    } else {
      pairedExams.push([examTypes[i]]);
    }
  }

  const pairedLists: ListTypeItem[][] = [];
  for (let i = 0; i < listTypes.length; i += 2) {
    if (i + 1 < listTypes.length) {
      pairedLists.push([listTypes[i], listTypes[i + 1]]);
    } else {
      pairedLists.push([listTypes[i]]);
    }
  }


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.viewBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerContainer}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color="#111827" />
            </TouchableOpacity>
          )}
          <Text style={styles.sectionHeader}>Settings</Text>
        </View>

        {refreshing ? (
          <TeacherSettingsSkeleton />
        ) : (
          <>
            {/* ======================================================== */}
            {/* CARD 1: EXAM TYPES                                      */}
            {/* ======================================================== */}
            <View style={styles.cardBox}>
              <View style={styles.cardHeader}>
                <View>
              <Text style={styles.cardTitle}>Exam Types</Text>
              
            </View>
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => setShowAddExamModal(true)}
              activeOpacity={0.8}
            >
              
              <Text style={styles.headerAddBtnText}>Add Exam</Text>
            </TouchableOpacity>
          </View>

          {/* Exam items in 2-column or full-width small containers */}
          {pairedExams.map((pair, rowIdx) => {
            if (pair.length === 2) {
              const [exam1, exam2] = pair;
              return (
                <View key={`exam-row-${rowIdx}`} style={styles.gridRow}>
                  {/* Container 1 */}
                  <View style={styles.smallContainer}>
                    <View style={styles.smallContainerHeader}>
                      <Text style={styles.smallContainerTitle} numberOfLines={1}>
                        {exam1.name}
                      </Text>
                      {examTypes.length > 2 && (
                        <TouchableOpacity
                          onPress={() => handleDeleteExamType(exam1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Feather name="trash-2" size={12} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.smallContainerSub}>
                      Max Marks
                    </Text>
                    <TextInput
                      style={styles.smallInput}
                      value={maxMarksMap[exam1.id] ?? String(exam1.maxMarks)}
                      onChangeText={(val) => handleMaxMarksChange(exam1.id, val)}
                      keyboardType="numeric"
                      placeholder="50"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Container 2 */}
                  <View style={styles.smallContainer}>
                    <View style={styles.smallContainerHeader}>
                      <Text style={styles.smallContainerTitle} numberOfLines={1}>
                        {exam2.name}
                      </Text>
                      {examTypes.length > 2 && (
                        <TouchableOpacity
                          onPress={() => handleDeleteExamType(exam2)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Feather name="trash-2" size={12} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.smallContainerSub}>
                      Max Marks 
                    </Text>
                    <TextInput
                      style={styles.smallInput}
                      value={maxMarksMap[exam2.id] ?? String(exam2.maxMarks)}
                      onChangeText={(val) => handleMaxMarksChange(exam2.id, val)}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              );
            }

            // Single odd exam: full width container
            const singleExam = pair[0];
            return (
              <View key={`exam-row-${rowIdx}`} style={styles.fullWidthContainer}>
                <View style={styles.smallContainerHeader}>
                  <Text style={styles.smallContainerTitle} numberOfLines={1}>
                    {singleExam.name}
                  </Text>
                  {examTypes.length > 2 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteExamType(singleExam)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="trash-2" size={12} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.smallContainerSub}>
                  Max Marks 
                </Text>
                <TextInput
                  style={styles.smallInput}
                  value={maxMarksMap[singleExam.id] ?? String(singleExam.maxMarks)}
                  onChangeText={(val) => handleMaxMarksChange(singleExam.id, val)}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            );
          })}
        </View>

        {/* ======================================================== */}
        {/* CARD 2: LIST TYPE (FOLLOWS IDENTICAL 2-COLUMN DESIGN)     */}
        {/* ======================================================== */}
        <View style={styles.cardBox}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>List Type</Text>
             
            </View>
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => setShowAddListModal(true)}
              activeOpacity={0.8}
            >
              
              <Text style={styles.headerAddBtnText}>Add List</Text>
            </TouchableOpacity>
          </View>

          {/* List items in 2-column or full-width small containers matching Card 1 */}
          {pairedLists.map((pair, rowIdx) => {
            if (pair.length === 2) {
              const [list1, list2] = pair;
              return (
                <View key={`list-row-${rowIdx}`} style={styles.gridRow}>
                  {/* Container 1 */}
                  <View
                    style={[
                      styles.smallContainer,
                      !list1.enabled && styles.smallContainerDisabled,
                    ]}
                  >
                    <View style={styles.smallContainerHeader}>
                      <Text
                        style={[
                          styles.smallContainerTitle,
                          !list1.enabled && styles.disabledText,
                        ]}
                        numberOfLines={1}
                      >
                        {list1.name}
                      </Text>
                      {listTypes.length > 2 && (
                        <TouchableOpacity
                          onPress={() => handleDeleteListType(list1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          style={{ padding: 2 }}
                        >
                          <Feather name="trash-2" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputToggleRow}>
                      <TextInput
                        style={[
                          styles.smallInput,
                          styles.flexInput,
                          !list1.enabled && styles.disabledInput,
                        ]}
                        value={listMarksMap[list1.id] ?? String(list1.maxMarks ?? 25)}
                        onChangeText={(val) => handleListMarksChange(list1.id, val)}
                        keyboardType="numeric"
                        placeholder="25"
                        placeholderTextColor="#94A3B8"
                        editable={list1.enabled}
                      />
                      <Switch
                        value={list1.enabled}
                        onValueChange={() => toggleListType(list1.id)}
                        trackColor={{ false: '#E2E8F0', true: '#F4C430' }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E2E8F0"
                        style={styles.bottomSwitch}
                      />
                    </View>
                  </View>

                  {/* Container 2 */}
                  <View
                    style={[
                      styles.smallContainer,
                      !list2.enabled && styles.smallContainerDisabled,
                    ]}
                  >
                    <View style={styles.smallContainerHeader}>
                      <Text
                        style={[
                          styles.smallContainerTitle,
                          !list2.enabled && styles.disabledText,
                        ]}
                        numberOfLines={1}
                      >
                        {list2.name}
                      </Text>
                      {listTypes.length > 2 && (
                        <TouchableOpacity
                          onPress={() => handleDeleteListType(list2)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          style={{ padding: 2 }}
                        >
                          <Feather name="trash-2" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputToggleRow}>
                      <TextInput
                        style={[
                          styles.smallInput,
                          styles.flexInput,
                          !list2.enabled && styles.disabledInput,
                        ]}
                        value={listMarksMap[list2.id] ?? String(list2.maxMarks ?? 25)}
                        onChangeText={(val) => handleListMarksChange(list2.id, val)}
                        keyboardType="numeric"
                        placeholder="25"
                        placeholderTextColor="#94A3B8"
                        editable={list2.enabled}
                      />
                      <Switch
                        value={list2.enabled}
                        onValueChange={() => toggleListType(list2.id)}
                        trackColor={{ false: '#E2E8F0', true: '#F4C430' }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E2E8F0"
                        style={styles.bottomSwitch}
                      />
                    </View>
                  </View>
                </View>
              );
            }

            // Single odd list item: full width container
            const singleList = pair[0];
            return (
              <View
                key={`list-row-${rowIdx}`}
                style={[
                  styles.fullWidthContainer,
                  !singleList.enabled && styles.smallContainerDisabled,
                ]}
              >
                <View style={styles.smallContainerHeader}>
                  <Text
                    style={[
                      styles.smallContainerTitle,
                      !singleList.enabled && styles.disabledText,
                    ]}
                    numberOfLines={1}
                  >
                    {singleList.name}
                  </Text>
                  {listTypes.length > 2 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteListType(singleList)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={{ padding: 2 }}
                    >
                      <Feather name="trash-2" size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputToggleRow}>
                  <TextInput
                    style={[
                      styles.smallInput,
                      styles.flexInput,
                      !singleList.enabled && styles.disabledInput,
                    ]}
                    value={listMarksMap[singleList.id] ?? String(singleList.maxMarks ?? 25)}
                    onChangeText={(val) => handleListMarksChange(singleList.id, val)}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor="#94A3B8"
                    editable={singleList.enabled}
                  />
                  <Switch
                    value={singleList.enabled}
                    onValueChange={() => toggleListType(singleList.id)}
                    trackColor={{ false: '#E2E8F0', true: '#F4C430' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E2E8F0"
                    style={styles.bottomSwitch}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* ======================================================== */}
        {/* CARD 3: TOTAL MARKS & AVERAGE CALCULATION LOGIC          */}
        {/* ======================================================== */}
        <View style={styles.cardBox}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Calculation</Text>
            </View>
          </View>

          {/* Passing Threshold Container */}
          <View style={styles.fullWidthContainer}>
            <Text style={styles.smallContainerTitle}>Passing Threshold</Text>

            <View style={styles.thresholdRow}>
              {/* 2 Buttons: Mark & Percentage */}
              <View style={styles.thresholdSegmentedContainer}>
                <TouchableOpacity
                  style={[
                    styles.segmentedBtn,
                    passingType === 'mark' && styles.segmentedBtnActive,
                  ]}
                  onPress={() => setPassingType('mark')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentedBtnText,
                      passingType === 'mark' && styles.segmentedBtnTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Mark
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentedBtn,
                    passingType === 'percentage' && styles.segmentedBtnActive,
                  ]}
                  onPress={() => setPassingType('percentage')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentedBtnText,
                      passingType === 'percentage' && styles.segmentedBtnTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Percentage
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Value Input */}
              <View style={styles.inputWithUnitWrap}>
                <TextInput
                  style={styles.inputWithUnit}
                  value={passingThreshold}
                  onChangeText={setPassingThreshold}
                  keyboardType="numeric"
                  placeholder={passingType === 'mark' ? '40' : '35'}
                  placeholderTextColor="#94A3B8"
                />
                <View style={styles.inputUnitBadge}>
                  <Text style={styles.inputUnitText}>
                    {passingType === 'mark' ? 'Marks' : '%'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* BOTTOM ACTION BUTTONS                                    */}
        {/* ======================================================== */}
        <View style={styles.actionButtonsWrap}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSaveConfiguration}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Save System Configuration</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetDefaults}
            activeOpacity={0.8}
          >
            <Feather name="rotate-ccw" size={14} color="#6B7280" />
            <Text style={styles.resetBtnText}>Restore System Defaults</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: ADD EXAM TYPE                                    */}
      {/* ======================================================== */}
      <Modal
        visible={showAddExamModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddExamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exam Type</Text>
              <TouchableOpacity onPress={() => setShowAddExamModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EXAM TITLE</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Unit Test 3, Pre-Board..."
                placeholderTextColor="#9CA3AF"
                value={newExamName}
                onChangeText={setNewExamName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MAXIMUM MARKS</Text>
              <View style={styles.optionPillRow}>
                {(['25', '50', '100'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.optionPill,
                      newExamMaxMarks === m && styles.optionPillActive,
                    ]}
                    onPress={() => setNewExamMaxMarks(m)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        newExamMaxMarks === m && styles.optionPillTextActive,
                      ]}
                    >
                      {m} Marks
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.optionPillRow}>
                {(['Periodic', 'Term', 'Cumulative'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.optionPill,
                      newExamCategory === c && styles.optionPillActive,
                    ]}
                    onPress={() => setNewExamCategory(c)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        newExamCategory === c && styles.optionPillTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddExamModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveExamType}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save Exam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: ADD LIST TYPE                                    */}
      {/* ======================================================== */}
      <Modal
        visible={showAddListModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add List Type</Text>
              <TouchableOpacity onPress={() => setShowAddListModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LIST TYPE NAME</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Assessment, Project, Seminar..."
                placeholderTextColor="#9CA3AF"
                value={newListTypeName}
                onChangeText={setNewListTypeName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
            
              <TextInput
                style={styles.modalInput}
                placeholder="25"
                placeholderTextColor="#9CA3AF"
                value={newListMaxMarks}
                onChangeText={setNewListMaxMarks}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EVALUATION CATEGORY</Text>
              <View style={styles.optionPillRow}>
                {['Evaluation', 'Practical', 'Submission', 'Oral'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.optionPill,
                      newListCategory === cat && styles.optionPillActive,
                    ]}
                    onPress={() => setNewListCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        newListCategory === cat && styles.optionPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddListModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveListType}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Save List Type</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  viewBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 130,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    letterSpacing: -0.2,
  },

  /* Card Boxes matching screenshot */
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  cardSubTitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  headerAddBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* 2-column Grid & Small Containers */
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  smallContainerDisabled: {
    opacity: 0.65,
    backgroundColor: '#F1F5F9',
  },
  smallContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallContainerTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    flex: 1,
  },
  disabledText: {
    color: '#94A3B8',
  },
  inputToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  flexInput: {
    flex: 1,
    marginTop: 0,
  },
  bottomSwitch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  smallContainerSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: FontFamily.regular,
  },
  smallInput: {
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  fullWidthContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },

  /* Calculation Passing Threshold Styles */
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  thresholdSegmentedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
    height: 38,
    gap: 2,
  },
  segmentedBtn: {
    flex: 1,
    height: '100%',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  segmentedBtnActive: {
    backgroundColor: '#F4C430',
  },
  segmentedBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  segmentedBtnTextActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  inputWithUnitWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 38,
    overflow: 'hidden',
  },
  inputWithUnit: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  inputUnitBadge: {
    paddingHorizontal: 10,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  inputUnitText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#64748B',
  },

  /* Action Buttons */
  actionButtonsWrap: {
    gap: 10,
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: '#F4C430',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#171717',
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 5,
  },
  resetBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#475569',
    letterSpacing: 0.3,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  optionPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  optionPillText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  optionPillTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
