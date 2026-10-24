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
  Pressable,
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

const getEventTypeBadgeStyle = (type: EventType) => {
  switch (type) {
    case 'exam':
      return {
        bg: '#FEF3C7',
        border: '#FDE68A',
        text: '#92400E',
        icon: 'clipboard-list-outline' as const,
      };
    case 'symposium':
      return {
        bg: '#111827',
        border: '#111827',
        text: '#F4C430',
        icon: 'account-group-outline' as const,
      };
    case 'workshop':
      return {
        bg: '#FEF9C3',
        border: '#FDE68A',
        text: '#B45309',
        icon: 'tools' as const,
      };
    case 'holiday':
      return {
        bg: '#DCFCE7',
        border: '#BBF7D0',
        text: '#15803D',
        icon: 'beach' as const,
      };
    case 'faculty_dev':
      return {
        bg: '#EDE9FE',
        border: '#DDD6FE',
        text: '#6D28D9',
        icon: 'school-outline' as const,
      };
    case 'cultural':
      return {
        bg: '#FCE7F3',
        border: '#FBCFE8',
        text: '#BE185D',
        icon: 'trophy-outline' as const,
      };
    default:
      return {
        bg: '#F3F4F6',
        border: '#E5E7EB',
        text: '#374151',
        icon: 'calendar-outline' as const,
      };
  }
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
    description: 'Centralized mid-term evaluations across degree programs with biometric student verification.',
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const hasActiveFilters = activeScopeFilter !== 'all' || selectedDept !== 'all';
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Modal State for Create / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('academic');
  const [formScope, setFormScope] = useState<'institution' | 'department'>('institution');
  const [formDept, setFormDept] = useState(userDepartment || 'Computer Science');
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
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
    setScopeDropdownOpen(false);
    setDeptDropdownOpen(false);
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
    setScopeDropdownOpen(false);
    setDeptDropdownOpen(false);
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
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.pageHeading}>
            Events & Calendar
          </Text>
        </View>

        {(isPrincipalOrAdmin || canManageDeptOnly) && (
          <TouchableOpacity style={styles.newEventBtn} onPress={handleOpenCreate} activeOpacity={0.85}>
            <Feather name="plus" size={15} color="#111827" />
            <Text style={styles.newEventBtnText}>Schedule Event</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Top Search & Filter Bar (Matching Staff Directory, Homerooms & Fee Ledger) */}
      <View style={styles.searchSectionWrap}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#F4C430" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, venues, symposiums..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sub-row: Active Filter Tags & Filter Action Button */}
        <View style={styles.searchSubRow}>
          <View style={styles.filterTagsRow}>
            {hasActiveFilters ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {activeScopeFilter !== 'all' && (
                  <View style={styles.activeTagPill}>
                    <Text style={styles.activeTagPillText}>
                      {activeScopeFilter === 'institution'
                        ? 'Institution Wide'
                        : activeScopeFilter === 'department'
                        ? 'Dept Activities'
                        : activeScopeFilter === 'exam'
                        ? 'Examinations'
                        : 'Holidays'}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveScopeFilter('all')}>
                      <Feather name="x" size={12} color="#111827" />
                    </TouchableOpacity>
                  </View>
                )}
                {selectedDept !== 'all' && (
                  <View style={styles.activeTagPill}>
                    <Text style={styles.activeTagPillText}>Dept: {selectedDept}</Text>
                    <TouchableOpacity onPress={() => setSelectedDept('all')}>
                      <Feather name="x" size={12} color="#111827" />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.filterSummaryText}>
                {filteredEvents.length} events across all categories
              </Text>
            )}
          </View>

          {/* Filter Button on the Right */}
          <TouchableOpacity
            style={[styles.filterActionBtn, hasActiveFilters && styles.filterActionBtnActive]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={18}
              color={hasActiveFilters ? '#000000' : '#4B5563'}
            />
            <Text style={[styles.filterActionBtnText, hasActiveFilters && styles.filterActionBtnTextActive]}>
              Filter
            </Text>
            {hasActiveFilters && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>
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
              const isExpanded = !!expandedIds[evt.id];

              return (
                <View key={evt.id} style={[styles.card, { width: cardWidth }]}>
                  {/* Top Row: Event Title and Actions (Edit & Delete) */}
                  <View style={styles.cardTopRow}>
                    <TouchableOpacity
                      style={styles.cardTitleWrap}
                      onPress={() => toggleExpand(evt.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardTitle}>{evt.title}</Text>
                    </TouchableOpacity>

                    {canEdit && (
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={() => handleOpenEdit(evt)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.cardActionBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cardActionDeleteBtn}
                          onPress={() => handleDeleteEvent(evt.id, evt.title)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.cardActionDeleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Clickable body to reveal details */}
                  <TouchableOpacity
                    style={styles.cardBody}
                    onPress={() => toggleExpand(evt.id)}
                    activeOpacity={0.7}
                  >
                    {/* Scheduled Date and Time - No icons, no text backgrounds */}
                    <View style={styles.scheduleInfoBlock}>
                      <View style={styles.scheduleField}>
                        <Text style={styles.scheduleFieldLabel}>Scheduled Date</Text>
                        <Text style={styles.scheduleFieldValue}>{dateDisplay}</Text>
                      </View>

                      {evt.time ? (
                        <View style={styles.scheduleField}>
                          <Text style={styles.scheduleFieldLabel}>Time Duration</Text>
                          <Text style={styles.scheduleFieldValue}>{evt.time}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Expandable Details: Only shown when clicked */}
                    {isExpanded && (
                      <View style={styles.expandedContentBlock}>
                        {evt.description ? (
                          <View style={styles.expandedField}>
                            <Text style={styles.expandedFieldLabel}>Description</Text>
                            <Text style={styles.expandedDescriptionText}>{evt.description}</Text>
                          </View>
                        ) : null}

                        {evt.venue ? (
                          <View style={styles.expandedField}>
                            <Text style={styles.expandedFieldLabel}>Venue</Text>
                            <Text style={styles.expandedFieldValue}>{evt.venue}</Text>
                          </View>
                        ) : null}

                        {evt.organizer ? (
                          <View style={styles.expandedField}>
                            <Text style={styles.expandedFieldLabel}>Organizer</Text>
                            <Text style={styles.expandedFieldValue}>{evt.organizer}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {/* Minimal text indicator */}
                    <View style={styles.expandToggleRow}>
                      <Text style={styles.expandToggleText}>
                        {isExpanded ? 'Hide details' : 'View details'}
                      </Text>
                    </View>
                  </TouchableOpacity>
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

              {/* Scope Dropdown */}
              <View style={[styles.modalFieldGroup, { zIndex: 30 }]}>
                <Text style={styles.modalLabel}>Authority / Scope *</Text>
                <View style={styles.formDropdownWrap}>
                  <TouchableOpacity
                    disabled={!isPrincipalOrAdmin}
                    style={[
                      styles.formDropdownBtn,
                      scopeDropdownOpen && styles.formDropdownBtnActive,
                      !isPrincipalOrAdmin && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      setScopeDropdownOpen(!scopeDropdownOpen);
                      setDeptDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons
                        name={formScope === 'institution' ? 'domain' : 'office-building'}
                        size={17}
                        color="#D97706"
                      />
                      <Text style={styles.formDropdownText}>
                        {formScope === 'institution' ? 'Campus / Institution Wide' : 'Department Specific'}
                      </Text>
                    </View>
                    <Feather
                      name={scopeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {scopeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      <TouchableOpacity
                        style={[
                          styles.formDropdownItem,
                          formScope === 'institution' && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setFormScope('institution');
                          setScopeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            formScope === 'institution' && styles.formDropdownItemTextActive,
                          ]}
                        >
                          Campus / Institution Wide
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.formDropdownItem,
                          formScope === 'department' && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setFormScope('department');
                          setScopeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            formScope === 'department' && styles.formDropdownItemTextActive,
                          ]}
                        >
                          Department Specific
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Department Dropdown (only when Department Specific is selected) */}
              {formScope === 'department' && (
                <View style={[styles.modalFieldGroup, { zIndex: 20 }]}>
                  <Text style={styles.modalLabel}>Target Department *</Text>
                  <View style={styles.formDropdownWrap}>
                    <TouchableOpacity
                      disabled={Boolean(!isPrincipalOrAdmin && userDepartment)}
                      style={[
                        styles.formDropdownBtn,
                        deptDropdownOpen && styles.formDropdownBtnActive,
                        Boolean(!isPrincipalOrAdmin && userDepartment) && { opacity: 0.6 },
                      ]}
                      onPress={() => {
                        setDeptDropdownOpen(!deptDropdownOpen);
                        setScopeDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="school-outline" size={17} color="#D97706" />
                        <Text style={styles.formDropdownText}>{formDept}</Text>
                      </View>
                      <Feather
                        name={deptDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {deptDropdownOpen && (
                      <View style={styles.formDropdownMenu}>
                        {INSTITUTION_DEPARTMENTS.map((dept) => {
                          const active = formDept.toLowerCase() === dept.toLowerCase();
                          return (
                            <TouchableOpacity
                              key={dept}
                              style={[styles.formDropdownItem, active && styles.formDropdownItemActive]}
                              onPress={() => {
                                setFormDept(dept);
                                setDeptDropdownOpen(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.formDropdownItemText,
                                  active && styles.formDropdownItemTextActive,
                                ]}
                              >
                                {dept}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
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
                  placeholder="e.g. Main Auditorium, Seminar Hall, Tech Center"
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

      {/* Filter Modal (Category & Department) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[styles.filterModalCard, { width: isDesktop ? 500 : '92%', maxWidth: 500 }]}
          >
            <View style={styles.filterModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.filterModalIconWrap}>
                  <MaterialCommunityIcons name="tune-variant" size={18} color="#000000" />
                </View>
                <Text style={styles.filterModalTitle}>Filter Academic Events</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.filterModalCloseBtn}
              >
                <Feather name="x" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Event Scope / Category */}
              <Text style={styles.filterGroupTitle}>EVENT CATEGORY</Text>
              <View style={styles.filterChipsWrap}>
                {[
                  { key: 'all', label: 'All Events' },
                  { key: 'institution', label: 'Institution Wide' },
                  { key: 'department', label: 'Dept Activities' },
                  { key: 'exam', label: 'Examinations' },
                  { key: 'holiday', label: 'Holidays & Recess' },
                ].map((item) => {
                  const active = activeScopeFilter === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setActiveScopeFilter(item.key as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Department Filter */}
              <Text style={[styles.filterGroupTitle, { marginTop: 14 }]}>DEPARTMENT</Text>
              <View style={styles.filterChipsWrap}>
                {['all', ...INSTITUTION_DEPARTMENTS].map((dept) => {
                  const active = selectedDept === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setSelectedDept(dept)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={() => {
                  setActiveScopeFilter('all');
                  setSelectedDept('all');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterResetText}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: 14,
    paddingBottom: 10,
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
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  newEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  newEventBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
  },
  searchSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
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
  searchSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterTagsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  activeTagPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#000000',
  },
  filterSummaryText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  filterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterActionBtnActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F4C430',
  },
  filterActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#4B5563',
  },
  filterActionBtnTextActive: {
    color: '#000000',
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterModalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  filterModalCloseBtn: {
    padding: 4,
  },
  filterGroupTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  filterApplyBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  cardsGrid: {
    gap: 12,
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15.5,
    color: '#111827',
    lineHeight: 22,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  cardActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#374151',
  },
  cardActionDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cardActionDeleteBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  cardBody: {
    gap: 8,
  },
  scheduleInfoBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  scheduleField: {
    gap: 2,
  },
  scheduleFieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleFieldValue: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
  },
  expandedContentBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  expandedField: {
    gap: 2,
  },
  expandedFieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandedFieldValue: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },
  expandedDescriptionText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  expandToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  expandToggleText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#92400E',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 11.5,
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
  formDropdownWrap: {
    position: 'relative',
  },
  formDropdownBtn: {
    height: 40,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formDropdownBtnActive: {
    borderColor: '#F4C430',
    backgroundColor: '#FFFFFF',
  },
  formDropdownText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#111827',
  },
  formDropdownMenu: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  formDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  formDropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  formDropdownItemText: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: '#374151',
  },
  formDropdownItemTextActive: {
    fontFamily: FontFamily.bold,
    color: '#92400E',
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
    height: 40,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#111827',
    fontFamily: FontFamily.regular,
  },
  modalTextArea: {
    height: 74,
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
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#D97706',
  },
  modalChipText: {
    fontSize: 11.5,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  modalChipTextActive: {
    color: '#111827',
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
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 12.5,
    color: '#374151',
    fontFamily: FontFamily.medium,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveText: {
    fontSize: 12.5,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
});
