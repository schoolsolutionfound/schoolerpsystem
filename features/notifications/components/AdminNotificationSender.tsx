import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { AppButton } from '../../shared/components/AppButton';
import {
  createCampaignApi,
  launchCampaignApi,
  getNotificationStatsApi,
  NotificationStats,
} from '../../../api/notifications';
import { showAlert } from '../../shared/utils/showAlert';

const TARGET_OPTIONS = [
  { key: 'all', label: 'All Users', icon: 'account-group', roles: undefined, allUsers: true },
  { key: 'students', label: 'Students', icon: 'school', roles: ['student'] },
  { key: 'teachers', label: 'Teachers', icon: 'teach', roles: ['teacher'] },
  { key: 'parents', label: 'Parents', icon: 'human-male-female', roles: ['parent'] },
  { key: 'staff', label: 'Staff', icon: 'account-tie', roles: ['admin', 'teacher', 'hod', 'principal', 'accountant'] },
] as const;

const PRIORITY_OPTIONS = [
  { key: 'low', label: 'Low', color: '#6B7280' },
  { key: 'normal', label: 'Normal', color: '#3B82F6' },
  { key: 'high', label: 'High', color: '#F59E0B' },
  { key: 'urgent', label: 'Urgent', color: '#EF4444' },
] as const;

const TYPE_OPTIONS = [
  'announcement',
  'reminder',
  'general',
  'fee',
  'exam',
  'homework',
  'attendance',
  'bus',
  'system',
] as const;

export function AdminNotificationSender() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  const [selectedType, setSelectedType] = useState<string>('announcement');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  const fetchStats = useCallback(() => {
    getNotificationStatsApi()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSend = async () => {
    if (!title.trim()) {
      showAlert('Validation', 'Please enter a title');
      return;
    }
    if (!body.trim()) {
      showAlert('Validation', 'Please enter a message');
      return;
    }

    const target = TARGET_OPTIONS.find((t) => t.key === selectedTarget);
    if (!target) return;

    Alert.alert(
      'Send Notification',
      `Send "${title}" to ${target.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              if (selectedTarget === 'all') {
                // Use campaign for all users
                const campaignId = await createCampaignApi({
                  title,
                  body,
                  type: selectedType,
                  priority: selectedPriority,
                  target: { allUsers: true },
                });
                await launchCampaignApi(campaignId.id);
              } else if ('roles' in target && target.roles) {
                const campaignId = await createCampaignApi({
                  title,
                  body,
                  type: selectedType,
                  priority: selectedPriority,
                  target: { roles: [...target.roles] },
                });
                await launchCampaignApi(campaignId.id);
              }

              showAlert('Sent', `Notification sent to ${target.label}`);
              setTitle('');
              setBody('');
              fetchStats();
            } catch (error: any) {
              showAlert('Error', error.message || 'Failed to send notification');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F4C430' }]}>{stats.unread}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.sentToday}</Text>
            <Text style={styles.statLabel}>Sent Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#DC3545' }]}>{stats.failedToday}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>
      )}

      {/* Target */}
      <Text style={styles.sectionLabel}>Send To</Text>
      <View style={styles.targetGrid}>
        {TARGET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.targetChip, selectedTarget === option.key && styles.targetChipActive]}
            onPress={() => setSelectedTarget(option.key)}
          >
            <MaterialCommunityIcons
              name={option.icon as any}
              size={16}
              color={selectedTarget === option.key ? '#F4C430' : '#6B6B6B'}
            />
            <Text
              style={[styles.targetText, selectedTarget === option.key && styles.targetTextActive]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type */}
      <Text style={styles.sectionLabel}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {TYPE_OPTIONS.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Priority */}
      <Text style={styles.sectionLabel}>Priority</Text>
      <View style={styles.priorityRow}>
        {PRIORITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.priorityChip,
              selectedPriority === option.key && {
                backgroundColor: option.color,
                borderColor: option.color,
              },
            ]}
            onPress={() => setSelectedPriority(option.key)}
          >
            <Text
              style={[
                styles.priorityText,
                selectedPriority === option.key && { color: '#FFFFFF' },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.sectionLabel}>Title</Text>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Notification title"
        placeholderTextColor="#8A8A8A"
        maxLength={200}
      />

      {/* Body */}
      <Text style={styles.sectionLabel}>Message</Text>
      <TextInput
        style={styles.bodyInput}
        value={body}
        onChangeText={setBody}
        placeholder="Notification message..."
        placeholderTextColor="#8A8A8A"
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />

      {/* Send */}
      <AppButton
        title={sending ? 'Sending...' : 'Send Notification'}
        onPress={handleSend}
        disabled={sending || !title.trim() || !body.trim()}
        variant="primary"
        style={styles.sendButton}
      />
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
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#171717',
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#8A8A8A',
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: '#171717',
    marginBottom: 8,
    marginTop: 16,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 6,
  },
  targetChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  targetText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B6B6B',
  },
  targetTextActive: {
    color: '#F4C430',
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F7F5EE',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  typeText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B6B6B',
    textTransform: 'capitalize',
  },
  typeTextActive: {
    color: '#F4C430',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  priorityText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B6B6B',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: '#171717',
  },
  bodyInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#171717',
    minHeight: 120,
  },
  sendButton: {
    marginTop: 24,
  },
});
