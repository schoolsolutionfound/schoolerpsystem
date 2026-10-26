import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Modal, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { createClassSectionApi } from '../../../api/academics';
import { buildTerms, levelsForInstitution, termCountFromPlan } from '../../shared/academicStructure';

interface AdminInstitutionViewProps {
  config: {
    institutionCode: string;
    institutionName: string;
    institutionType: string;
    subscriptionStatus?: string;
    departments: string[];
    academicYears: string[];
    yearsOfStudy?: string[];
    courses: string[];
    sections: string[];
    classSubjects?: Record<string, string[]>;
    terms?: { academicYear: string; terms: string[] }[];
    hasDefaultPassword?: boolean;
  };
  onSaveConfig: (updated: {
    departments: string[];
    academicYears?: string[];
    yearsOfStudy?: string[];
    courses: string[];
    sections: string[];
    classSubjects?: Record<string, string[]>;
    terms?: { academicYear: string; terms: string[] }[];
    defaultTempPassword?: string;
  }) => Promise<void>;
  refreshing?: boolean;
  onRefresh?: () => void;
  classSections?: { name?: string }[];
  academicSessions?: any[];
  onDataChanged?: () => void;
}

export const AdminInstitutionView: React.FC<AdminInstitutionViewProps> = ({ config, onSaveConfig, refreshing = false, onRefresh, classSections = [], academicSessions = [], onDataChanged }) => {
  const isSchool = config.institutionType === 'school';
  const currentSession = (academicSessions || []).find((s: any) => s.isCurrent);
  const [departments, setDepartments] = useState<string[]>(config.departments || []);
  const [academicYears, setAcademicYears] = useState<string[]>(levelsForInstitution(config));
  const [courses, setCourses] = useState<string[]>(config.courses || []);
  const [sections, setSections] = useState<string[]>(config.sections || []);
  const [termCount, setTermCount] = useState(String(termCountFromPlan(config.terms, config.institutionType)));

  const [newDept, setNewDept] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [saving, setSaving] = useState(false);

  // Class → subjects mapping (persisted in institution config)
  const [classSubjects, setClassSubjects] = useState<Record<string, string[]>>(config.classSubjects || {});
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [modalClassName, setModalClassName] = useState('');
  const [modalSubjects, setModalSubjects] = useState<string[]>([]);
  const [modalAutoSections, setModalAutoSections] = useState(true);
  const [subjectSearch, setSubjectSearch] = useState('');

  // Empty = untouched (existing value kept). "Clear" button sends an explicit ''.
  const [defaultTempPassword, setDefaultTempPassword] = useState('');
  const [clearDefaultPassword, setClearDefaultPassword] = useState(false);

  const addItem = (item: string, setItem: (v: string) => void, list: string[], setList: (l: string[]) => void) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      Alert.alert('Duplicate Item', `"${trimmed}" already exists.`);
      return;
    }
    setList([...list, trimmed]);
    setItem('');
  };

  const removeItem = (index: number, list: string[], setList: (l: string[]) => void, label: string) => {
    Alert.alert('Remove', `Remove "${list[index]}" from ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = [...list];
          updated.splice(index, 1);
          setList(updated);
        },
      },
    ]);
  };

  const removeClass = (index: number) => {
    const className = academicYears[index];
    const hasSubjects = isSchool && (classSubjects[className]?.length || 0) > 0;
    Alert.alert(
      'Remove',
      `Remove "${className}"${hasSubjects ? ' and its subjects' : ''}? Existing class sections and student records are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAcademicYears(academicYears.filter((_, i) => i !== index));
            if (isSchool) {
              setClassSubjects((prev) => {
                const next = { ...prev };
                delete next[className];
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const openClassModal = () => {
    setEditingClass(null);
    setModalClassName('');
    setModalSubjects([]);
    setModalAutoSections(true);
    setSubjectSearch('');
    setClassModalOpen(true);
  };

  const openEditClass = (name: string) => {
    setEditingClass(name);
    setModalClassName(name);
    setModalSubjects(classSubjects[name] || []);
    setSubjectSearch('');
    setClassModalOpen(true);
  };

  const toggleModalSubject = (subj: string) => {
    setModalSubjects((prev) => (prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]));
  };

  const saveClass = async () => {
    if (editingClass) {
      setClassSubjects((prev) => ({ ...prev, [editingClass]: modalSubjects }));
      setClassModalOpen(false);
      setEditingClass(null);
      return;
    }
    const base = modalClassName.trim();
    if (!base) {
      Alert.alert('Missing', 'Enter a class name.');
      return;
    }
    if (isSchool) {
      const useSections = modalAutoSections && sections.length > 0;
      const sectionList = useSections ? sections : [''];
      const newRecords = sectionList.map((sec) => ({
        name: useSections ? `${base} ${sec}` : base,
        department: base,
        academicYear: useSections ? sec : '',
        section: useSections ? sec : '',
      }));
      const existing = new Set([
        ...academicYears,
        ...(classSections || []).map((c) => c?.name).filter(Boolean),
      ]);
      const dupes = newRecords.filter((r) => existing.has(r.name));
      if (dupes.length > 0) {
        Alert.alert('Duplicate', `"${dupes[0].name}" already exists.`);
        return;
      }

      // 1) Create real class_sections rows so Academics, timetable, attendance
      //    and student linking (buildClassScope) can use these classes.
      const failed: string[] = [];
      for (const rec of newRecords) {
        try {
          await createClassSectionApi(rec);
        } catch {
          failed.push(rec.name);
        }
      }

      // 2) Mirror into institution config (classes list + subjects per class).
      setAcademicYears([...academicYears, ...newRecords.map((r) => r.name)]);
      setClassSubjects((prev) => {
        const next = { ...prev };
        newRecords.forEach((r) => { next[r.name] = modalSubjects; });
        return next;
      });

      setClassModalOpen(false);
      onDataChanged?.();
      if (failed.length > 0) {
        Alert.alert(
          'Partially Saved',
          `Class list updated, but failed to create class records: ${failed.join(', ')}. Check Academics and try again.`
        );
      }
      return;
    }
    if (academicYears.includes(base)) {
      Alert.alert('Duplicate', `"${base}" already exists.`);
      return;
    }
    setAcademicYears([...academicYears, base]);
    if (isSchool) {
      setClassSubjects((prev) => ({ ...prev, [base]: modalSubjects }));
    }
    setClassModalOpen(false);
  };

  const handleSave = async () => {
    const trimmedPw = defaultTempPassword.trim();
    if (trimmedPw) {
      if (
        trimmedPw.length < 8 ||
        !/[A-Z]/.test(trimmedPw) ||
        !/[a-z]/.test(trimmedPw) ||
        !/[0-9]/.test(trimmedPw)
      ) {
        Alert.alert(
          'Weak Default Password',
          'The default password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit.'
        );
        return;
      }
    }
    setSaving(true);
    try {
      const termPlan = buildTerms(
        termCount,
        currentSession?.name || config.terms?.[0]?.academicYear,
        config.institutionType
      );
      // Replace only the target year's plan; keep terms configured for other
      // academic years intact.
      const terms = [
        ...(config.terms || []).filter((t) => t.academicYear !== termPlan[0].academicYear),
        ...termPlan,
      ];
      const payload: {
        departments: string[];
        academicYears?: string[];
        yearsOfStudy?: string[];
        courses: string[];
        sections: string[];
        classSubjects?: Record<string, string[]>;
        terms: { academicYear: string; terms: string[] }[];
        defaultTempPassword?: string;
      } = {
        departments,
        courses,
        sections,
        terms,
        // Schools store classes + per-class subjects; colleges store years of
        // study in yearsOfStudy (2026-27 sessions are managed separately).
        ...(isSchool
          ? { academicYears, classSubjects }
          : { yearsOfStudy: academicYears }),
      };
      if (trimmedPw) {
        payload.defaultTempPassword = trimmedPw;
      } else if (clearDefaultPassword) {
        payload.defaultTempPassword = '';
      }
      await onSaveConfig(payload);
      // Structure changes can seed class_sections, so refresh dependent tabs.
      onDataChanged?.();
      if (trimmedPw || clearDefaultPassword) {
        setDefaultTempPassword('');
        setClearDefaultPassword(false);
      }
      Alert.alert('Success', 'Academic structure configuration updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
    >
      {/* Institution Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoHeaderLeft}>
            <View style={styles.instIcon}>
              <MaterialCommunityIcons name={isSchool ? 'school' : 'bank-outline'} size={22} color="#1A1B1C" />
            </View>
            <View>
              <Text style={styles.instName}>{config.institutionName}</Text>
              <Text style={styles.instCode}>{config.institutionCode}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{config.subscriptionStatus || 'Active'}</Text>
          </View>
        </View>
        <View style={styles.infoDivider} />
        {currentSession ? (
          <View style={styles.infoYearRow}>
            <MaterialCommunityIcons name="calendar-star" size={13} color="#9CA3AF" />
            <Text style={styles.infoYearText}>Academic Year: {currentSession.name}</Text>
          </View>
        ) : null}
        <View style={styles.infoStatsRow}>
          <View style={styles.infoStat}>
            <Text style={styles.infoStatValue}>{departments.length}</Text>
            <Text style={styles.infoStatLabel}>{isSchool ? 'Subjects' : 'Departments'}</Text>
          </View>
          <View style={styles.infoStatDivider} />
          <View style={styles.infoStat}>
            <Text style={styles.infoStatValue}>{academicYears.length}</Text>
            <Text style={styles.infoStatLabel}>{isSchool ? 'Classes' : 'Years of Study'}</Text>
          </View>
          {!isSchool && (
            <>
              <View style={styles.infoStatDivider} />
              <View style={styles.infoStat}>
                <Text style={styles.infoStatValue}>{courses.length}</Text>
                <Text style={styles.infoStatLabel}>Courses</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Default password for newly created users */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Default Password</Text>
        {config.hasDefaultPassword && !clearDefaultPassword && (
          <View style={[styles.pwStatusRow, styles.pwStatusSet]}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#1A1B1C" />
            <Text style={styles.pwStatusText}>Currently set</Text>
            <TouchableOpacity onPress={() => setClearDefaultPassword(true)}>
              <Text style={styles.pwClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
        {clearDefaultPassword && (
          <View style={[styles.pwStatusRow, styles.pwStatusWillClear]}>
            <MaterialCommunityIcons name="shield-off" size={14} color="#B45309" />
            <Text style={[styles.pwStatusText, { color: '#B45309' }]}>Will be cleared on save</Text>
            <TouchableOpacity onPress={() => setClearDefaultPassword(false)}>
              <Text style={styles.pwClearText}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder={config.hasDefaultPassword && !clearDefaultPassword ? 'Enter new password to replace' : 'e.g. SchoolF1234'}
          placeholderTextColor="#9CA3AF"
          value={defaultTempPassword}
          onChangeText={(v) => {
            setDefaultTempPassword(v);
            if (v) setClearDefaultPassword(false);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.pwRules}>Min 8 chars, uppercase, lowercase & digit. Changed at first login.</Text>
      </View>

      {/* Subjects (school) / Departments (college) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{isSchool ? 'Subjects' : 'Departments'}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{departments.length}</Text>
          </View>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={isSchool ? 'e.g. English' : 'e.g. Computer Science'}
            placeholderTextColor="#9CA3AF"
            value={newDept}
            onChangeText={setNewDept}
            onSubmitEditing={() => addItem(newDept, setNewDept, departments, setDepartments)}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addItem(newDept, setNewDept, departments, setDepartments)}>
            <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {departments.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name={isSchool ? 'book-open-page-variant-outline' : 'office-building-outline'} size={28} color="#D1CDBF" />
            <Text style={styles.emptyHint}>No {isSchool ? 'subjects' : 'departments'} added yet</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {departments.map((dept, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View style={styles.listItemNum}>
                    <Text style={styles.listItemNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.listItemText}>{dept}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(idx, departments, setDepartments, isSchool ? 'subjects' : 'departments')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Sections (both types; optional for colleges) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Sections</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{sections.length}</Text>
          </View>
        </View>
        {!isSchool && (
          <Text style={styles.emptyHint}>
            Optional. Used in class names such as "CSE 2nd Year B".
          </Text>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. A"
            placeholderTextColor="#9CA3AF"
            value={newSection}
            onChangeText={setNewSection}
            onSubmitEditing={() => addItem(newSection, setNewSection, sections, setSections)}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addItem(newSection, setNewSection, sections, setSections)}>
            <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {sections.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="tag-multiple-outline" size={28} color="#D1CDBF" />
            <Text style={styles.emptyHint}>No sections added yet</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {sections.map((sec, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View style={styles.listItemNum}>
                    <Text style={styles.listItemNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.listItemText}>Section {sec}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(idx, sections, setSections, 'sections')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Academic Years / Classes Section */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{isSchool ? 'Classes' : 'Years of Study'}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{academicYears.length}</Text>
          </View>
        </View>
        {!isSchool && (
          <Text style={styles.emptyHint}>
            Academic sessions (e.g. 2026-27) are managed separately under Academics.
          </Text>
        )}
        <TouchableOpacity style={styles.addBtnFull} onPress={openClassModal}>
          <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
          <Text style={styles.addBtnText}>{isSchool ? 'Add Class' : 'Add Year of Study'}</Text>
        </TouchableOpacity>
        {academicYears.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="format-list-numbered" size={28} color="#D1CDBF" />
            <Text style={styles.emptyHint}>No {isSchool ? 'classes' : 'years of study'} added yet</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {academicYears.map((year, idx) => {
              const subs = isSchool ? classSubjects[year] || [] : [];
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.classItem}
                  activeOpacity={isSchool ? 0.7 : 1}
                  onPress={isSchool ? () => openEditClass(year) : undefined}
                >
                  <View style={styles.classItemHeader}>
                    <View style={styles.listItemLeft}>
                      <View style={styles.listItemNum}>
                        <Text style={styles.listItemNumText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.listItemText}>{year}</Text>
                    </View>
                    <View style={styles.classItemRight}>
                      {isSchool && (
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
                      )}
                      <TouchableOpacity onPress={() => removeClass(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {subs.length > 0 && (
                    <View style={styles.classSubjects}>
                      {subs.map((s, si) => (
                        <View key={si} style={styles.subjectTag}>
                          <Text style={styles.subjectTagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Terms / Semesters */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{isSchool ? 'Terms' : 'Semesters'}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{termCount}</Text>
          </View>
        </View>
        <Text style={styles.emptyHint}>
          Number of {isSchool ? 'terms' : 'semesters'} per academic session (1–12).
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={isSchool ? 'e.g. 3' : 'e.g. 2'}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={2}
            value={termCount}
            onChangeText={(value) => setTermCount(value.replace(/[^0-9]/g, ''))}
          />
        </View>
        <View style={styles.classSubjects}>
          {buildTerms(termCount, undefined, config.institutionType)[0].terms.map((term, idx) => (
            <View key={idx} style={styles.subjectTag}>
              <Text style={styles.subjectTagText}>{term}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Courses Section (college only) */}
      {!isSchool && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Courses</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{courses.length}</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. B.Tech"
              placeholderTextColor="#9CA3AF"
              value={newCourse}
              onChangeText={setNewCourse}
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem(newCourse, setNewCourse, courses, setCourses)}>
              <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {courses.length === 0 ? (
            <Text style={styles.emptyHint}>No courses added yet</Text>
          ) : (
            <View style={styles.chipContainer}>
              {courses.map((course, idx) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{course}</Text>
                  <TouchableOpacity onPress={() => removeItem(idx, courses, setCourses, 'courses')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="close-circle" size={14} color="#1A1B1C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <MaterialCommunityIcons name="content-save-outline" size={18} color="#1A1B1C" />
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Academic Structure'}</Text>
      </TouchableOpacity>

      {/* Add / Edit Class Modal */}
      <Modal visible={classModalOpen} transparent animationType="fade" onRequestClose={() => setClassModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClass ? `Edit ${editingClass}` : isSchool ? 'Add Class' : 'Add Year of Study'}
              </Text>
              <TouchableOpacity onPress={() => setClassModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            {!editingClass && (
              <>
                <Text style={styles.modalLabel}>{isSchool ? 'Class Name' : 'Year Name'}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={isSchool ? 'e.g. Class 1' : 'e.g. 1st Year'}
                  placeholderTextColor="#9CA3AF"
                  value={modalClassName}
                  onChangeText={setModalClassName}
                />
                {isSchool && (
                  <>
                    <TouchableOpacity
                      style={styles.checkRow}
                      onPress={() => setModalAutoSections((v) => !v)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkBox, modalAutoSections && styles.checkBoxActive]}>
                        {modalAutoSections && <MaterialCommunityIcons name="check" size={13} color="#1A1B1C" />}
                      </View>
                      <Text style={styles.checkLabel}>Add sections automatically</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalHint}>
                      Creates:{' '}
                      {modalAutoSections && sections.length > 0
                        ? sections.map((sec) => `${modalClassName.trim() || 'Class'} ${sec}`).join(', ')
                        : modalClassName.trim() || 'Class'}
                    </Text>
                  </>
                )}
              </>
            )}

            {isSchool && (
              <>
                <Text style={styles.modalLabel}>Subjects</Text>
                {departments.length === 0 ? (
                  <Text style={styles.emptyHint}>Add subjects in the section above first.</Text>
                ) : (
                  <>
                    <View style={styles.subjectSearchBox}>
                      <MaterialCommunityIcons name="magnify" size={16} color="#6B6B6B" />
                      <TextInput
                        style={styles.subjectSearchInput}
                        placeholder="Search subjects..."
                        placeholderTextColor="#9CA3AF"
                        value={subjectSearch}
                        onChangeText={setSubjectSearch}
                      />
                      {subjectSearch ? (
                        <TouchableOpacity onPress={() => setSubjectSearch('')}>
                          <MaterialCommunityIcons name="close" size={14} color="#6B6B6B" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={styles.subjectListContainer}>
                      <FlatList
                        data={departments.filter((subj) => subj.toLowerCase().includes(subjectSearch.toLowerCase()))}
                        keyExtractor={(item, idx) => idx.toString()}
                        renderItem={({ item: subj, index: idx }) => {
                          const selected = modalSubjects.includes(subj);
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[styles.subjectOption, selected && styles.subjectOptionActive]}
                              onPress={() => toggleModalSubject(subj)}
                            >
                              <View style={[styles.checkBox, selected && styles.checkBoxActive]}>
                                {selected && <MaterialCommunityIcons name="check" size={13} color="#1A1B1C" />}
                              </View>
                              <Text style={[styles.subjectOptionText, selected && styles.subjectOptionTextActive]}>{subj}</Text>
                            </TouchableOpacity>
                          );
                        }}
                        showsVerticalScrollIndicator={true}
                      />
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setClassModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveClass}>
                <Text style={styles.modalSaveText}>{editingClass ? 'Save Changes' : isSchool ? 'Save Class' : 'Save Year'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  instIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF4C7', borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  instName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  instCode: { fontSize: 12, color: '#6B7280', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  statusBadge: { backgroundColor: '#FFF4C7', borderWidth: 1, borderColor: '#F4C430', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.chip},
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: '#92400E', letterSpacing: 0.3 },
  infoDivider: { height: 1, backgroundColor: '#F1F5F9' },
  infoYearRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  infoYearText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  infoStatsRow: { flexDirection: 'row', alignItems: 'center' },
  infoStat: { flex: 1, alignItems: 'center', gap: 2 },
  infoStatDivider: { width: 1, height: 28, backgroundColor: '#F1F5F9' },
  infoStatValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  infoStatLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  countBadge: { backgroundColor: '#1A1B1C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.chip},
  countBadgeText: { fontSize: 11, fontWeight: '800', color: '#F4C430' },
  emptyHint: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 4 },
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: 20, backgroundColor: '#FAFAF7', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E8E5DC', borderStyle: 'dashed' },
  listBox: { borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E8E5DC', overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDE4' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  listItemNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F4C430', alignItems: 'center', justifyContent: 'center' },
  listItemNumText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C' },
  listItemText: { fontSize: 13, fontWeight: '600', color: '#1A1B1C', flex: 1 },
  pwStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: BorderRadius.chip},
  pwStatusSet: { backgroundColor: '#F4C430' },
  pwStatusWillClear: { backgroundColor: '#FEF3C7' },
  pwStatusText: { fontSize: 12, fontWeight: '600', color: '#1A1B1C', flex: 1 },
  pwClearText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C', textDecorationLine: 'underline' },
  pwRules: { fontSize: 11, color: '#9CA3AF' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  addBtn: {
    backgroundColor: '#F4C430',
    height: 42,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  addBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  addBtnFull: {
    backgroundColor: '#F4C430',
    height: 42,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  classItem: { borderBottomWidth: 1, borderBottomColor: '#F0EDE4', backgroundColor: '#FFFFFF' },
  classItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11 },
  classItemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  classSubjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 10, paddingLeft: 46 },
  subjectTag: { backgroundColor: '#F4C430', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.chip},
  subjectTagText: { fontSize: 11, fontWeight: '700', color: '#1A1B1C' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, gap: 12, borderWidth: 1, borderColor: '#E8E5DC', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1B1C' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  modalHint: { fontSize: 11, color: '#6B6B6B', marginTop: -6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  checkLabel: { fontSize: 13, fontWeight: '600', color: '#1A1B1C' },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
  },
  subjectSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1B1C',
    backgroundColor: 'transparent',
    outlineWidth: 0,
  },
  subjectListContainer: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.card,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE4',
  },
  subjectOptionActive: { backgroundColor: '#FFFDF7' },
  subjectOptionText: { fontSize: 13, fontWeight: '600', color: '#1A1B1C' },
  subjectOptionTextActive: { fontWeight: '700' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  modalCancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  modalSaveBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
  saveBtn: {
    backgroundColor: '#F4C430',
    height: 48,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 14 },
});