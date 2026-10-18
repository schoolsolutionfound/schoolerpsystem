import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { QuestionPaper, ExamType } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

interface PYQsViewProps {
  questionPapers: QuestionPaper[];
  onUploadPYQ: () => void;
  onPreviewPYQ: (paper: QuestionPaper) => void;
  onDeletePYQ: (pyqId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  commonStyles: any;
  fineStyles: any;
}

export function PYQsView({ questionPapers, onUploadPYQ, onPreviewPYQ, onDeletePYQ, onRefresh, isRefreshing, commonStyles, fineStyles }: PYQsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const isAnyFilterActive = selectedYear !== 'ALL' || selectedClass !== 'ALL' || selectedExam !== 'ALL';

  const yearOptions = ['ALL', '2024-2025', '2023-2024', '2022-2023'];
  const classOptions = ['ALL', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const examOptions = ['ALL', 'FINAL', 'MIDTERM', 'ANNUAL', 'UNIT_TEST', 'SUPPLEMENTARY'];

  const totalDownloads = useMemo(() => {
    return questionPapers.reduce((sum, p) => sum + (p.downloadsCount || 0), 0);
  }, [questionPapers]);

  const uniqueSubjects = useMemo(() => {
    return new Set(questionPapers.map((p) => p.subject)).size;
  }, [questionPapers]);

  const filteredPapers = useMemo(() => {
    return questionPapers.filter((paper) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        paper.title.toLowerCase().includes(q) ||
        paper.subject.toLowerCase().includes(q) ||
        paper.uploadedBy.toLowerCase().includes(q);

      const matchesYear = selectedYear === 'ALL' || paper.academicYear === selectedYear;
      const matchesClass = selectedClass === 'ALL' || paper.classGrade === selectedClass;
      const matchesExam = selectedExam === 'ALL' || paper.examType === selectedExam;

      return matchesSearch && matchesYear && matchesClass && matchesExam;
    });
  }, [questionPapers, search, selectedYear, selectedClass, selectedExam]);

  const styles = commonStyles;

  return (
    <ScrollView
      style={styles.viewBodyContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!isRefreshing}
            onRefresh={onRefresh}
            colors={['#D97706']}
            tintColor="#D97706"
          />
        ) : undefined
      }
    >
      {/* Header Bar with Attendance Theme Styling */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' }}>Previous Year Question Papers </Text>
          </View>
        </View>

        <TouchableOpacity style={pyqStyles.uploadBtn} onPress={onUploadPYQ} activeOpacity={0.85}>
          <Text style={pyqStyles.uploadBtnText}>Upload New PYQ</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBox, { marginBottom: 8 }]}>
        <Feather name="search" size={16} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, subject or uploader..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#475569"
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Option aligned to the right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isAnyFilterActive ? 'space-between' : 'flex-end', marginBottom: 16, paddingHorizontal: 2 }}>
        {isAnyFilterActive && (
          <TouchableOpacity
            onPress={() => {
              setSelectedYear('ALL');
              setSelectedClass('ALL');
              setSelectedExam('ALL');
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12, fontFamily: FontFamily.semibold, color: '#DC2626', textDecorationLine: 'underline' }}>
              Reset Filters
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          onPress={() => setIsFilterModalOpen(true)}
          activeOpacity={0.7}
        >
          <Feather name="sliders" size={14} color="#171717" />
          <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#171717', textDecorationLine: isAnyFilterActive ? 'underline' : 'none' }}>
            Filter {isAnyFilterActive ? `(${[selectedYear !== 'ALL' && selectedYear, selectedClass !== 'ALL' && selectedClass, selectedExam !== 'ALL' && selectedExam].filter(Boolean).join(', ')})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List / Cards */}
      {filteredPapers.length === 0 ? (
        <View style={{ backgroundColor: '#FFFFFF', padding: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 }}>
          <MaterialCommunityIcons name="file-document-alert-outline" size={48} color="#9CA3AF" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No Question Papers Found</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
            Try adjusting your search keywords or filter criteria above.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12, paddingBottom: 40 }}>
          {filteredPapers.map((paper) => (
            <View key={paper.id} style={pyqStyles.pyqCard}>
              {/* Header Badges & Uploader */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                  <View style={pyqStyles.subjectBadge}>
                    <Text style={pyqStyles.subjectBadgeText}>{paper.subject}</Text>
                  </View>
                  <View style={pyqStyles.examBadge}>
                    <Text style={pyqStyles.examBadgeText}>{paper.examType}</Text>
                  </View>
                  <View style={pyqStyles.classBadge}>
                    <Text style={pyqStyles.classBadgeText}>{paper.classGrade}</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                  Uploaded by {paper.uploadedBy}
                </Text>
              </View>

              {/* Title */}
              <Text style={pyqStyles.pyqTitle}>{paper.title}</Text>

              {/* Meta Info List with Icons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={pyqStyles.metaText}>Year: <Text style={{ fontWeight: '700', color: '#111827' }}>{paper.academicYear}</Text></Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#6B7280" />
                  <Text style={pyqStyles.metaText}>Marks: <Text style={{ fontWeight: '700', color: '#111827' }}>{paper.totalMarks} Marks</Text></Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                  <Text style={pyqStyles.metaText}>Duration: <Text style={{ fontWeight: '700', color: '#111827' }}>{paper.durationMinutes} mins</Text></Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="tray-arrow-down" size={14} color="#2563EB" />
                  <Text style={pyqStyles.metaText}>Downloads: <Text style={{ fontWeight: '800', color: '#2563EB' }}>{paper.downloadsCount}</Text></Text>
                </View>
              </View>

              {/* Action Buttons Footer (Attendance Theme) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#E8E5DC', paddingTop: 12, marginTop: 4 }}>
                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#E8E5DC', backgroundColor: '#FFFFFF', flex: 1, justifyContent: 'center' }]}
                  onPress={() => onPreviewPYQ(paper)}
                  activeOpacity={0.8}
                >
                  <Feather name="eye" size={15} color="#171717" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#171717' }]}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#F4C430', backgroundColor: '#F4C430', flex: 1, justifyContent: 'center' }]}
                  onPress={() => onPreviewPYQ(paper)}
                  activeOpacity={0.8}
                >
                  <Feather name="download" size={15} color="#171717" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#171717', fontWeight: '900' }]}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#FECACA', backgroundColor: '#FEF2F2', paddingHorizontal: 12 }]}
                  onPress={() => onDeletePYQ(paper.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={15} color="#DC2626" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      <PYQFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedExam={selectedExam}
        setSelectedExam={setSelectedExam}
        yearOptions={yearOptions}
        classOptions={classOptions}
        examOptions={examOptions}
      />
    </ScrollView>
  );
}

function PYQFilterModal({
  visible,
  onClose,
  selectedYear,
  setSelectedYear,
  selectedClass,
  setSelectedClass,
  selectedExam,
  setSelectedExam,
  yearOptions,
  classOptions,
  examOptions,
}: {
  visible: boolean;
  onClose: () => void;
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  selectedExam: string;
  setSelectedExam: (val: string) => void;
  yearOptions: string[];
  classOptions: string[];
  examOptions: string[];
}) {
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempClass, setTempClass] = useState(selectedClass);
  const [tempExam, setTempExam] = useState(selectedExam);

  useEffect(() => {
    if (visible) {
      setTempYear(selectedYear);
      setTempClass(selectedClass);
      setTempExam(selectedExam);
    }
  }, [visible, selectedYear, selectedClass, selectedExam]);

  const handleApply = () => {
    setSelectedYear(tempYear);
    setSelectedClass(tempClass);
    setSelectedExam(tempExam);
    onClose();
  };

  const handleReset = () => {
    setTempYear('ALL');
    setTempClass('ALL');
    setTempExam('ALL');
    setSelectedYear('ALL');
    setSelectedClass('ALL');
    setSelectedExam('ALL');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: FontFamily.bold, color: '#171717' }}>Filter Question Papers</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Academic Year */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: FontFamily.bold, color: '#4B5563' }}>Academic Year</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {yearOptions.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: tempYear === yr ? '#F4C430' : '#E5E7EB',
                    backgroundColor: tempYear === yr ? '#FFF4C7' : '#F9FAFB',
                  }]}
                  onPress={() => setTempYear(yr)}
                >
                  <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: tempYear === yr ? '#171717' : '#6B7280' }}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Grade / Class */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: FontFamily.bold, color: '#4B5563' }}>Grade / Class</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {classOptions.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  style={[{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: tempClass === cls ? '#F4C430' : '#E5E7EB',
                    backgroundColor: tempClass === cls ? '#FFF4C7' : '#F9FAFB',
                  }]}
                  onPress={() => setTempClass(cls)}
                >
                  <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: tempClass === cls ? '#171717' : '#6B7280' }}>
                    {cls}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exam Type */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: FontFamily.bold, color: '#4B5563' }}>Exam Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {examOptions.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={[{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: tempExam === ex ? '#F4C430' : '#E5E7EB',
                    backgroundColor: tempExam === ex ? '#FFF4C7' : '#F9FAFB',
                  }]}
                  onPress={() => setTempExam(ex)}
                >
                  <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: tempExam === ex ? '#171717' : '#6B7280' }}>
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#F4C430', borderRadius: 5, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleApply}
            >
              <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' }}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 5, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleReset}
            >
              <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#64748B' }}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function UploadPYQModal({
  visible,
  userName,
  onClose,
  onSave,
  modalStyles,
  commonStyles,
}: {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onSave: (paperData: Omit<QuestionPaper, 'id' | 'downloadsCount' | 'uploadedAt' | 'uploadedBy'>) => void;
  modalStyles: any;
  commonStyles: any;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [classGrade, setClassGrade] = useState('Class 10');
  const [examType, setExamType] = useState<ExamType>('FINAL');
  const [totalMarks, setTotalMarks] = useState('80');
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileUri, setAttachedFileUri] = useState<string | null>(null);
  const [attachedFileSize, setAttachedFileSize] = useState<string | null>(null);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);

  const EXAM_TYPE_OPTIONS: ExamType[] = ['FINAL', 'MIDTERM', 'ANNUAL', 'UNIT_TEST', 'SUPPLEMENTARY'];
  const EXAM_TYPE_DISPLAY: Record<ExamType, string> = {
    FINAL: 'Final Examination',
    MIDTERM: 'Mid-Term Examination',
    ANNUAL: 'Annual Examination',
    UNIT_TEST: 'Unit Test / Periodic Test',
    SUPPLEMENTARY: 'Supplementary Examination',
  };

  useEffect(() => {
    if (visible) {
      setTitle('');
      setSubject('');
      setAcademicYear('2024-2025');
      setClassGrade('Class 10');
      setExamType('FINAL');
      setTotalMarks('80');
      setDurationMinutes('180');
      setAttachedFileName(null);
      setAttachedFileUri(null);
      setAttachedFileSize(null);
      setIsPickingFile(false);
      setIsExamDropdownOpen(false);
    }
  }, [visible]);

  const handlePickPDF = async () => {
    try {
      setIsPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachedFileName(file.name);
        setAttachedFileUri(file.uri);
        const formattedSize = file.size
          ? file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`
          : 'PDF Document';
        setAttachedFileSize(formattedSize);

        if (!title.trim() && file.name) {
          const cleanName = file.name
            .replace(/\.pdf$/i, '')
            .replace(/[_-]+/g, ' ')
            .trim();
          if (cleanName) {
            setTitle(cleanName);
          }
        }
      }
    } catch (err: any) {
      console.warn('PDF document pick error:', err);
      Alert.alert(
        'Document Attachment Notice',
        'Unable to open document picker. Please check file permissions and try again.'
      );
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleRemovePDF = () => {
    setAttachedFileName(null);
    setAttachedFileUri(null);
    setAttachedFileSize(null);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter paper title.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter subject name.');
      return;
    }

    onSave({
      title: title.trim(),
      subject: subject.trim(),
      academicYear: academicYear.trim(),
      classGrade: classGrade.trim(),
      examType: examType,
      totalMarks: parseInt(totalMarks, 10) || 100,
      durationMinutes: parseInt(durationMinutes, 10) || 180,
      fileUrl: attachedFileUri || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: attachedFileSize || (attachedFileName ? '1.5 MB' : undefined),
    });
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', maxWidth: 540 }}
        >
          <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.headerTitle}>Upload Question Paper</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ padding: 16 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Paper Title *</Text>
              <TextInput
                style={[styles.formInput, { borderRadius: 5 }]}
                placeholder="e.g. Mathematics Paper 2024-25"
                placeholderTextColor="#475569"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Subject and Class / Grade */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Subject *</Text>
                <TextInput
                  style={[styles.formInput, { borderRadius: 5 }]}
                  placeholder="e.g. Mathematics"
                  placeholderTextColor="#475569"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Class / Grade *</Text>
                <TextInput
                  style={[styles.formInput, { borderRadius: 5 }]}
                  placeholder="e.g. Class 10"
                  placeholderTextColor="#475569"
                  value={classGrade}
                  onChangeText={setClassGrade}
                />
              </View>
            </View>

            {/* Exam Type Dropdown - Dedicated & Properly Organised */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Exam Type *</Text>
              <TouchableOpacity
                style={[
                  styles.formInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 5,
                  },
                ]}
                onPress={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, color: '#171717', fontFamily: FontFamily.semibold }}>
                  {EXAM_TYPE_DISPLAY[examType] || examType}
                </Text>
                <Feather
                  name={isExamDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {isExamDropdownOpen && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginTop: 4,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  {EXAM_TYPE_OPTIONS.map((ex) => {
                    const isSelected = examType === ex;
                    return (
                      <TouchableOpacity
                        key={ex}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 11,
                          backgroundColor: isSelected ? '#FFF4C7' : '#FFFFFF',
                          borderBottomWidth: 1,
                          borderBottomColor: '#F1F5F9',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onPress={() => {
                          setExamType(ex);
                          setIsExamDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: isSelected ? FontFamily.bold : FontFamily.regular,
                            color: isSelected ? '#171717' : '#334155',
                          }}
                        >
                          {EXAM_TYPE_DISPLAY[ex] || ex}
                        </Text>
                        {isSelected && <Feather name="check" size={16} color="#D97706" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Academic Year, Total Marks & Duration */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1.2 }]}>
                <Text style={styles.formLabel}>Academic Year *</Text>
                <TextInput
                  style={[styles.formInput, { borderRadius: 5 }]}
                  placeholder="e.g. 2024-2025"
                  placeholderTextColor="#475569"
                  value={academicYear}
                  onChangeText={setAcademicYear}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Total Marks</Text>
                <TextInput
                  style={[styles.formInput, { borderRadius: 5 }]}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#475569"
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Duration (Mins)</Text>
                <TextInput
                  style={[styles.formInput, { borderRadius: 5 }]}
                  keyboardType="numeric"
                  placeholder="180"
                  placeholderTextColor="#475569"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>
            </View>

            {/* Attachment Box */}
            <View style={{ marginTop: 6, marginBottom: 16 }}>
              <Text style={styles.formLabel}>PDF Document Attachment</Text>
              {attachedFileName ? (
                <View
                  style={{
                    backgroundColor: '#F0FDF4',
                    borderWidth: 1.5,
                    borderColor: '#026440',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        backgroundColor: '#DC2626',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#0F172A' }}
                        numberOfLines={1}
                      >
                        {attachedFileName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {attachedFileSize && (
                          <Text style={{ fontSize: 11, fontFamily: FontFamily.semibold, color: '#026440' }}>
                            {attachedFileSize}
                          </Text>
                        )}
                        <Text style={{ fontSize: 11, color: '#64748B' }}>• Ready to upload</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={handlePickPDF}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8E5DC',
                        borderRadius: 5,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: '#171717' }}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleRemovePDF}
                      style={{
                        padding: 6,
                        backgroundColor: '#FEE2E2',
                        borderRadius: 5,
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="x" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FFFDF7',
                    borderWidth: 1.5,
                    borderColor: '#FEF08A',
                    borderStyle: 'dashed',
                    borderRadius: 8,
                    padding: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 6,
                    gap: 6,
                  }}
                  onPress={handlePickPDF}
                  disabled={isPickingFile}
                  activeOpacity={0.75}
                >
                  {isPickingFile ? (
                    <ActivityIndicator size="small" color="#D97706" />
                  ) : (
                    <MaterialCommunityIcons name="cloud-upload-outline" size={30} color="#D97706" />
                  )}
                  <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' }}>
                    {isPickingFile ? 'Opening Document Picker...' : 'Tap to Browse & Attach PDF Document'}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280' }}>
                    Select question paper PDF file from your device (up to 25MB)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#026440', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Upload to Archive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function PDFPreviewModal({
  visible,
  paper,
  onClose,
  onDownload,
}: {
  visible: boolean;
  paper: QuestionPaper | null;
  onClose: () => void;
  onDownload: (paperId: string) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = 4;

  if (!paper) return null;

  const handleDownload = async () => {
    onDownload(paper.id);
    if (paper.fileUrl && (paper.fileUrl.startsWith('http://') || paper.fileUrl.startsWith('https://'))) {
      try {
        const canOpen = await Linking.canOpenURL(paper.fileUrl);
        if (canOpen) {
          await Linking.openURL(paper.fileUrl);
          return;
        }
      } catch (_e) { }
    }
    Alert.alert('Downloading Document', `Downloading "${paper.title}.pdf" to your device storage.`);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
        <View style={{ width: '100%', maxWidth: 850, height: '92%', backgroundColor: '#1E293B', borderRadius: 12, overflow: 'hidden' }}>
          {/* PDF Toolbar Header */}
          <View style={{ height: 54, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#F8FAFC' }} numberOfLines={1}>
                  {paper.title}
                </Text>
                <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                  {paper.subject} • {paper.academicYear} • {paper.examType}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Page Nav */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <TouchableOpacity onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <Feather name="chevron-left" size={16} color={page === 1 ? '#475569' : '#F8FAFC'} />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F8FAFC' }}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <Feather name="chevron-right" size={16} color={page === totalPages ? '#475569' : '#F8FAFC'} />
                </TouchableOpacity>
              </View>

              {/* Download button */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                onPress={handleDownload}
              >
                <Feather name="download" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Download</Text>
              </TouchableOpacity>

              {/* Close button */}
              <TouchableOpacity style={{ padding: 4 }} onPress={onClose}>
                <Feather name="x" size={20} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
          </View>

          {/* PDF Viewport */}
          <ScrollView style={{ flex: 1, backgroundColor: '#334155', padding: 20 }} contentContainerStyle={{ alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 650, backgroundColor: '#FFFFFF', borderRadius: 4, padding: 32, elevation: 5, gap: 16 }}>
              {/* Simulated Exam Header */}
              <View style={{ alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1E293B', paddingBottom: 16, gap: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 1 }}>
                  KIVQUO ACADEMIC SYSTEM
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#334155' }}>
                  {paper.examType} EXAMINATION — {paper.academicYear}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}>
                  SUBJECT: {paper.subject.toUpperCase()} ({(paper.classGrade || '').toUpperCase()})
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Time Allowed: {paper.durationMinutes} Minutes</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Maximum Marks: {paper.totalMarks}</Text>
                </View>
              </View>

              {/* Simulated Questions Body */}
              <View style={{ gap: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>General Instructions:</Text>
                <Text style={{ fontSize: 11, color: '#334155', lineHeight: 16 }}>
                  1. All questions are compulsory unless internal choice is provided.{'\n'}
                  2. Section A consists of 10 Multiple Choice Questions carrying 1 mark each.{'\n'}
                  3. Use of electronic calculators or smart watches is strictly prohibited.{'\n'}
                  4. Write your admission number clearly on the top right corner of the answer script.
                </Text>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                <Text style={{ fontSize: 13, fontWeight: '900', color: '#2563EB', marginTop: 4 }}>
                  SECTION A (20 MARKS)
                </Text>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', lineHeight: 16 }}>
                    Q1. Solve the quadratic equation x² - 5x + 6 = 0 and determine the sum and product of its roots.
                  </Text>
                  <Text style={{ fontSize: 10, color: '#475569', paddingLeft: 16 }}>
                    (a) roots: (2, 3), sum = 5, product = 6{'\n'}
                    (b) roots: (-2, -3), sum = -5, product = 6{'\n'}
                    (c) roots: (1, 6), sum = 7, product = 6{'\n'}
                    (d) roots: (0, 6), sum = 6, product = 0
                  </Text>
                </View>

                <View style={{ gap: 10, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', lineHeight: 16 }}>
                    Q2. Explain the fundamental theorem of arithmetic and illustrate with prime factorization of 5040.
                  </Text>
                </View>

                {/* Page Footer */}
                <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#94A3B8' }}>Archived in KIVQUO ERP PYQ Vault • Document Ref: {paper.id}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569' }}>Page {page} of {totalPages}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pyqStyles = StyleSheet.create({
  headerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F3E8C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: 96,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    gap: 2,
    overflow: 'hidden',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4,
  },
  kpiIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiLabel: {
    flex: 1,
    flexShrink: 1,
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#6B6B6B',
    lineHeight: 13,
  },
  kpiValue: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    marginVertical: 1,
  },
  kpiSub: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: '#8A8A8E',
    lineHeight: 12,
  },
  pyqCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  pyqTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    lineHeight: 22,
    marginTop: 2,
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  subjectBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#1E40AF',
  },
  examBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  examBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#121316',
  },
  classBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  metaText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
});
