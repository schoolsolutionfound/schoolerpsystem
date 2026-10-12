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
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { QuestionPaper, ExamType } from '../../types';

interface PYQsViewProps {
  questionPapers: QuestionPaper[];
  onUploadPYQ: () => void;
  onPreviewPYQ: (paper: QuestionPaper) => void;
  onDeletePYQ: (pyqId: string) => void;
  commonStyles: any;
  fineStyles: any;
}

export function PYQsView({ questionPapers, onUploadPYQ, onPreviewPYQ, onDeletePYQ, commonStyles, fineStyles }: PYQsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedExam, setSelectedExam] = useState('ALL');

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
    <ScrollView style={styles.viewBodyContainer} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Past Year Question Papers Archive</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>
            Store, categorize, preview and manage examination papers across all subjects and grades
          </Text>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 }]} onPress={onUploadPYQ}>
          <Feather name="upload" size={16} color="#121316" />
          <Text style={styles.primaryBtnText}>Upload New PYQ</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={[fineStyles.kpiGrid, { marginBottom: 18 }]}>
        <View style={[fineStyles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <MaterialCommunityIcons name="file-document-multiple" size={24} color="#2563EB" />
          <Text style={[fineStyles.kpiLabel, { color: '#1E40AF' }]}>Archived Papers</Text>
          <Text style={[fineStyles.kpiValue, { color: '#1E3A8A' }]}>{questionPapers.length}</Text>
          <Text style={fineStyles.kpiSub}>Question paper records</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Feather name="download" size={24} color="#166534" />
          <Text style={[fineStyles.kpiLabel, { color: '#166534' }]}>Total Downloads</Text>
          <Text style={[fineStyles.kpiValue, { color: '#14532D' }]}>{totalDownloads}</Text>
          <Text style={fineStyles.kpiSub}>Student & teacher downloads</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#D97706" />
          <Text style={[fineStyles.kpiLabel, { color: '#B45309' }]}>Subjects Covered</Text>
          <Text style={[fineStyles.kpiValue, { color: '#78350F' }]}>{uniqueSubjects}</Text>
          <Text style={fineStyles.kpiSub}>Across all grade levels</Text>
        </View>
      </View>

      {/* Search and Filters Box */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, gap: 12 }}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, subject or uploader..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Rows */}
        <View style={{ gap: 10 }}>
          {/* Year Chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', width: 90 }}>Academic Year:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {yearOptions.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.chip, selectedYear === yr && styles.chipActive]}
                  onPress={() => setSelectedYear(yr)}
                >
                  <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Class Chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', width: 90 }}>Grade / Class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {classOptions.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  style={[styles.chip, selectedClass === cls && styles.chipActive]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exam Type Chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', width: 90 }}>Exam Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {examOptions.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={[styles.chip, selectedExam === ex && styles.chipActive]}
                  onPress={() => setSelectedExam(ex)}
                >
                  <Text style={[styles.chipText, selectedExam === ex && styles.chipTextActive]}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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

              {/* Action Buttons Footer */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 4 }}>
                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', flex: 1, justifyContent: 'center' }]}
                  onPress={() => onPreviewPYQ(paper)}
                >
                  <MaterialCommunityIcons name="eye-outline" size={16} color="#2563EB" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#2563EB' }]}>Preview PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#FDE047', backgroundColor: '#FEF08A', flex: 1, justifyContent: 'center' }]}
                  onPress={() => onPreviewPYQ(paper)}
                >
                  <MaterialCommunityIcons name="download-outline" size={16} color="#121316" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#121316' }]}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#FECACA', backgroundColor: '#FEF2F2', paddingHorizontal: 12 }]}
                  onPress={() => onDeletePYQ(paper.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
    }
  }, [visible]);

  const handlePickPDF = () => {
    setAttachedFileName(`${subject ? subject.toLowerCase().replace(/\s+/g, '_') : 'question_paper'}_${academicYear}_${examType.toLowerCase()}.pdf`);
    Alert.alert('File Attached', 'PDF document selected successfully for PYQ archive upload.');
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
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    });
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.headerTitle}>Upload Past Year Question Paper</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>Add new PYQ entry to the digital library repository</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Paper Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Mathematics Final Term Examination Paper 2024-2025"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Subject *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mathematics, Physics, English"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Academic Year *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 2024-2025"
                  value={academicYear}
                  onChangeText={setAcademicYear}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Class / Grade *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Class 10"
                  value={classGrade}
                  onChangeText={setClassGrade}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Exam Type</Text>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {(['FINAL', 'MIDTERM', 'ANNUAL', 'UNIT_TEST'] as ExamType[]).map((ex) => (
                    <TouchableOpacity
                      key={ex}
                      style={[
                        styles.chip,
                        { paddingHorizontal: 8, paddingVertical: 4 },
                        examType === ex && styles.chipActive,
                      ]}
                      onPress={() => setExamType(ex)}
                    >
                      <Text style={[styles.chipText, { fontSize: 10 }, examType === ex && styles.chipTextActive]}>
                        {ex}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Total Marks</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Duration (Minutes)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>
            </View>

            {/* Attachment Box */}
            <View style={{ marginTop: 6, marginBottom: 16 }}>
              <Text style={styles.formLabel}>PDF Document Attachment</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFDF7',
                  borderWidth: 1.5,
                  borderColor: attachedFileName ? '#86EFAC' : '#FEF08A',
                  borderStyle: 'dashed',
                  borderRadius: 10,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 6,
                  gap: 6,
                }}
                onPress={handlePickPDF}
              >
                <MaterialCommunityIcons
                  name={attachedFileName ? 'file-pdf-box' : 'cloud-upload-outline'}
                  size={32}
                  color={attachedFileName ? '#059669' : '#EAB308'}
                />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>
                  {attachedFileName ? attachedFileName : 'Tap to Upload PDF Document'}
                </Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>
                  {attachedFileName ? 'File ready for archival' : 'Supports .pdf files up to 25MB'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginBottom: 20 }]} onPress={handleSubmit}>
              <Text style={styles.primaryBtnText}>Save to PYQ Archive</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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

  const handleDownload = () => {
    onDownload(paper.id);
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
  pyqCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  pyqTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 22,
    marginTop: 2,
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  examBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  examBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#121316',
  },
  classBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
