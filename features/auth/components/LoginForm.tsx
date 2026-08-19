import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface LoginFormProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onSubmit,
  loading,
}) => {
  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#CBD5E0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#CBD5E0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#A0AEC0"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? 'Please wait...' : 'Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 16, marginTop: 10 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#1A202C',
  },
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
  submitBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
