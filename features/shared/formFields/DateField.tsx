import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

const pad2 = (n: number) => String(n).padStart(2, '0');

const parseISODate = (value: string): Date | null => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface DateFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: any;
  theme?: 'light' | 'dark';
}

/** Shared calendar date input (YYYY-MM-DD), same UX as the admin student/teacher forms. */
export const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, placeholder = 'YYYY-MM-DD', required, style, theme = 'light' }) => {
  const dark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const openPicker = () => {
    const d = parseISODate(value) || new Date();
    setTemp(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isSelectedDay = (d: number) =>
    temp.getFullYear() === viewYear && temp.getMonth() === viewMonth && temp.getDate() === d;
  const isToday = (d: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  return (
    <View style={[styles.formGroup, style]}>
      {!!label && (
        <Text style={[styles.label, dark && styles.labelDark]}>
          {label}
          {required && <Text style={styles.reqMark}> *</Text>}
        </Text>
      )}
      <TouchableOpacity style={[styles.inputWithIcon, dark && styles.inputWithIconDark]} activeOpacity={0.7} onPress={openPicker}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={16} color="#9CA3AF" />
        <Text style={[styles.inputIconText, dark && styles.inputIconTextDark, !value && styles.inputPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {!!value && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View onStartShouldSetResponder={() => true} style={[styles.modalCard, dark && styles.modalCardDark]}>
            <Text style={[styles.modalTitle, dark && styles.modalTitleDark]}>{label || 'Select date'}</Text>

            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.monthBtn} onPress={() => shiftMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="chevron-left" size={18} color={dark ? '#9CA3AF' : '#6B6B6B'} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, dark && styles.monthLabelDark]}>{`${MONTH_NAMES[viewMonth]} ${viewYear}`}</Text>
              <TouchableOpacity style={styles.monthBtn} onPress={() => shiftMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="chevron-right" size={18} color={dark ? '#9CA3AF' : '#6B6B6B'} />
              </TouchableOpacity>
            </View>

            <View style={styles.dowRow}>
              {WEEK_DAYS.map((d, i) => (
                <Text key={`dow-${i}`} style={styles.dowText}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (d === null) return <View key={`pad-${i}`} style={styles.dayCell} />;
                const sel = isSelectedDay(d);
                return (
                  <TouchableOpacity
                    key={`day-${d}`}
                    style={[styles.dayCell, sel && styles.dayCellSel, !sel && isToday(d) && styles.dayCellToday]}
                    onPress={() => {
                      setTemp(new Date(viewYear, viewMonth, d));
                      onChange(toISODate(new Date(viewYear, viewMonth, d)));
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.dayText, dark && styles.dayTextDark, sel && styles.dayTextSel]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={() => { onChange(''); setOpen(false); }}>
                <Text style={[styles.clearText, dark && styles.clearTextDark]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setOpen(false)}>
                <Text style={[styles.doneText, dark && styles.doneTextDark]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const DAY = 38;

const styles = StyleSheet.create({
  formGroup: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  reqMark: { color: '#D64545' },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
  },
  inputIconText: { flex: 1, fontSize: 13, color: '#171717', fontFamily: FontFamily.medium },
  inputPlaceholder: { color: '#9CA3AF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 16, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 15, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717', marginBottom: 10 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthBtn: { padding: 4 },
  monthLabel: { fontSize: 14, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717' },
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowText: { width: DAY, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: DAY, height: DAY, alignItems: 'center', justifyContent: 'center', borderRadius: DAY / 2 },
  dayCellSel: { backgroundColor: '#F4C430' },
  dayCellToday: { borderWidth: 1, borderColor: '#F4C430' },
  dayText: { fontSize: 13, color: '#171717', fontFamily: FontFamily.medium },
  dayTextSel: { fontWeight: '800', color: '#1A1B1C' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  clearText: { fontSize: 13, color: '#6B6B6B', fontWeight: '600', fontFamily: FontFamily.semibold },
  doneBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F4C430', borderRadius: BorderRadius.button },
  doneText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', fontFamily: FontFamily.bold },
  labelDark: { color: '#9CA3AF' },
  inputWithIconDark: { backgroundColor: '#171717', borderColor: 'rgba(244,196,48,0.15)' },
  inputIconTextDark: { color: '#E5E7EB' },
  modalCardDark: { backgroundColor: '#1F1F1F', borderWidth: 1, borderColor: 'rgba(244,196,48,0.15)' },
  modalTitleDark: { color: '#E5E7EB' },
  monthLabelDark: { color: '#E5E7EB' },
  dayTextDark: { color: '#E5E7EB' },
  clearTextDark: { color: '#9CA3AF' },
  doneTextDark: { color: '#1A1B1C' },
});
