import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

export type EventType =
  | 'academic'
  | 'exam'
  | 'symposium'
  | 'workshop'
  | 'cultural'
  | 'holiday'
  | 'faculty_dev';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  scope: 'institution' | 'department';
  department?: string;
  startDate: string;
  endDate: string;
  time?: string;
  venue: string;
  description: string;
  organizer: string;
}

interface AcademicCalendarEventsViewProps {
  userRole?: 'principal' | 'hod' | 'admin' | 'hr';
  userDepartment?: string;
  canManageAll?: boolean;
  canManageDeptOnly?: boolean;
}

const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  academic: 'Academic Schedule',
  exam: 'Examinations',
  symposium: 'Symposium / Conference',
  workshop: 'Technical Workshop',
  cultural: 'Cultural & Sports',
  holiday: 'Holiday / Recess',
  faculty_dev: 'Faculty Development',
};

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Mid-Semester Examinations (All Semesters)',
    type: 'exam',
    scope: 'institution',
    startDate: '2026-10-22',
    endDate: '2026-10-28',
    time: '09:30 AM - 12:30 PM',
    venue: 'Campus Examination Halls & Exam Block',
    description: 'Centralized mid-term evaluations across B.Tech and M.Tech programs with biometric student verification.',
    organizer: 'Controller of Examinations & Principal Office',
  },
  {
    id: 'evt-2',
    title: 'AI & Neural Architectures National Symposium',
    type: 'symposium',
    scope: 'department',
    department: 'Computer Science',
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    time: '10:00 AM - 04:30 PM',
    venue: 'Dr. Kalam Tech Auditorium',
    description: 'Paper presentations, industry keynote panels on Foundation Models, and live student project demonstrations.',
    organizer: 'Prof. K. Sharma (HOD CSE) & IEEE Student Branch',
  },
  {
    id: 'evt-3',
    title: 'VLSI Design & Embedded Systems Workshop',
    type: 'workshop',
    scope: 'department',
    department: 'Electronics & Comm',
    startDate: '2026-11-05',
    endDate: '2026-11-06',
    time: '09:00 AM - 04:00 PM',
    venue: 'ECE Advanced DSP & Microcontroller Lab',
    description: 'Hands-on FPGA development and verilog synthesis training with industry application engineers.',
    organizer: 'Dr. Radhika Sen (HOD ECE)',
  },
  {
    id: 'evt-4',
    title: 'Diwali & Mid-Term Institutional Recess',
    type: 'holiday',
    scope: 'institution',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
    venue: 'Institution Wide',
    description: 'Campus non-instructional days for faculty and students. Hostels and essential security staff remain operational.',
    organizer: 'Institutional Governing Board',
  },
  {
    id: 'evt-5',
    title: 'Faculty Development Program: Generative AI in Higher Education',
    type: 'faculty_dev',
    scope: 'institution',
    startDate: '2026-11-18',
    endDate: '2026-11-20',
    time: '02:00 PM - 05:00 PM',
    venue: 'Senate Conference Room & Virtual Hybrid',
    description: 'Accreditation-aligned workshop on modern pedagogical technology, AI-assisted evaluation, and research grant writing.',
    organizer: 'Office of the Principal & Internal Quality Assurance Cell',
  },
  {
    id: 'evt-6',
    title: 'Robotics & Mechatronics Automation Expo',
    type: 'symposium',
    scope: 'department',
    department: 'Mechanical Eng',
    startDate: '2026-12-01',
    endDate: '2026-12-02',
    time: '09:30 AM - 05:00 PM',
    venue: 'Central CAD/CAM Facility & Mechanical Workshops',
    description: 'Autonomous rover challenge, industrial robot prototyping, and fluid power systems exhibition.',
    organizer: 'Prof. Manish Hegde (Mechanical Eng)',
  },
  {
    id: 'evt-7',
    title: 'End-Semester University Practical Lab Examinations',
    type: 'exam',
    scope: 'institution',
    startDate: '2026-12-10',
    endDate: '2026-12-18',
    time: '08:30 AM - 04:30 PM',
    venue: 'All Departmental Laboratories',
    description: 'External viva voce, algorithm lab execution, and project evaluation as per University curricula.',
    organizer: 'Controller of Examinations',
  },
];

