import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (email === 'admin@school.com' && password === 'admin123') {
      useUserStore.getState().setUserProfile({
        fullName: 'Admin User',
        email: 'admin@school.com',
        userRole: 'admin',
        schoolId: 'dev-school-001',
        schoolName: 'Dev School',
        isEmailVerified: true,
        isBypassUser: true,
      });
      useUserStore.getState().setIsProfileSynced(true);
      router.replace('/admin-home');
    } else {
      Alert.alert('Error', 'Invalid credentials. Try admin@school.com / admin123');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.content}>
            <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color="#1A202C" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="shield-crown" size={32} color="#667EEA" />
              </View>
              <Text style={styles.title}>Admin Login</Text>
              <Text style={styles.subtitle}>Sign in to manage your school</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={18} color="#A0AEC0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="admin@school.com"
                    placeholderTextColor="#A0AEC0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} color="#A0AEC0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#A0AEC0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Sign In</Text>
              </TouchableOpacity>

              <Text style={styles.hint}>Demo: admin@school.com / admin123</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F9' },
  content: { flex: 1, padding: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 36 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDE9F6', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
  subtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
  form: { gap: 16 },
  inputGroup: {},
  label: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A202C' },
  loginBtn: { backgroundColor: '#667EEA', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  hint: { fontSize: 12, color: '#A0AEC0', textAlign: 'center', marginTop: 12 },
});
