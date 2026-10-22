import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { InlineSearchDropdown } from './common/InlineSearchDropdown';
import { FontFamily } from '../../../constants/fonts';
import {
  createHomeworkApi,
  updateHomeworkApi,
  fetchMyHomeworkApi,
  fetchClassSectionsApi,
  fetchClassSubjectsApi,
  deleteHomeworkApi,
} from '../../../api/academics';
import { TeacherHomeworkSkeleton } from './skeletons';

export interface ReferenceImageItem {
  id: string;
  uri: string;
  name: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classSectionId: string;
  dueDate: string;
  priority?: string;
  status: string;
  createdAt: string;
  referenceImages?: ReferenceImageItem[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const FALLBACK_CLASSES = [
  { id: 'cls-6a', name: 'Class 6-A' },
  { id: 'cls-7a', name: 'Class 7-A' },
  { id: 'cls-8a', name: 'Class 8-A' },
  { id: 'cls-9a', name: 'Class 9-A' },
  { id: 'cls-10a', name: 'Class 10-A' },
];

const FALLBACK_SUBJECTS = [
  { id: 'sub-math', name: 'Mathematics' },
  { id: 'sub-sci', name: 'Science' },
  { id: 'sub-eng', name: 'English' },
  { id: 'sub-soc', name: 'Social Science' },
  { id: 'sub-cs', name: 'Computer Science' },
];

export const TeacherHomeworkView: React.FC = () => {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [classes, setClasses] = useState<any[]>(FALLBACK_CLASSES);
  const [subjects, setSubjects] = useState<any[]>(FALLBACK_SUBJECTS);

  // Create/Edit modal state
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Multi Reference Images state
  const [referenceImages, setReferenceImages] = useState<ReferenceImageItem[]>([]);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  // Due Date Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  const formattedDueDate = useMemo(() => {
    if (!dueDate) return '';
    const parts = dueDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${MONTH_SHORT[m] || ''} ${y}`;
    }
    return dueDate;
  }, [dueDate]);

  // Calendar Days Computation
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells: { day: number; currentMonth: boolean; dateStr: string }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const mm = String(prevM + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, currentMonth: false, dateStr: `${prevY}-${mm}-${dd}` });
    }

    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, currentMonth: true, dateStr: `${year}-${mm}-${dd}` });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        const mm = String(nextM + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        cells.push({ day: d, currentMonth: false, dateStr: `${nextY}-${mm}-${dd}` });
      }
    }

    return cells;
  }, [calendarViewDate]);

  const shiftCalendarMonth = (delta: number) => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + delta);
      return d;
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const [hwRes, clsRes] = await Promise.allSettled([
        fetchMyHomeworkApi(),
        fetchClassSectionsApi(),
      ]);
      if (hwRes.status === 'fulfilled' && Array.isArray(hwRes.value)) {
        setHomework(hwRes.value);
      }
      if (clsRes.status === 'fulfilled' && Array.isArray(clsRes.value) && clsRes.value.length > 0) {
        setClasses(clsRes.value);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const loadSubjects = async (classSectionId: string) => {
    setSelectedClass(classSectionId);
    setSelectedSubject('');
    try {
      const res = await fetchClassSubjectsApi(classSectionId);
      if (Array.isArray(res) && res.length > 0) {
        setSubjects(res);
      } else {
        setSubjects(FALLBACK_SUBJECTS);
      }
    } catch {
      setSubjects(FALLBACK_SUBJECTS);
    }
  };

  const handleEdit = (hw: HomeworkItem) => {
    setEditingHomeworkId(hw.id);
    setTitle(hw.title || '');
    setDescription(hw.description || '');
    setSelectedClass(hw.classSectionId || '');
    if (hw.classSectionId) {
      loadSubjects(hw.classSectionId);
    }
    setSelectedSubject(hw.subjectId || '');
    setDueDate(hw.dueDate || '');
    setReferenceImages(hw.referenceImages || []);
    setIsCreateClassOpen(false);
    setIsCreateSubjectOpen(false);
    setIsCalendarOpen(false);
    setShowCreate(true);
  };

  const handleOpenCreate = () => {
    setEditingHomeworkId(null);
    setTitle('');
    setDescription('');
    setSelectedClass('');
    setSelectedSubject('');
    setDueDate('');
    setReferenceImages([]);
    setIsCreateClassOpen(false);
    setIsCreateSubjectOpen(false);
    setIsCalendarOpen(false);
    setShowCreate(true);
  };

  // Multiple reference images picker
  const handlePickMultipleImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const newImgs: ReferenceImageItem[] = res.assets.map((a, idx) => ({
          id: `hw-ref-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          uri: a.uri,
          name: a.fileName || `Image ${referenceImages.length + idx + 1}.jpg`,
        }));
        setReferenceImages((prev) => [...prev, ...newImgs]);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not pick images');
    }
  };

  const handleCaptureCameraImage = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        const newImg: ReferenceImageItem = {
          id: `hw-cam-${Date.now()}`,
          uri: a.uri,
          name: a.fileName || `Photo ${referenceImages.length + 1}.jpg`,
        };
        setReferenceImages((prev) => [...prev, newImg]);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not capture photo');
    }
  };

  const handleDeleteReferenceImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSaveHomework = async () => {
    if (!selectedClass || !selectedSubject || !title.trim() || !dueDate.trim()) {
      Alert.alert('Incomplete Fields', 'Please select class, subject, and enter title and due date.');
      return;
    }
    setCreating(true);
    try {
      if (editingHomeworkId) {
        await updateHomeworkApi(editingHomeworkId, {
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate.trim(),
        });
        setHomework((prev) =>
          prev.map((h) =>
            h.id === editingHomeworkId
              ? {
                  ...h,
                  title: title.trim(),
                  description: description.trim(),
                  dueDate: dueDate.trim(),
                  classSectionId: selectedClass,
                  subjectId: selectedSubject,
                  referenceImages: [...referenceImages],
                }
              : h
          )
        );
      } else {
        const res = await createHomeworkApi({
          classSectionId: selectedClass,
          subjectId: selectedSubject,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate.trim(),
          priority: 'normal',
        });
        if (res) {
          const newItem: HomeworkItem = {
            id: res.id || `hw-${Date.now()}`,
            title: title.trim(),
            description: description.trim(),
            dueDate: dueDate.trim(),
            classSectionId: selectedClass,
            subjectId: selectedSubject,
            priority: 'normal',
            status: 'active',
            createdAt: new Date().toISOString(),
            referenceImages: [...referenceImages],
          };
          setHomework((prev) => [newItem, ...prev]);
        }
      }
      setShowCreate(false);
      setEditingHomeworkId(null);
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedClass('');
      setSelectedSubject('');
      setReferenceImages([]);
      setIsCreateClassOpen(false);
      setIsCreateSubjectOpen(false);
      setIsCalendarOpen(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save homework');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Homework', 'Are you sure you want to remove this homework assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHomeworkApi(id);
            fetchData();
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Homework List */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <TeacherHomeworkSkeleton />
        ) : homework.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="book-plus-outline" size={44} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Homework Found</Text>
            <Text style={styles.emptySub}>
              Tap "New" to assign homework to your classes.
            </Text>
          </View>
        ) : (
          homework.map((hw) => (
            <View key={hw.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {hw.title}
                </Text>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity onPress={() => handleEdit(hw)} hitSlop={8} style={styles.actionIconBtn}>
                    <Feather name="edit-2" size={15} color="#171717" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(hw.id)} hitSlop={8} style={styles.actionIconBtn}>
                    <Feather name="trash-2" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>

              {hw.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {hw.description}
                </Text>
              ) : null}

              <View style={styles.cardMeta}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>Due: {hw.dueDate}</Text>
                </View>
                {hw.referenceImages && hw.referenceImages.length > 0 && (
                  <View style={styles.cardImageBadge}>
                    <MaterialCommunityIcons name="image-multiple" size={12} color="#0284C7" />
                    <Text style={styles.cardImageBadgeText}>
                      {hw.referenceImages.length} {hw.referenceImages.length === 1 ? 'image' : 'images'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 3. Homework Modal (Supports both Add and Edit with Keyboard Scrolling) */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreate(false);
          setEditingHomeworkId(null);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreate(false);
                  setEditingHomeworkId(null);
                }}
                style={styles.closeBtn}
              >
                <Feather name="x" size={18} color="#171717" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingHomeworkId ? 'Edit Homework' : 'Homework'}</Text>
              <TouchableOpacity
                onPress={handleSaveHomework}
                disabled={creating}
                style={styles.saveBtn}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveBtnText, creating && { opacity: 0.5 }]}>
                  {creating ? (editingHomeworkId ? 'Updating...' : 'Saving...') : (editingHomeworkId ? 'Update' : 'Save')}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets={true}
            >
              {/* Class Dropdown - Single Search with Dropdown */}
              <View style={styles.fieldBlock}>
                <InlineSearchDropdown
                  label="Class *"
                  placeholder="Search or select class..."
                  selectedValue={classes.find((c) => c.id === selectedClass)?.name || ''}
                  options={classes.map((c) => ({
                    label: c.name,
                    value: c.id,
                    subtext: 'Classroom',
                    badge: selectedClass === c.id ? 'Selected' : undefined,
                    badgeColor: '#0284C7',
                  }))}
                  isOpen={isCreateClassOpen}
                  onToggle={() => {
                    setIsCreateClassOpen(!isCreateClassOpen);
                    setIsCreateSubjectOpen(false);
                    setIsCalendarOpen(false);
                  }}
                  onSelect={(val) => {
                    loadSubjects(val);
                    setIsCreateClassOpen(false);
                  }}
                  iconName="school"
                  iconType="material"
                />
              </View>

              {/* Subject Dropdown - Single Search with Dropdown */}
              {selectedClass ? (
                <View style={styles.fieldBlock}>
                  <InlineSearchDropdown
                    label="Subject *"
                    placeholder="Search or select subject..."
                    selectedValue={subjects.find((s) => s.id === selectedSubject)?.name || ''}
                    options={subjects.map((s) => ({
                      label: s.name,
                      value: s.id,
                      subtext: 'Curriculum',
                      badge: selectedSubject === s.id ? 'Selected' : undefined,
                      badgeColor: '#0284C7',
                    }))}
                    isOpen={isCreateSubjectOpen}
                    onToggle={() => {
                      setIsCreateSubjectOpen(!isCreateSubjectOpen);
                      setIsCreateClassOpen(false);
                      setIsCalendarOpen(false);
                    }}
                    onSelect={(val) => {
                      setSelectedSubject(val);
                      setIsCreateSubjectOpen(false);
                    }}
                    iconName="book-open-page-variant"
                    iconType="material"
                  />
                </View>
              ) : null}

            {/* Title */}
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Homework title"
              placeholderTextColor="#9CA3AF"
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Optional description"
              placeholderTextColor="#9CA3AF"
            />

            {/* Due Date with Calendar (without YYYY-MM-DD text) */}
            <Text style={styles.label}>Due Date *</Text>
            <TouchableOpacity
              style={[styles.dropdownBox, isCalendarOpen && styles.dropdownBoxActive]}
              onPress={() => {
                if (dueDate) {
                  const parts = dueDate.split('-').map(Number);
                  if (parts.length === 3) {
                    setCalendarViewDate(new Date(parts[0], parts[1] - 1, parts[2]));
                  }
                }
                setIsCalendarOpen(!isCalendarOpen);
                setIsCreateClassOpen(false);
                setIsCreateSubjectOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownBoxVal,
                  !dueDate && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {formattedDueDate || 'Select Due Date'}
              </Text>
              <Feather
                name={isCalendarOpen ? 'chevron-up' : 'calendar'}
                size={15}
                color={isCalendarOpen ? '#0284C7' : '#4B5563'}
              />
            </TouchableOpacity>

            {/* Inline Calendar for Due Date */}
            {isCalendarOpen && (
              <View style={styles.inlineCalendarCard}>
                <View style={styles.calendarHeaderRow}>
                  <Text style={styles.calendarHeaderTitle}>Select Due Date</Text>
                  <TouchableOpacity onPress={() => setIsCalendarOpen(false)} hitSlop={8}>
                    <Feather name="chevron-up" size={17} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Month Navigation */}
                <View style={styles.calendarNavRow}>
                  <TouchableOpacity
                    style={styles.calNavBtn}
                    onPress={() => shiftCalendarMonth(-1)}
                    hitSlop={8}
                  >
                    <Feather name="chevron-left" size={17} color="#1F2937" />
                  </TouchableOpacity>
                  <Text style={styles.calMonthTitle}>
                    {MONTH_NAMES[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                  </Text>
                  <TouchableOpacity
                    style={styles.calNavBtn}
                    onPress={() => shiftCalendarMonth(1)}
                    hitSlop={8}
                  >
                    <Feather name="chevron-right" size={17} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                {/* Day of Week Labels */}
                <View style={styles.calWeekRow}>
                  {WEEK_DAYS.map((wd) => (
                    <Text key={wd} style={styles.calWeekText}>
                      {wd}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calGrid}>
                  {calendarDays.map((cell, idx) => {
                    const isSelected = dueDate === cell.dateStr;
                    return (
                      <TouchableOpacity
                        key={`${cell.dateStr}-${idx}`}
                        style={[
                          styles.calCell,
                          isSelected && styles.calCellSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setDueDate(cell.dateStr);
                          setIsCalendarOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.calCellText,
                            !cell.currentMonth && styles.calCellTextDim,
                            isSelected && styles.calCellTextSelected,
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quick Today & Close Footer */}
                <View style={styles.calFooter}>
                  <TouchableOpacity
                    style={styles.calTodayBtn}
                    onPress={() => {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      setDueDate(`${yyyy}-${mm}-${dd}`);
                      setIsCalendarOpen(false);
                    }}
                  >
                    <Text style={styles.calTodayText}>Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.calCloseBtn}
                    onPress={() => setIsCalendarOpen(false)}
                  >
                    <Text style={styles.calCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reference Images Section */}
            <View style={styles.refSectionHeader}>
              <View style={styles.refTitleRow}>
                <Text style={styles.label}>Reference Images</Text>
                {referenceImages.length > 0 && (
                  <View style={styles.refCountBadge}>
                    <Text style={styles.refCountText}>{referenceImages.length}</Text>
                  </View>
                )}
              </View>
              <View style={styles.refActionButtons}>
                <TouchableOpacity
                  style={styles.addImagesBtn}
                  onPress={handlePickMultipleImages}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={13} color="#FFFFFF" />
                  <Text style={styles.addImagesBtnText}>Import Images</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleCaptureCameraImage}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={14} color="#1E293B" />
                </TouchableOpacity>
              </View>
            </View>

            {referenceImages.length === 0 ? (
              <TouchableOpacity
                style={styles.refUploadBox}
                onPress={handlePickMultipleImages}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="image-multiple-outline" size={26} color="#0284C7" />
                <Text style={styles.refUploadTitle}>Attach Multiple Reference Images</Text>
                <Text style={styles.refUploadSub}>
                  Upload question sheets, problem diagrams, or rubrics
                </Text>
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.refThumbList}
              >
                {referenceImages.map((img) => (
                  <View key={img.id} style={styles.refThumbWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setPreviewImageUri(img.uri)}
                    >
                      <Image source={{ uri: img.uri }} style={styles.refThumbImage} />
                      <View style={styles.refZoomBadge}>
                        <Feather name="maximize-2" size={10} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.refRemoveBtn}
                      hitSlop={8}
                      onPress={() => handleDeleteReferenceImage(img.id)}
                    >
                      <Feather name="x" size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.refThumbLabel} numberOfLines={1}>
                      {img.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-screen Reference Image Preview Modal */}
      <Modal
        visible={!!previewImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.previewBackdrop}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewImageUri(null)}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.previewFullImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 110,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBtn: {
    padding: 3,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  fieldBlock: {
    marginBottom: 6,
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F4C430',
    borderRadius: 5,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalBody: {
    padding: 20,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#374151',
    marginTop: 6,
    marginBottom: 2,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 42,
  },
  dropdownBoxActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  dropdownBoxVal: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  placeholderText: {
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
  },
  dropdownWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },

  // Inline Calendar Card
  inlineCalendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 6,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarHeaderTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  calendarNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  calWeekText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#94A3B8',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  calCell: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  calCellSelected: {
    backgroundColor: '#0284C7',
  },
  calCellText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
  },
  calCellTextDim: {
    color: '#CBD5E1',
  },
  calCellTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  calFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  calTodayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  calTodayText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  calCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  calCloseText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },

  // Card Image Badge
  cardImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cardImageBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },

  // Reference Images Section Styles
  refSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  refTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refCountBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  refCountText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  refActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addImagesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
  },
  addImagesBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  cameraBtn: {
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  refUploadBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  refUploadTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginTop: 4,
  },
  refUploadSub: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
  },
  refThumbList: {
    gap: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  refThumbWrapper: {
    width: 76,
    alignItems: 'center',
    position: 'relative',
  },
  refThumbImage: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  refZoomBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 3,
    padding: 2,
  },
  refRemoveBtn: {
    position: 'absolute',
    top: -4,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refThumbLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    width: 72,
  },

  // Full-screen Image Preview Modal
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFullImage: {
    width: '100%',
    height: '75%',
    borderRadius: 8,
  },
});
