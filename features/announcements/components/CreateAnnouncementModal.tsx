import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { AppModal } from '../../shared/components/AppModal';
import { AppButton } from '../../shared/components/AppButton';
import { AppInput } from '../../shared/components/AppInput';
import { Announcement } from '../types';
import { Colors } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface CreateAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  initialData?: Announcement | null;
  loading?: boolean;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFutureDateStr = (daysAhead: number, fromDateStr?: string): string => {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  const validBase = isNaN(base.getTime()) ? new Date() : base;
  validBase.setDate(validBase.getDate() + daysAhead);
  const year = validBase.getFullYear();
  const month = String(validBase.getMonth() + 1).padStart(2, '0');
  const day = String(validBase.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatToDateInputStr = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatInputToIsoString = (inputStr: string, isEndOfDay: boolean = false): string | null => {
  if (!inputStr || !inputStr.trim()) return null;
  const trimmed = inputStr.trim();
  if (trimmed.endsWith('Z')) return trimmed;

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = match[4] !== undefined ? Number(match[4]) : (isEndOfDay ? 23 : 0);
    const minute = match[5] !== undefined ? Number(match[5]) : (isEndOfDay ? 59 : 0);
    const localDate = new Date(year, month - 1, day, hour, minute);
    if (isNaN(localDate.getTime())) return null;
    return localDate.toISOString();
  }

  const fallbackDate = new Date(trimmed);
  if (isNaN(fallbackDate.getTime())) return null;
  return fallbackDate.toISOString();
};

interface MiniCalendarProps {
  title: string;
  currentDateStr: string;
  minDateStr?: string;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const MiniCalendarPicker: React.FC<MiniCalendarProps> = ({
  title,
  currentDateStr,
  minDateStr,
  onSelectDate,
  onClose,
}) => {
  const initialDate = useMemo(() => {
    if (currentDateStr) {
      const d = new Date(currentDateStr);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [currentDateStr]);

  const [calMonth, setCalMonth] = useState(initialDate.getMonth());
  const [calYear, setCalYear] = useState(initialDate.getFullYear());

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const daysArray = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      arr.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(i);
    }
    return arr;
  }, [calYear, calMonth, daysInMonth, startDayOfWeek]);

  const todayStr = getTodayDateStr();

  return (
    <View style={calStyles.card}>
      <View style={calStyles.header}>
        <Text style={calStyles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={calStyles.navRow}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Feather name="chevron-left" size={16} color="#171717" />
        </TouchableOpacity>
        <Text style={calStyles.monthYearText}>
          {MONTH_NAMES[calMonth]} {calYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Feather name="chevron-right" size={16} color="#171717" />
        </TouchableOpacity>
      </View>

      {/* Weekdays row */}
      <View style={calStyles.weekdaysRow}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={calStyles.weekdayText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid of days */}
      <View style={calStyles.daysGrid}>
        {daysArray.map((day, idx) => {
          if (day === null) {
            return <View key={`blank-${idx}`} style={calStyles.dayCellEmpty} />;
          }

          const mm = String(calMonth + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const cellDateStr = `${calYear}-${mm}-${dd}`;
          const isSelected = cellDateStr === currentDateStr;
          const isToday = cellDateStr === todayStr;
          const isDisabled = minDateStr ? cellDateStr < minDateStr : false;

          return (
            <TouchableOpacity
              key={cellDateStr}
              style={[
                calStyles.dayCell,
                isSelected && calStyles.dayCellSelected,
                isToday && !isSelected && calStyles.dayCellToday,
                isDisabled && { opacity: 0.3 },
              ]}
              disabled={isDisabled}
              onPress={() => onSelectDate(cellDateStr)}
            >
              <Text
                style={[
                  calStyles.dayCellText,
                  isSelected && calStyles.dayCellTextSelected,
                  isToday && !isSelected && calStyles.dayCellTextToday,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);

  // Calendar & presets states
  const [openCalendar, setOpenCalendar] = useState<'START' | 'END' | null>(null);
  const [presets, setPresets] = useState<{ label: string; days: number }[]>([
    { label: '3 Days', days: 3 },
    { label: '1 Week (7 Days)', days: 7 },
    { label: '2 Weeks (14 Days)', days: 14 },
    { label: '1 Month (30 Days)', days: 30 },
    { label: '3 Months (90 Days)', days: 90 },
  ]);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>('1 Week (7 Days)');
  const [customDaysText, setCustomDaysText] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setPublishAt(formatToDateInputStr(initialData.publishAt || initialData.createdAt));
      setExpiresAt(formatToDateInputStr(initialData.expiresAt));
      setOpenCalendar(null);
      setIsPresetDropdownOpen(false);
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    const today = getTodayDateStr();
    setPublishAt(today);
    setExpiresAt(getFutureDateStr(7, today));
    setSelectedPresetLabel('1 Week (7 Days)');
    setOpenCalendar(null);
    setIsPresetDropdownOpen(false);
    setCustomDaysText('');
    setIsSubmitting(false);
    isSubmittingRef.current = false;
  };

  const handleApplyPreset = (days: number) => {
    const start = publishAt && publishAt.trim() ? publishAt : getTodayDateStr();
    if (!publishAt || !publishAt.trim()) {
      setPublishAt(start);
    }
    setExpiresAt(getFutureDateStr(days, start));
  };

  const handleAddCustomPreset = () => {
    const num = parseInt(customDaysText.trim(), 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Days', 'Please enter a valid number of days (e.g. 5, 10, 45).');
      return;
    }

    const newLabel = `${num} Days`;
    if (!presets.some((p) => p.days === num)) {
      setPresets((prev) => [...prev, { label: newLabel, days: num }]);
    }
    handleApplyPreset(num);
    setSelectedPresetLabel(newLabel);
    setCustomDaysText('');
    setIsPresetDropdownOpen(false);
    Alert.alert('Preset Applied', `Time period set to ${num} days from start date.`);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an announcement title.');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Required Field', 'Please enter the announcement content.');
      return false;
    }

    if (publishAt && expiresAt) {
      const pubDate = new Date(publishAt);
      const expDate = new Date(expiresAt);
      if (!isNaN(pubDate.getTime()) && !isNaN(expDate.getTime())) {
        if (expDate.getTime() < pubDate.getTime()) {
          Alert.alert('Validation Error', 'Expiry / End Date cannot be earlier than the Start Date.');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting || loading) return;
    if (!validateForm()) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type: 'GENERAL',
        priority: 'NORMAL',
        action: 'publish',
        publishAt: formatInputToIsoString(publishAt, false) || new Date().toISOString(),
        expiresAt: formatInputToIsoString(expiresAt, true) || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const isBusy = isSubmitting || loading;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Edit Announcement' : 'Add Announcement'}
    >
      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <AppInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Library Book Return Notice"
          editable={!isBusy}
        />

        {/* Content / Announcement */}
        <AppInput
          label="Announcement *"
          value={content}
          onChangeText={setContent}
          placeholder="Enter announcement details..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
          editable={!isBusy}
        />

        {/* Time Period Section */}
        <View style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#171717" />
            <Text style={styles.periodTitle}>Time Period</Text>
          </View>
          <Text style={styles.periodSubtitle}>
            Specify when this announcement starts and expires.
          </Text>

          {/* Date Row with Calendar Pickers */}
          <View style={styles.dateRow}>
            {/* Start Date */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Start Date (From) *</Text>
              <TouchableOpacity
                style={[
                  styles.dateInputWrapper,
                  openCalendar === 'START' && styles.dateInputWrapperActive,
                ]}
                onPress={() => setOpenCalendar(openCalendar === 'START' ? null : 'START')}
                activeOpacity={0.8}
                disabled={isBusy}
              >
                <Text style={[styles.dateText, !publishAt && styles.placeholderText]}>
                  {publishAt || 'YYYY-MM-DD'}
                </Text>
                <Feather
                  name="calendar"
                  size={16}
                  color={openCalendar === 'START' ? '#D97706' : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            {/* End Date */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>End Date (To) *</Text>
              <TouchableOpacity
                style={[
                  styles.dateInputWrapper,
                  openCalendar === 'END' && styles.dateInputWrapperActive,
                ]}
                onPress={() => setOpenCalendar(openCalendar === 'END' ? null : 'END')}
                activeOpacity={0.8}
                disabled={isBusy}
              >
                <Text style={[styles.dateText, !expiresAt && styles.placeholderText]}>
                  {expiresAt || 'YYYY-MM-DD'}
                </Text>
                <Feather
                  name="calendar"
                  size={16}
                  color={openCalendar === 'END' ? '#D97706' : '#64748B'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Calendar Picker for Start Date */}
          {openCalendar === 'START' && (
            <MiniCalendarPicker
              title="Select Start Date (From)"
              currentDateStr={publishAt}
              onSelectDate={(dateStr) => {
                setPublishAt(dateStr);
                if (expiresAt && expiresAt < dateStr) {
                  setExpiresAt(getFutureDateStr(7, dateStr));
                }
                setOpenCalendar(null);
              }}
              onClose={() => setOpenCalendar(null)}
            />
          )}

          {/* Date Calendar Picker for End Date */}
          {openCalendar === 'END' && (
            <MiniCalendarPicker
              title="Select End Date (To)"
              currentDateStr={expiresAt}
              minDateStr={publishAt}
              onSelectDate={(dateStr) => {
                setExpiresAt(dateStr);
                setOpenCalendar(null);
              }}
              onClose={() => setOpenCalendar(null)}
            />
          )}

          {/* Quick Presets Dropdown */}
          <View style={{ marginTop: 6 }}>
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <TouchableOpacity
              style={styles.presetDropdownTrigger}
              onPress={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
              activeOpacity={0.8}
              disabled={isBusy}
            >
              <Text style={styles.presetDropdownTriggerText}>
                {selectedPresetLabel || 'Select Quick Preset...'}
              </Text>
              <Feather
                name={isPresetDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#64748B"
              />
            </TouchableOpacity>

            {isPresetDropdownOpen && (
              <View style={styles.presetDropdownMenu}>
                {presets.map((p) => {
                  const isSelected = selectedPresetLabel === p.label;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetDropdownItem,
                        isSelected && { backgroundColor: '#FFF4C7' },
                      ]}
                      onPress={() => {
                        handleApplyPreset(p.days);
                        setSelectedPresetLabel(p.label);
                        setIsPresetDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.presetDropdownItemText,
                          isSelected && { fontFamily: FontFamily.bold, color: '#171717' },
                        ]}
                      >
                        {p.label}
                      </Text>
                      {isSelected && <Feather name="check" size={15} color="#D97706" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Add Presets / Custom Days Fixer */}
          <View style={styles.addPresetBox}>
            <Text style={styles.addPresetTitle}>Fix Custom Duration (Days):</Text>
            <View style={styles.addPresetRow}>
              <TextInput
                style={styles.customDaysInput}
                placeholder="e.g. 5"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={customDaysText}
                onChangeText={setCustomDaysText}
                editable={!isBusy}
              />
              <Text style={styles.customDaysUnit}>Days</Text>
              <TouchableOpacity
                style={styles.addPresetBtn}
                onPress={handleAddCustomPreset}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={14} color="#171717" />
                <Text style={styles.addPresetBtnText}>Add Preset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <AppButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
            disabled={isBusy}
            style={styles.cancelBtn}
            textStyle={styles.cancelBtnText}
          />

          <AppButton
            title={initialData ? 'Save Changes' : 'Add Announcement'}
            variant="primary"
            onPress={handleSubmit}
            loading={isBusy}
            disabled={isBusy}
            style={styles.submitBtn}
            textStyle={styles.submitBtnText}
          />
        </View>
      </ScrollView>
    </AppModal>
  );
};

const calStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  monthYearText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  navBtn: {
    padding: 6,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 4,
  },
  weekdayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginVertical: 1,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 32,
  },
  dayCellSelected: {
    backgroundColor: '#F4C430',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  dayCellText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#171717',
  },
  dayCellTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  dayCellTextToday: {
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },
});

const styles = StyleSheet.create({
  formContent: {
    gap: 14,
    paddingBottom: 16,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  periodCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  periodSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: -4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#171717',
    marginBottom: 4,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateInputWrapperActive: {
    borderColor: '#F4C430',
    backgroundColor: '#FFFDF7',
  },
  dateText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  presetLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginBottom: 4,
  },
  presetDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  presetDropdownTriggerText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#171717',
  },
  presetDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  presetDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  presetDropdownItemText: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#334155',
  },
  addPresetBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 10,
    marginTop: 4,
    gap: 6,
  },
  addPresetTitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  addPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customDaysInput: {
    width: 70,
    height: 36,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
    textAlign: 'center',
  },
  customDaysUnit: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  addPresetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    height: 36,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  addPresetBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 5,
  },
  cancelBtnText: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#026440',
    borderColor: '#026440',
    borderRadius: 5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
