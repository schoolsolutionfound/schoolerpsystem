import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily, FontSize } from '../../../constants/fonts';

interface ChangePasswordFormProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword1: boolean;
  setShowPassword1: (val: boolean) => void;
  showPassword2: boolean;
  setShowPassword2: (val: boolean) => void;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase?: boolean;
  hasNumber: boolean;
  hasSpecial?: boolean;
  passedChecksCount: number;
  strengthLabel: string;
  strengthColor: string;
  loading: boolean;
  onSubmit: () => void;
  submitButtonText?: string;
  theme?: 'light' | 'dark';
  hideStrengthMeter?: boolean;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword1,
  setShowPassword1,
  showPassword2,
  setShowPassword2,
  hasMinLength,
  hasUppercase,
  hasLowercase = false,
  hasNumber,
  hasSpecial = false,
  passedChecksCount,
  strengthLabel,
  strengthColor,
  loading,
  onSubmit,
  submitButtonText,
  theme = 'light',
  hideStrengthMeter = false,
}) => {
  const dark = theme === 'dark';

  return (
    <View style={styles.formCard}>
      {/* New Password */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, dark && styles.inputLabelDark]}>New Password</Text>
        <View style={[styles.passwordRow, dark && styles.passwordRowDark]}>
          <TextInput
            style={[styles.passwordInput, dark && styles.passwordInputDark]}
            placeholder="Enter new password"
            placeholderTextColor={dark ? '#6B6B6B' : '#6B6B6B'}
            secureTextEntry={!showPassword1}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword1(!showPassword1)} style={styles.eyeBtn}>
            <MaterialCommunityIcons name={showPassword1 ? 'eye-off-outline' : 'eye-outline'} size={20} color={dark ? '#9CA3AF' : '#6B6B6B'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, dark && styles.inputLabelDark]}>Confirm Password</Text>
        <View style={[styles.passwordRow, dark && styles.passwordRowDark]}>
          <TextInput
            style={[styles.passwordInput, dark && styles.passwordInputDark]}
            placeholder="Confirm new password"
            placeholderTextColor={dark ? '#6B6B6B' : '#6B6B6B'}
            secureTextEntry={!showPassword2}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)} style={styles.eyeBtn}>
            <MaterialCommunityIcons name={showPassword2 ? 'eye-off-outline' : 'eye-outline'} size={20} color={dark ? '#9CA3AF' : '#6B6B6B'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Strength - Circular Indicator */}
      {!hideStrengthMeter && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthCircleWrapper}>
            <View style={[
              styles.strengthCircle,
              { borderColor: strengthColor },
              { borderWidth: 6 },
            ]}>
              <View style={styles.strengthCircleInner}>
                <Text style={[
                  styles.strengthPercent,
                  { color: strengthColor }
                ]}>{Math.round((passedChecksCount / 5) * 100)}%</Text>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
              </View>
            </View>
          </View>

          {/* Requirements Checklist - Modern Card Style */}
          <View style={styles.checklistCard}>
            <View style={styles.checklistHeader}>
              <MaterialCommunityIcons name="shield-outline" size={18} color="#F4C430" />
              <Text style={styles.checklistTitle}>Password must contain:</Text>
            </View>

            <View style={styles.checklistGrid}>
              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIconWrapper,
                  hasMinLength && styles.checkIconActive
                ]}>
                  <MaterialCommunityIcons
                    name={hasMinLength ? 'check' : 'close'}
                    size={14}
                    color={hasMinLength ? '#FFFFFF' : '#6B7280'}
                  />
                </View>
                <Text style={[styles.checkItemText, hasMinLength && styles.checkItemActiveText]}>8+ characters</Text>
              </View>

              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIconWrapper,
                  hasUppercase && styles.checkIconActive
                ]}>
                  <MaterialCommunityIcons
                    name={hasUppercase ? 'check' : 'close'}
                    size={14}
                    color={hasUppercase ? '#FFFFFF' : '#6B7280'}
                  />
                </View>
                <Text style={[styles.checkItemText, hasUppercase && styles.checkItemActiveText]}>Uppercase (A-Z)</Text>
              </View>

              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIconWrapper,
                  hasLowercase && styles.checkIconActive
                ]}>
                  <MaterialCommunityIcons
                    name={hasLowercase ? 'check' : 'close'}
                    size={14}
                    color={hasLowercase ? '#FFFFFF' : '#6B7280'}
                  />
                </View>
                <Text style={[styles.checkItemText, hasLowercase && styles.checkItemActiveText]}>Lowercase (a-z)</Text>
              </View>

              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIconWrapper,
                  hasNumber && styles.checkIconActive
                ]}>
                  <MaterialCommunityIcons
                    name={hasNumber ? 'check' : 'close'}
                    size={14}
                    color={hasNumber ? '#FFFFFF' : '#6B7280'}
                  />
                </View>
                <Text style={[styles.checkItemText, hasNumber && styles.checkItemActiveText]}>Number (0-9)</Text>
              </View>

              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIconWrapper,
                  hasSpecial && styles.checkIconActive
                ]}>
                  <MaterialCommunityIcons
                    name={hasSpecial ? 'check' : 'close'}
                    size={14}
                    color={hasSpecial ? '#FFFFFF' : '#6B7280'}
                  />
                </View>
                <Text style={[styles.checkItemText, hasSpecial && styles.checkItemActiveText]}>Special char</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Primary Submit Button */}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>{submitButtonText || 'Continue'}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#1A1B1C" style={{ marginLeft: 6 }} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: FontSize.sub, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B7280' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 52,
  },
  passwordInput: { flex: 1, fontSize: FontSize.body, color: '#111827' },
  eyeBtn: { padding: 4 },
  strengthContainer: { gap: 16, marginTop: 4 },
  strengthCircleWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  strengthCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthCircleInner: { alignItems: 'center', gap: 2 },
  strengthPercent: { fontSize: 28, fontWeight: '800', fontFamily: FontFamily.extrabold },
  strengthLabel: { fontSize: FontSize.caption, fontWeight: '600', fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  checklistTitle: { fontSize: FontSize.sub, fontWeight: '700', fontFamily: FontFamily.bold, color: '#111827' },
  checklistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    minWidth: 140,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  checkIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconActive: { backgroundColor: '#F4C430' },
  checkItemText: { fontSize: FontSize.caption, color: '#6B7280', fontFamily: FontFamily.medium, flex: 1 },
  checkItemActiveText: { color: '#111827', fontWeight: '600', fontFamily: FontFamily.semibold },
  button: {
    backgroundColor: '#F4C430',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#F4C430',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  buttonText: { color: '#1A1B1C', fontSize: FontSize.body, fontWeight: '700', fontFamily: FontFamily.bold },
  inputLabelDark: { color: '#9CA3AF' },
  passwordRowDark: { backgroundColor: '#1F1F1F', borderColor: 'rgba(244,196,48,0.15)' },
  passwordInputDark: { color: '#E5E7EB' },
  strengthTitleDark: { color: '#9CA3AF' },
  meterSegmentDark: { backgroundColor: 'rgba(244,196,48,0.15)' },
  checklistCardDark: { backgroundColor: '#1F1F1F', borderColor: 'rgba(244,196,48,0.12)' },
  checklistTitleDark: { color: '#9CA3AF' },
  checkItemTextDark: { color: '#9CA3AF' },
  checkItemActiveDark: { color: '#F4C430', fontWeight: '600', fontFamily: FontFamily.semibold },
});
