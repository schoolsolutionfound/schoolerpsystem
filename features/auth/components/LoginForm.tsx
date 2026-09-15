import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

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
      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="email-outline" size={18} color="#6B6B6B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#B0AEA8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#B0AEA8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6B6B6B"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot password link */}
      <TouchableOpacity style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#171717" size="small" />
        ) : (
          <Text style={styles.submitText}>Sign in</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 14 },

  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#171717',
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: '#171717',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#F4C430',
  },

  submitBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: {
    color: '#171717',
    fontSize: 16,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
});
