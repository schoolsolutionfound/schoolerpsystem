import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { TeacherShimmerSkeleton } from './common/TeacherShimmer';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { useClassTransferStore } from '../services/classTransferStore';
import { useAttendanceStore } from '../services/attendanceStore';

interface TeacherHomePeriodsListProps {
  loading?: boolean;
  slots?: any[];
  onMarkAttendance?: (slotOrId: any, subjectName?: string, className?: string) => void;
  onViewFull?: () => void;
}

function parsePeriodInfo(slot: any, index: number): { num: string; label: string } {
  const rawLabel = (slot?.period?.label || slot?.label || '').trim();
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

  if (rawLabel) {
    const match = rawLabel.match(/^(\d+)(?:st|nd|rd|th)?(?:\s*period)?/i);
    if (match) {
      const n = parseInt(match[1], 10);
      const num = ordinals[n - 1] || `${n}th`;
      return { num, label: 'Period' };
    }
    const cleanWord = rawLabel.replace(/period/i, '').trim();
    if (cleanWord) {
      return { num: cleanWord, label: 'Period' };
    }
  }

  return { num: ordinals[index] || `${index + 1}th`, label: 'Period' };
}

function shortenSubjectName(rawName: string): string {
  const map: Record<string, string> = {
    mathematics: 'Maths',
    maths: 'Maths',
    math: 'Maths',
    'practical geometry': 'Pract. Geom',
    geometry: 'Geometry',
    algebra: 'Algebra',
    physics: 'Physics',
    chemistry: 'Chem',
    chem: 'Chem',
    biology: 'Bio',
    bio: 'Bio',
    'computer science': 'Comp Sci',
    'information technology': 'IT',
    'social science': 'Social Sci',
    'social studies': 'Social Sci',
    'environmental studies': 'EVS',
    'environmental science': 'EVS',
    'physical education': 'P.E.',
    'business studies': 'Business',
    'general knowledge': 'GK',
    'english language': 'English',
    'english literature': 'English',
    'hindi literature': 'Hindi',
  };

  const lower = rawName.trim().toLowerCase();
  if (map[lower]) return map[lower];

  if (rawName.length <= 11) return rawName;
  if (lower.startsWith('practical ')) return rawName.replace(/^practical\s+/i, 'P. ');
  return rawName;
}

function toShortSubject(subject?: any): string {
  if (!subject) return 'Subject';
  if (typeof subject === 'string') return shortenSubjectName(subject);
  if (subject.shortName) return subject.shortName;
  if (subject.code && subject.code.length <= 6) return subject.code;
  return shortenSubjectName(subject.name || 'Subject');
}

function formatClass(slot: any): string {
  const cls = slot?.classSectionName || slot?.classSection?.name || '';
  if (cls) return cls;
  return 'General';
}

function getTodayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const TeacherHomePeriodsList: React.FC<TeacherHomePeriodsListProps> = ({
  loading,
  slots = [],
  onMarkAttendance,
  onViewFull,
}) => {
  const { requests: transferRequests } = useClassTransferStore();
  const { isPeriodMarked } = useAttendanceStore();
  const todayStr = useMemo(() => getTodayIsoDate(), []);

  const displaySlots = useMemo(() => {

    // 1. Mark any slot that this teacher transferred out and got accepted
    const baseList = slots.map((slot) => {
      const matched = transferRequests.find(
        (r) =>
          r.status === 'accepted' &&
          (r.date === todayStr || !r.date) &&
          (r.periodId === slot.id ||
            (Boolean(slot.period?.label) && r.periodLabel?.toLowerCase() === slot.period?.label?.toLowerCase()))
      );
      if (matched) {
        return {
          ...slot,
          isTransferredOut: true,
          coveredByTeacherName: matched.toTeacherName,
        };
      }
      return slot;
    });

    // 2. Append any accepted incoming transfers where this teacher is covering!
    const acceptedIncomingToday = transferRequests
      .filter(
        (r) =>
          r.status === 'accepted' &&
          (r.date === todayStr || !r.date) &&
          (r.toTeacherId === 'current-user' || r.toTeacherName.includes('You'))
      )
      .map((r) => ({
        id: r.periodId || `incoming-${r.id}`,
        period: {
          label: r.periodLabel,
          startTime: r.startTime,
          endTime: r.endTime,
        },
        subject: { name: r.subject },
        classSectionName: r.className,
        isCovering: true,
        coveringForTeacherName: r.fromTeacherName,
      }));

    return [...baseList, ...acceptedIncomingToday];
  }, [slots, transferRequests]);

  return (
    <View style={styles.card}>
      {/* Card Header matching reference image */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Today&apos;s Timetable</Text>
        <TouchableOpacity
          onPress={onViewFull}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.viewFullText}>View Full</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {loading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i}>
              {i > 0 && <View style={styles.rowDivider} />}
              <View style={styles.periodRow}>
                <View style={styles.periodCol}>
                  <TeacherShimmerSkeleton width={38} height={16} borderRadius={5} />
                  <TeacherShimmerSkeleton width={42} height={12} borderRadius={5} />
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.timeCol}>
                  <TeacherShimmerSkeleton width={74} height={15} borderRadius={5} />
                  <TeacherShimmerSkeleton width={74} height={12} borderRadius={5} />
                </View>

                <View style={styles.subjectCol}>
                  <TeacherShimmerSkeleton width="80%" height={16} borderRadius={5} />
                  <TeacherShimmerSkeleton width="60%" height={12} borderRadius={5} />
                </View>

                <TeacherShimmerSkeleton width={62} height={32} borderRadius={5} />
              </View>
            </View>
          ))}
        </View>
      ) : displaySlots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={24} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No classes today</Text>
          <Text style={styles.emptySubtitle}>You have no periods scheduled on your timetable</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {displaySlots.map((slot: any, i: number) => {
            const { num, label } = parsePeriodInfo(slot, i);
            const startTime = slot?.period?.startTime || slot?.startTime || '00:00';
            const endTime = slot?.period?.endTime || slot?.endTime || '00:00';
            const subjectName = toShortSubject(slot?.subject || slot?.subjectName);

            const cls = formatClass(slot);
            // NO ROOM NUMBER: Room number removed in schedule! Show accepted teacher info!
            let metaInfo = cls;
            if (slot.isCovering) {
              metaInfo = `${cls} • Covering (${slot.coveringForTeacherName || 'Substitute'})`;
            } else if (slot.isTransferredOut) {
              metaInfo = `${cls} • Covered by ${slot.coveredByTeacherName || 'Substitute'}`;
            }

            const rawSubject = slot?.subject?.name || slot?.subjectName || subjectName;
            const isMarked = isPeriodMarked(slot.id, todayStr, cls, rawSubject);

            return (
              <View key={slot.id || `slot-${i}`}>
                {i > 0 && <View style={styles.rowDivider} />}
                <View style={styles.periodRow}>
                  {/* Column 1: Period number and label */}
                  <View style={styles.periodCol}>
                    <Text style={styles.periodNum}>{num}</Text>
                    <Text style={styles.periodLabel}>{label}</Text>
                  </View>

                  {/* Vertical separator between period and time */}
                  <View style={styles.verticalDivider} />

                  {/* Column 2: Start and End Time */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeStart}>{startTime}</Text>
                    <Text style={styles.timeEnd}>{endTime}</Text>
                  </View>

                  {/* Column 3: Subject Short Name and Class */}
                  <View style={styles.subjectCol}>
                    <Text style={styles.subjectName} numberOfLines={1}>
                      {subjectName}
                    </Text>
                    <Text style={styles.subjectMeta} numberOfLines={1}>
                      {metaInfo}
                    </Text>
                  </View>

                  {/* Column 4: Mark Button or Covered indicator or Marked state */}
                  {slot.isTransferredOut ? (
                    <View style={styles.coveredBtn}>
                      <Text style={styles.coveredBtnText}>Covered</Text>
                    </View>
                  ) : isMarked ? (
                    <TouchableOpacity
                      style={styles.markedBtn}
                      onPress={() => onMarkAttendance?.(slot, rawSubject, cls)}
                      activeOpacity={0.82}
                    >
                      <Feather name="check" size={13} color="#FFFFFF" />
                      <Text style={styles.markedBtnText}>Marked</Text>
                    </TouchableOpacity>
                  ) : slot.isCovering ? (
                    <TouchableOpacity
                      style={styles.markBtnCovering}
                      onPress={() => onMarkAttendance?.(slot, rawSubject, cls)}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.markBtnText}>Mark</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.markBtn}
                      onPress={() => onMarkAttendance?.(slot, rawSubject, cls)}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.markBtnText}>Mark</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  viewFullText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    paddingVertical: 1,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  periodCol: {
    width: 48,
    justifyContent: 'center',
  },
  periodNum: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  periodLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  timeCol: {
    width: 84,
    justifyContent: 'center',
  },
  timeStart: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  timeEnd: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  subjectCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 6,
    paddingRight: 10,
  },
  subjectName: {
    fontSize: 14.5,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  subjectMeta: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  markBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 5,
    width: 76,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  markBtnCovering: {
    backgroundColor: '#FAB82C',
    borderRadius: 5,
    width: 76,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  markedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#059669',
    borderRadius: 5,
    width: 76,
    height: 32,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
    elevation: 1,
  },
  markedBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  coveredBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 5,
    width: 76,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coveredBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#065F46',
  },
  markBtnText: {
    color: '#171717',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  emptyContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
});
