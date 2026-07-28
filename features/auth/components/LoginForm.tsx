import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface LoginFormProps {
  isLogin: boolean;
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  fullName: string;
  setFullName: (text: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
  loading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  showPassword,
  setShowPassword,
  onSubmit,
  onToggleMode,
  loading,
}) => {
  return (
    <View style={styles.form}>
      {!isLogin && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#CBD5E0"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>
      )}

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

      {isLogin && (
        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
        </Text>
        <TouchableOpacity onPress={onToggleMode}>
          <Text style={styles.toggleLink}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
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
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13, color: '#7E57C2', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  toggleText: { fontSize: 13, color: '#718096' },
  toggleLink: { fontSize: 13, color: '#7E57C2', fontWeight: '700' },
});
