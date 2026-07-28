import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

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
  hasNumber: boolean;
  hasSpecial: boolean;
  passedChecksCount: number;
  strengthLabel: string;
  strengthColor: string;
  loading: boolean;
  onSubmit: () => void;
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
  hasNumber,
  hasSpecial,
  passedChecksCount,
  strengthLabel,
  strengthColor,
  loading,
  onSubmit,
}) => {
  return (
    <View style={styles.formCard}>
      {/* New Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter new password"
            placeholderTextColor="#A0AEC0"
            secureTextEntry={!showPassword1}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword1(!showPassword1)} style={styles.eyeBtn}>
            <MaterialCommunityIcons name={showPassword1 ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A0AEC0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm new password"
            placeholderTextColor="#A0AEC0"
            secureTextEntry={!showPassword2}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)} style={styles.eyeBtn}>
            <MaterialCommunityIcons name={showPassword2 ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A0AEC0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Strength Meter */}
      <View style={styles.strengthRow}>
        <Text style={styles.strengthTitle}>Password Strength</Text>
        <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterSegment, passedChecksCount >= 1 && { backgroundColor: strengthColor }]} />
        <View style={[styles.meterSegment, passedChecksCount >= 2 && { backgroundColor: strengthColor }]} />
        <View style={[styles.meterSegment, passedChecksCount >= 3 && { backgroundColor: strengthColor }]} />
        <View style={[styles.meterSegment, passedChecksCount >= 4 && { backgroundColor: strengthColor }]} />
      </View>

      {/* Requirements Checklist */}
      <View style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <MaterialCommunityIcons name="shield-outline" size={16} color="#7E57C2" />
          <Text style={styles.checklistTitle}>Password must contain:</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasMinLength ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasMinLength ? '#7E57C2' : '#A0AEC0'}
          />
          <Text style={[styles.checkItemText, hasMinLength && styles.checkItemActive]}>At least 8 characters</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasUppercase ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasUppercase ? '#7E57C2' : '#A0AEC0'}
          />
          <Text style={[styles.checkItemText, hasUppercase && styles.checkItemActive]}>One uppercase letter</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasNumber ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasNumber ? '#7E57C2' : '#A0AEC0'}
          />
          <Text style={[styles.checkItemText, hasNumber && styles.checkItemActive]}>One number</Text>
        </View>

        <View style={styles.checkItem}>
          <MaterialCommunityIcons
            name={hasSpecial ? 'check-circle' : 'circle-outline'}
            size={16}
            color={hasSpecial ? '#7E57C2' : '#A0AEC0'}
          />
          <Text style={[styles.checkItemText, hasSpecial && styles.checkItemActive]}>One special character</Text>
        </View>
      </View>

      {/* Primary Submit Button */}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>Continue</Text>
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
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  passwordInput: { flex: 1, fontSize: 14, color: '#1A202C' },
  eyeBtn: { padding: 4 },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  strengthTitle: { fontSize: 12, color: '#718096' },
  strengthText: { fontSize: 12, fontWeight: '700' },
  meterTrack: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  meterSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  checklistCard: {
    backgroundColor: '#F8F9FB',
    borderRadius: BorderRadius.card,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  checklistTitle: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkItemText: { fontSize: 12, color: '#A0AEC0' },
  checkItemActive: { color: '#2D3748', fontWeight: '600' },
  button: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
