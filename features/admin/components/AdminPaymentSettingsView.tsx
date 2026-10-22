/**
 * @file AdminPaymentSettingsView.tsx
 * @description Admin-only Razorpay configuration (PAYMENTS.md Phase 6):
 *  - per-tenant credentials stored AES-256-GCM encrypted server-side
 *  - secrets are WRITE-ONLY: never returned by the API, blank = keep stored
 *  - shows the per-tenant webhook URL that must be registered on the
 *    Razorpay dashboard (path selects the HMAC secret that verifies it)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { FontFamily } from '../../../constants/fonts';
import { showAlert } from '../../shared/utils/showAlert';
import { BorderRadius } from '../../../constants/theme';
import { AdminSkeleton } from './skeletons/AdminSkeletons';
import {
  fetchPaymentConfigApi,
  savePaymentConfigApi,
  type PublicPaymentConfig,
} from '../../../api/payments';

interface AdminPaymentSettingsViewProps {
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const AdminPaymentSettingsView: React.FC<AdminPaymentSettingsViewProps> = ({ refreshing = false, onRefresh }) => {
  const [config, setConfig] = useState<PublicPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPaymentConfigApi();
      setConfig(res ?? null);
      setLoadError(null);
      if (res) {
        setKeyId(res.keyId);
        setIsActive(res.isActive);
        // First-time setup stays in edit mode.
        setEditing(false);
      } else {
        setEditing(true);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load payment settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const isSetup = !config;

  const handleSave = async () => {
    if (!keyId.trim() || keyId.trim().length < 4) {
      showAlert('Missing Key ID', 'Enter the Razorpay Key ID (rzp_test_… or rzp_live_…).');
      return;
    }
    if ((isSetup || config?.hasKeySecret === false) && keySecret.trim().length < 4) {
      showAlert('Missing Key Secret', 'Enter the Key Secret for the first-time setup.');
      return;
    }
    if ((isSetup || config?.hasWebhookSecret === false) && webhookSecret.trim().length < 4) {
      showAlert('Missing Webhook Secret', 'Enter the Webhook Secret for the first-time setup.');
      return;
    }
    setSaving(true);
    try {
      const res = await savePaymentConfigApi({
        keyId: keyId.trim(),
        keySecret: keySecret.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
        isActive,
      });
      setConfig(res);
      setKeySecret('');
      setWebhookSecret('');
      setEditing(false);
      showAlert('Saved', 'Payment settings updated. Secrets are encrypted and stored.');
    } catch (err: any) {
      showAlert('Save Failed', err?.message || 'Could not save payment settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhook = async () => {
    if (!config?.webhookUrl) return;
    try {
      await Clipboard.setStringAsync(config.webhookUrl);
      showAlert('Copied', 'Webhook URL copied to clipboard.');
    } catch {
      showAlert('Webhook URL', config.webhookUrl);
    }
  };

  if (loading) {
    return <AdminSkeleton tab="payments" />;
  }

  if (loadError) {
    return (
      <View style={styles.centerBox}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#DC3545" />
        <Text style={styles.centerText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#16A34A" />
          <Text style={styles.headerTitle}>Payment Settings</Text>
        </View>
        {!editing ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditing(true)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color="#1A1B1C" />
            <Text style={styles.editBtnText}>{config ? 'Edit' : 'Set Up'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status card */}
      {!editing ? (
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: config?.isActive ? '#DCFCE7' : '#F1F0EA' },
              ]}
            >
              <MaterialCommunityIcons
                name={config?.isActive ? 'check-circle' : 'pause-circle'}
                size={13}
                color={config?.isActive ? '#16A34A' : '#6B6B6B'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: config?.isActive ? '#16A34A' : '#6B6B6B' },
                ]}
              >
                {config?.isActive ? 'ACTIVE' : 'DISABLED'}
              </Text>
            </View>
            <Text style={styles.gatewayText}>Razorpay</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Key ID</Text>
            <Text style={styles.detailValue} selectable>
              {config?.keyId || '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Key Secret</Text>
            <Text style={[styles.detailValue, { color: config?.hasKeySecret ? '#16A34A' : '#DC3545' }]}>
              {config?.hasKeySecret ? 'Stored (encrypted)' : 'Not set'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Webhook Secret</Text>
            <Text
              style={[
                styles.detailValue,
                { color: config?.hasWebhookSecret ? '#16A34A' : '#DC3545' },
              ]}
            >
              {config?.hasWebhookSecret ? 'Stored (encrypted)' : 'Not set'}
            </Text>
          </View>

          <View style={styles.webhookBox}>
            <View style={styles.webhookHeader}>
              <MaterialCommunityIcons name="webhook" size={14} color="#B8860B" />
              <Text style={styles.webhookLabel}>Webhook URL (register on Razorpay)</Text>
              <TouchableOpacity onPress={handleCopyWebhook} style={styles.copyBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="content-copy" size={13} color="#1A1B1C" />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.webhookUrl} selectable>
              {config?.webhookUrl || '—'}
            </Text>
            {config?.webhookUrl?.startsWith('/') ? (
              <Text style={styles.webhookWarn}>
                Relative URL — set PAYMENT_WEBHOOK_BASE_URL on the server (public https origin,
                e.g. your ngrok domain) to get the full link.
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        /* ── Edit / setup form ── */
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isSetup ? 'Connect Razorpay' : 'Update credentials'}
          </Text>

          <Text style={styles.fieldLabel}>Key ID *</Text>
          <TextInput
            style={styles.input}
            value={keyId}
            onChangeText={setKeyId}
            placeholder="rzp_test_xxxxxxxxxxxx"
            placeholderTextColor="#A0A0A0"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>
            Key Secret {config?.hasKeySecret ? '(leave blank to keep)' : '*'}
          </Text>
          <TextInput
            style={styles.input}
            value={keySecret}
            onChangeText={setKeySecret}
            placeholder={config?.hasKeySecret ? '•••••••• (stored)' : 'xxxxxxxxxxxxxxxxxx'}
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>
            Webhook Secret {config?.hasWebhookSecret ? '(leave blank to keep)' : '*'}
          </Text>
          <TextInput
            style={styles.input}
            value={webhookSecret}
            onChangeText={setWebhookSecret}
            placeholder={config?.hasWebhookSecret ? '•••••••• (stored)' : 'choose a strong secret'}
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.fieldHint}>
            Same value you will paste in Razorpay Dashboard → Settings → Webhooks → Secret. Used to
            verify every webhook signature.
          </Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Accept online payments</Text>
              <Text style={styles.fieldHint}>Turn off to hide checkout without deleting keys.</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#D9D6CC', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.formBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditing(false);
                setKeySecret('');
                setWebhookSecret('');
                if (config) setKeyId(config.keyId);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Setup guide */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>How to go live (test mode first)</Text>
        {[
          'Create an account on dashboard.razorpay.com → Settings → API Keys → Generate Test Key.',
          'Copy the Key ID & Key Secret above (secrets are encrypted — we never show them again).',
          `Register the Webhook URL with events: payment.captured, refund.processed, payment.failed${config?.webhookUrl ? '' : ' (available after the first save)'}.`,
          'Set the same Webhook Secret in both places. Every payload is HMAC-SHA256 verified per institution.',
          'While PAYMENT_MODE=test, live keys (rzp_live_…) are rejected — switch the server env only after UAT.',
        ].map((step, i) => (
          <View key={i} style={styles.guideStep}>
            <View style={styles.guideNum}>
              <Text style={styles.guideNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.guideStepText}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 32, gap: 14 },
  centerBox: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  centerText: {
    fontSize: 13,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryBtn: { backgroundColor: '#F4C430', paddingHorizontal: 22, paddingVertical: 9, borderRadius: BorderRadius.button},
  retryBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', fontFamily: FontFamily.extrabold },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
  },
  editBtnText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
  },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800', fontFamily: FontFamily.extrabold, letterSpacing: 0.4 },
  gatewayText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B', fontFamily: FontFamily.bold },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#6B6B6B', fontFamily: FontFamily.regular },
  detailValue: { fontSize: 12.5, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold, flexShrink: 1, textAlign: 'right' },
  webhookBox: {
    backgroundColor: '#FBFAF6',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#EFEDE6',
    padding: 10,
    marginTop: 4,
    gap: 6,
  },
  webhookHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webhookLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: '#B8860B', fontFamily: FontFamily.bold },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D6CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  copyBtnText: { fontSize: 10.5, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  webhookUrl: { fontSize: 11.5, color: '#1A1B1C', fontFamily: FontFamily.regular },
  webhookWarn: { fontSize: 11, color: '#DC3545', fontFamily: FontFamily.regular, lineHeight: 16 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 6,
  },
  formTitle: { fontSize: 14, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold, marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold, marginTop: 6 },
  input: {
    backgroundColor: '#FBFAF6',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A1B1C',
    fontFamily: FontFamily.regular,
  },
  fieldHint: { fontSize: 11, color: '#8A8A8A', fontFamily: FontFamily.regular, lineHeight: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  switchLabel: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  formBtnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderRadius: BorderRadius.chip,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D6CC',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  saveBtn: {
    flex: 2,
    borderRadius: BorderRadius.chip,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#16A34A',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: FontFamily.extrabold },
  guideCard: {
    backgroundColor: '#FBFAF6',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#EFEDE6',
    padding: 14,
    gap: 10,
  },
  guideTitle: { fontSize: 13, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  guideStep: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  guideNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  guideNumText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  guideStepText: { flex: 1, fontSize: 12, color: '#4A4A4A', lineHeight: 18, fontFamily: FontFamily.regular },
});