export const AcademicCalendarEventsView: React.FC<AcademicCalendarEventsViewProps> = ({
  userRole = 'principal',
  userDepartment,
  canManageAll = true,
  canManageDeptOnly = false,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const maxContentWidth = Math.min(width, 1200);
  const cardGap = 10;
  const cardWidth = isDesktop ? Math.floor((maxContentWidth - 32 - cardGap) / 2) : '100%';

  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [search, setSearch] = useState('');
  const [activeScopeFilter, setActiveScopeFilter] = useState<'all' | 'institution' | 'department' | 'exam' | 'holiday'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Modal State for Create / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('academic');
  const [formScope, setFormScope] = useState<'institution' | 'department'>('institution');
  const [formDept, setFormDept] = useState(userDepartment || 'Computer Science');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const isPrincipalOrAdmin = userRole === 'principal' || userRole === 'admin' || userRole === 'hr' || canManageAll;

  // Permission helper
  const canEditEvent = (event: CalendarEvent) => {
    if (isPrincipalOrAdmin) return true;
    if (canManageDeptOnly && userDepartment) {
      return event.scope === 'department' && event.department?.toLowerCase() === userDepartment.toLowerCase();
    }
    return false;
  };

  const handleOpenCreate = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormType('academic');
    setFormScope(canManageDeptOnly && !isPrincipalOrAdmin ? 'department' : 'institution');
    setFormDept(userDepartment || 'Computer Science');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate(new Date().toISOString().slice(0, 10));
    setFormTime('09:30 AM - 04:30 PM');
    setFormVenue('Main Auditorium');
    setFormOrganizer(userRole === 'hod' ? `HOD ${userDepartment || 'Department'}` : 'Principal Office');
    setFormDescription('');
    setModalVisible(true);
  };

  const handleOpenEdit = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setFormTitle(evt.title);
    setFormType(evt.type);
    setFormScope(evt.scope);
    setFormDept(evt.department || 'Computer Science');
    setFormStartDate(evt.startDate);
    setFormEndDate(evt.endDate);
    setFormTime(evt.time || '');
    setFormVenue(evt.venue);
    setFormOrganizer(evt.organizer);
    setFormDescription(evt.description);
    setModalVisible(true);
  };

  const handleSaveEvent = () => {
    if (!formTitle.trim() || !formStartDate.trim() || !formVenue.trim()) {
      Alert.alert('Required Fields', 'Please provide event title, date, and venue.');
      return;
    }

    if (editingEventId) {
      // Edit existing
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEventId
            ? {
                ...e,
                title: formTitle.trim(),
                type: formType,
                scope: formScope,
                department: formScope === 'department' ? formDept : undefined,
                startDate: formStartDate.trim(),
                endDate: formEndDate.trim() || formStartDate.trim(),
                time: formTime.trim(),
                venue: formVenue.trim(),
                organizer: formOrganizer.trim() || 'Institutional Academic Cell',
                description: formDescription.trim(),
              }
            : e
        )
      );
      Alert.alert('Event Updated', `"${formTitle}" has been saved.`);
    } else {
      // Create new
      const newEvt: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: formTitle.trim(),
        type: formType,
        scope: formScope,
        department: formScope === 'department' ? formDept : undefined,
        startDate: formStartDate.trim(),
        endDate: formEndDate.trim() || formStartDate.trim(),
        time: formTime.trim(),
        venue: formVenue.trim(),
        organizer: formOrganizer.trim() || 'Institutional Academic Cell',
        description: formDescription.trim(),
      };
      setEvents((prev) => [newEvt, ...prev]);
      Alert.alert('Event Scheduled', `"${formTitle}" added to the academic calendar.`);
    }

    setModalVisible(false);
  };

  const handleDeleteEvent = (id: string, title: string) => {
    Alert.alert('Remove Event', `Remove "${title}" from the academic calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setEvents((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Scope filter
      if (activeScopeFilter === 'institution' && e.scope !== 'institution') return false;
      if (activeScopeFilter === 'department' && e.scope !== 'department') return false;
      if (activeScopeFilter === 'exam' && e.type !== 'exam') return false;
      if (activeScopeFilter === 'holiday' && e.type !== 'holiday') return false;

      // Department filter
      if (selectedDept !== 'all') {
        if (e.scope === 'department' && e.department?.toLowerCase() !== selectedDept.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [events, search, activeScopeFilter, selectedDept]);

  return (
    <View style={styles.container}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageHeading} numberOfLines={1}>
            Academic Calendar & Events
          </Text>
          <Text style={styles.pageSubText}>
            Institutional milestones, department symposiums, and exam schedules
          </Text>
        </View>

        {(isPrincipalOrAdmin || canManageDeptOnly) && (
          <TouchableOpacity style={styles.newEventBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
            <Feather name="plus" size={13} color="#FFFFFF" />
            <Text style={styles.newEventBtnText}>Schedule Event</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Search & Filter Bar */}
      <View style={styles.searchSectionWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={14} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, venues, symposiums..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
              <Feather name="x" size={13} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Scope Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all' as const, label: `All Events (${events.length})` },
            { key: 'institution' as const, label: 'Institution Wide' },
            { key: 'department' as const, label: 'Dept Activities' },
            { key: 'exam' as const, label: 'Examinations' },
            { key: 'holiday' as const, label: 'Holidays & Recess' },
          ].map((item) => {
            const active = activeScopeFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveScopeFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Department Quick Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptScroll}>
          {['all', ...INSTITUTION_DEPARTMENTS].map((dept) => {
            const active = selectedDept.toLowerCase() === dept.toLowerCase();
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.deptChip, active && styles.deptChipActive]}
                onPress={() => setSelectedDept(dept)}
                activeOpacity={0.7}
              >
                <Text style={[styles.deptChipText, active && styles.deptChipTextActive]}>
                  {dept === 'all' ? 'All Departments' : dept}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Event List Count Header */}
      <View style={styles.listMetaRow}>
        <Text style={styles.listMetaCount}>
          {filteredEvents.length} {filteredEvents.length === 1 ? 'Scheduled Event' : 'Scheduled Events'}
        </Text>
        {(activeScopeFilter !== 'all' || selectedDept !== 'all' || search.length > 0) && (
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => {
              setActiveScopeFilter('all');
              setSelectedDept('all');
              setSearch('');
            }}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={11} color="#4B5563" />
            <Text style={styles.resetFilterText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Events Cards List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="calendar" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>
              {search || activeScopeFilter !== 'all'
                ? 'Try adjusting your search keywords or department criteria.'
                : 'Plan upcoming academic terms, exams, and department conferences.'}
            </Text>
            {(isPrincipalOrAdmin || canManageDeptOnly) && (
              <TouchableOpacity style={styles.emptyActionBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
                <Feather name="plus" size={13} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Plan New Event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            {filteredEvents.map((evt) => {
              const canEdit = canEditEvent(evt);
              const dateDisplay =
                evt.startDate === evt.endDate
                  ? evt.startDate
                  : `${evt.startDate} → ${evt.endDate}`;

              return (
                <View key={evt.id} style={[styles.card, { width: cardWidth }]}>
                  {/* Top Meta: Scope & Type + Action Buttons */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.badgeRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {EVENT_TYPE_LABELS[evt.type] || evt.type.toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.metaDivider}>·</Text>
                      <Text style={styles.scopeBadgeText}>
                        {evt.scope === 'institution'
                          ? 'Institution-Wide'
                          : evt.department || 'Department Activity'}
                      </Text>
                    </View>

                    {canEdit && (
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleOpenEdit(evt)}
                          activeOpacity={0.6}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="edit-2" size={13} color="#374151" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleDeleteEvent(evt.id, evt.title)}
                          activeOpacity={0.6}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="trash-2" size={13} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={styles.cardTitle}>{evt.title}</Text>

                  {/* Date, Time & Venue */}
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{dateDisplay}</Text>
                      {evt.time ? <Text style={styles.detailSubText}>({evt.time})</Text> : null}
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {evt.venue}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {evt.description ? (
                    <Text style={styles.cardDescription} numberOfLines={3}>
                      {evt.description}
                    </Text>
                  ) : null}

                  {/* Footer: Organizer */}
                  <View style={styles.cardFooter}>
                    <MaterialCommunityIcons name="account-tie-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.organizerText} numberOfLines={1}>
                      Organized by {evt.organizer}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 5. CREATE / EDIT EVENT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={styles.modalIconSquare}>
                  <Feather name="calendar" size={15} color="#111827" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingEventId ? 'Edit Scheduled Event' : 'Schedule New Event'}
                  </Text>
                  <Text style={styles.modalSubtitle}>Plan academic calendar & activities</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollArea} contentContainerStyle={styles.modalScrollContent}>
              {/* Event Title */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Event Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. National Symposium on Machine Learning"
                  placeholderTextColor="#9CA3AF"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Event Type */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Category / Event Type *</Text>
                <View style={styles.modalChipsWrap}>
                  {(
                    [
                      { key: 'academic', label: 'Academic' },
                      { key: 'exam', label: 'Examination' },
                      { key: 'symposium', label: 'Symposium' },
                      { key: 'workshop', label: 'Workshop' },
                      { key: 'holiday', label: 'Holiday' },
                      { key: 'faculty_dev', label: 'Faculty Dev' },
                      { key: 'cultural', label: 'Cultural / Sports' },
                    ] as const
                  ).map((t) => {
                    const active = formType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.modalChip, active && styles.modalChipActive]}
                        onPress={() => setFormType(t.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Scope (Institution vs Department) */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Authority / Scope *</Text>
                <View style={styles.modalPriorityRow}>
                  <TouchableOpacity
                    disabled={!isPrincipalOrAdmin}
                    style={[
                      styles.modalPriorityBtn,
                      formScope === 'institution' && styles.modalPriorityBtnActive,
                      !isPrincipalOrAdmin && { opacity: 0.5 },
                    ]}
                    onPress={() => setFormScope('institution')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalPriorityText,
                        formScope === 'institution' && styles.modalPriorityTextActive,
                      ]}
                    >
                      Campus / Institution Wide
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalPriorityBtn, formScope === 'department' && styles.modalPriorityBtnActive]}
                    onPress={() => setFormScope('department')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalPriorityText,
                        formScope === 'department' && styles.modalPriorityTextActive,
                      ]}
                    >
                      Department Specific
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* If Department, Select Department */}
              {formScope === 'department' && (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalLabel}>Target Department *</Text>
                  <View style={styles.modalChipsWrap}>
                    {INSTITUTION_DEPARTMENTS.map((dept) => {
                      const active = formDept.toLowerCase() === dept.toLowerCase();
                      const disabled = Boolean(!isPrincipalOrAdmin && userDepartment && dept.toLowerCase() !== userDepartment.toLowerCase());
                      return (
                        <TouchableOpacity
                          key={dept}
                          disabled={disabled}
                          style={[
                            styles.modalChip,
                            active && styles.modalChipActive,
                            disabled && { opacity: 0.4 },
                          ]}
                          onPress={() => setFormDept(dept)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                            {dept}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Dates & Time */}
              <View style={styles.modalRowFields}>
                <View style={[styles.modalFieldGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Start Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-11-02"
                    placeholderTextColor="#9CA3AF"
                    value={formStartDate}
                    onChangeText={setFormStartDate}
                  />
                </View>

                <View style={[styles.modalFieldGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-11-03"
                    placeholderTextColor="#9CA3AF"
                    value={formEndDate}
                    onChangeText={setFormEndDate}
                  />
                </View>
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Time Range / Schedule</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 09:30 AM - 04:30 PM"
                  placeholderTextColor="#9CA3AF"
                  value={formTime}
                  onChangeText={setFormTime}
                />
              </View>

              {/* Venue & Organizer */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Venue / Location *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Dr. Kalam Tech Hall, Seminar Room 2"
                  placeholderTextColor="#9CA3AF"
                  value={formVenue}
                  onChangeText={setFormVenue}
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>In-Charge / Organizer</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. HOD Computer Science or Principal Office"
                  placeholderTextColor="#9CA3AF"
                  value={formOrganizer}
                  onChangeText={setFormOrganizer}
                />
              </View>

              {/* Description */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Agenda / Event Details</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Summary of schedule, student participation criteria, or faculty responsibilities..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formDescription}
                  onChangeText={setFormDescription}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelBtn} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEvent} style={styles.modalSaveBtn} activeOpacity={0.8}>
                <Feather name="check" size={13} color="#FFFFFF" />
                <Text style={styles.modalSaveText}>
                  {editingEventId ? 'Save Changes' : 'Publish to Calendar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  pageHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.3,
  },
  pageSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  newEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  newEventBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  searchSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 1,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  filterChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  deptScroll: {
    flexDirection: 'row',
    gap: 5,
  },
  deptChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deptChipActive: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  deptChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#6B7280',
  },
  deptChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listMetaCount: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#6B7280',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetFilterText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#4B5563',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    paddingBottom: 110,
  },
  cardsGrid: {
    gap: 10,
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#374151',
    letterSpacing: 0.3,
  },
  metaDivider: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  scopeBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
    lineHeight: 19,
    marginBottom: 8,
  },
  detailsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 8,
    gap: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#374151',
  },
  detailSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  cardDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  organizerText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 3,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 17,
    marginBottom: 14,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  emptyActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollArea: {
    maxHeight: 420,
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  modalFieldGroup: {
    gap: 5,
  },
  modalRowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  modalLabel: {
    fontSize: 11.5,
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  modalInput: {
    height: 38,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#111827',
    fontFamily: FontFamily.regular,
  },
  modalTextArea: {
    height: 72,
    paddingVertical: 8,
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modalChipText: {
    fontSize: 11.5,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  modalPriorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modalPriorityBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPriorityBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modalPriorityText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.medium,
  },
  modalPriorityTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: FontFamily.medium,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
