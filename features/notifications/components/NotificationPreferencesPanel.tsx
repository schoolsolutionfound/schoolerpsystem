import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  getNotificationPreferencesApi,
  saveNotificationPreferencesApi,
  NOTIFIABLE_TYPES,
  NotificationPreferences,
} from '../../../api/notifications';
import { showAlert } from '../../shared/utils/showAlert';

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  attendance: { label: 'Attendance', icon: 'account-check', color: '#16A34A' },
  fee: { label: 'Fees & Payments', icon: 'cash', color: '#F4C430' },
  exam: { label: 'Exams & Results', icon: 'file-document-edit', color: '#3B82F6' },
  homework: { label: 'Homework', icon: 'notebook-edit', color: '#8B5CF6' },
  timetable: { label: 'Timetable', icon: 'calendar-clock', color: '#F97316' },
  bus: { label: 'Bus Tracking', icon: 'bus', color: '#06B6D4' },
  library: { label: 'Library', icon: 'book-open', color: '#84CC16' },
  chat: { label: 'Messages', icon: 'message-text', color: '#EC4899' },
  admission: { label: 'Admissions', icon: 'school', color: '#6366F1' },
  announcement: { label: 'Announcements', icon: 'bullhorn', color: '#EF4444' },
  reminder: { label: 'Reminders', icon: 'bell-ring', color: '#F59E0B' },
  system: { label: 'System', icon: 'cog', color: '#6B7280' },
};

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getNotificationPreferencesApi();
        if (mounted) setPrefs(data);
      } catch {
        if (mounted) setPrefs({ pushEnabled: true, disabledTypes: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const save = useCallback(async (next: NotificationPreferences) => {
    const previous = prefs;
    setPrefs(next);
    setSaving(true);
    try {
      const saved = await saveNotificationPreferencesApi(next);
      setPrefs(saved);
    } catch (error: any) {
      setPrefs(previous || { pushEnabled: true, disabledTypes: [] });
      showAlert('Error', error.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  const toggleType = useCallback(
    (type: string, enabled: boolean) => {
      if (!prefs) return;
      const disabled = new Set(prefs.disabledTypes);
      if (enabled) disabled.delete(type);
      else disabled.add(type);
      save({ ...prefs, disabledTypes: Array.from(disabled) });
    },
    [prefs, save]
  );

  if (loading || !prefs) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  const disabled = new Set(prefs.disabledTypes);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.masterCard}>
        <View style={styles.masterLeft}>
          <MaterialCommunityIcons name="bell-ring" size={22} color="#F4C430" />
          <View style={styles.masterTextWrap}>
            <Text style={styles.masterTitle}>Push Notifications</Text>
            <Text style={styles.masterSubtitle}>
              Receive alerts on this device even when the app is closed
            </Text>
          </View>
        </View>
        <Switch
          value={prefs.pushEnabled}
          onValueChange={(value) => save({ ...prefs, pushEnabled: value })}
          trackColor={{ false: '#D1D5DB', true: '#171717' }}
          thumbColor={prefs.pushEnabled ? '#F4C430' : '#F3F4F6'}
        />
      </View>

      <Text style={styles.sectionLabel}>Notify me about</Text>

      {NOTIFIABLE_TYPES.map((type) => {
        const meta = TYPE_LABELS[type] || { label: type, icon: 'bell', color: '#6B7280' };
        const enabled = !disabled.has(type);
        return (
          <View key={type} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: `${meta.color}15` }]}>
              <MaterialCommunityIcons name={meta.icon as any} size={18} color={meta.color} />
            </View>
            <Text style={styles.rowLabel}>{meta.label}</Text>
            <Switch
              value={enabled}
              disabled={!prefs.pushEnabled}
              onValueChange={(value) => toggleType(type, value)}
              trackColor={{ false: '#D1D5DB', true: '#171717' }}
              thumbColor={enabled && prefs.pushEnabled ? '#F4C430' : '#F3F4F6'}
            />
          </View>
        );
      })}

      {!prefs.pushEnabled && (
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={16} color="#8A8A8A" />
          <Text style={styles.infoText}>
            Push is off. You will still see notifications inside the app.
          </Text>
        </View>
      )}

      {saving && (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color="#F4C430" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  masterTextWrap: {
    flex: 1,
  },
  masterTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: '#171717',
  },
  masterSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#171717',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F5EE',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#8A8A8A',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  savingText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#8A8A8A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 12,
  },
});
