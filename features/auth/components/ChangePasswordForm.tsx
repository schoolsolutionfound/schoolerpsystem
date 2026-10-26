import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

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

      {/* Password Strength Meter */}
      {!hideStrengthMeter && (
        <>
          <View style={styles.strengthRow}>
            <Text style={[styles.strengthTitle, dark && styles.strengthTitleDark]}>Password Strength</Text>
            <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterSegment, dark && styles.meterSegmentDark, passedChecksCount >= 1 && { backgroundColor: strengthColor }]} />
            <View style={[styles.meterSegment, dark && styles.meterSegmentDark, passedChecksCount >= 2 && { backgroundColor: strengthColor }]} />
            <View style={[styles.meterSegment, dark && styles.meterSegmentDark, passedChecksCount >= 3 && { backgroundColor: strengthColor }]} />
            <View style={[styles.meterSegment, dark && styles.meterSegmentDark, passedChecksCount >= 4 && { backgroundColor: strengthColor }]} />
          </View>
        </>
      )}

      {/* Requirements Checklist */}
      <View style={[styles.checklistCard, dark && styles.checklistCardDark]}>
        <View style={styles.checklistHeader}>
          <MaterialCommunityIcons name="shield-outline" size={16} color="#F4C430" />
          <Text style={[styles.checklistTitle, dark && styles.checklistTitleDark]}>Password must contain:</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasMinLength ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasMinLength ? '#F4C430' : '#6B6B6B'}
          />
          <Text style={[styles.checkItemText, dark && styles.checkItemTextDark, hasMinLength && styles.checkItemActive, dark && hasMinLength && styles.checkItemActiveDark]}>At least 8 characters</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasUppercase ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasUppercase ? '#F4C430' : '#6B6B6B'}
          />
          <Text style={[styles.checkItemText, dark && styles.checkItemTextDark, hasUppercase && styles.checkItemActive, dark && hasUppercase && styles.checkItemActiveDark]}>One uppercase letter (A-Z)</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasLowercase ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasLowercase ? '#F4C430' : '#6B6B6B'}
          />
          <Text style={[styles.checkItemText, dark && styles.checkItemTextDark, hasLowercase && styles.checkItemActive, dark && hasLowercase && styles.checkItemActiveDark]}>One lowercase letter (a-z)</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasNumber ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasNumber ? '#F4C430' : '#6B6B6B'}
          />
          <Text style={[styles.checkItemText, dark && styles.checkItemTextDark, hasNumber && styles.checkItemActive, dark && hasNumber && styles.checkItemActiveDark]}>One number (0-9)</Text>
        </View>
      </View>

      {/* Primary Submit Button */}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>{submitButtonText || 'Continue'}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: { gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    height: 48,
  },
  passwordInput: { flex: 1, fontSize: 14, color: '#171717' },
  eyeBtn: { padding: 4 },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  strengthTitle: { fontSize: 12, color: '#6B6B6B' },
  strengthText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold },
  meterTrack: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  meterSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E8E5DC' },
  checklistCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFFDF7',
  },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  checklistTitle: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#6B6B6B' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkItemText: { fontSize: 12, color: '#6B6B6B' },
  checkItemActive: { color: '#171717', fontWeight: '600', fontFamily: FontFamily.semibold },
  button: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: FontFamily.bold },
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
