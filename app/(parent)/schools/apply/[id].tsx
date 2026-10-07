import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth } from '../../../../firebaseConfig';
import { createAdmissionApi } from '../../../../api/admissions';
import { useUserStore } from '../../../../store/useUserStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdmissionFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const storeFullName = useUserStore((s) => s.fullName);
  const storePhone = useUserStore((s) => s.phone || s.parentPhone);
  const storeEmail = useUserStore((s) => s.email);

  const [formData, setFormData] = useState({
    childFullName: '',
    childAge: '',
    childGender: 'male' as 'male' | 'female' | 'other',
    previousSchool: '',
    gradeApplyingFor: '',
    parentName: storeFullName || auth.currentUser?.displayName || '',
    parentPhone: storePhone || '',
    parentEmail: storeEmail || auth.currentUser?.email || '',
  });

  const handleSubmit = async () => {
    if (!formData.childFullName.trim() || !formData.childAge.trim() || !formData.gradeApplyingFor.trim()) {
      Alert.alert('Required Fields', 'Please fill in all required student details.');
      return;
    }

    if (!formData.parentPhone.trim()) {
      Alert.alert('Contact Number Required', 'Please enter a contact phone number so the school can reach you regarding admission.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to apply.');
      return;
    }

    setLoading(true);
    try {
      await createAdmissionApi({
        parentId: user.uid,
        parentName: formData.parentName.trim() || user.displayName || 'Parent/Guardian',
        parentPhone: formData.parentPhone.trim(),
        parentEmail: formData.parentEmail.trim() || undefined,
        schoolId: id as string,
        childFullName: formData.childFullName.trim(),
        childAge: parseInt(formData.childAge, 10),
        childGender: formData.childGender,
        previousSchool: formData.previousSchool.trim(),
        gradeApplyingFor: formData.gradeApplyingFor.trim(),
      });
      Alert.alert('Success', 'Application submitted successfully! The school will contact you shortly.', [
        { text: 'OK', onPress: () => router.replace('/(parent)/home') }
      ]);
    } catch (error: any) {
      console.error("Error submitting application to backend:", error);
      Alert.alert('Error', error?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admission Application</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Student Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-school-outline" size={20} color="#4A90D9" />
          <Text style={styles.sectionTitle}>Student Details</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Child's Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.childFullName}
            onChangeText={(t) => setFormData(prev => ({ ...prev, childFullName: t }))}
            placeholder="e.g. Ayaan Khan"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Age (Years) *</Text>
            <TextInput
              style={styles.input}
              value={formData.childAge}
              onChangeText={(t) => setFormData(prev => ({ ...prev, childAge: t }))}
              placeholder="e.g. 7"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1.3 }]}>
            <Text style={styles.label}>Grade Applying For *</Text>
            <TextInput
              style={styles.input}
              value={formData.gradeApplyingFor}
              onChangeText={(t) => setFormData(prev => ({ ...prev, gradeApplyingFor: t }))}
              placeholder="e.g. Grade 2"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.radioGroup}>
            {(['male', 'female', 'other'] as const).map(gender => (
              <TouchableOpacity
                key={gender}
                style={[styles.radioBtn, formData.childGender === gender && styles.radioBtnActive]}
                onPress={() => setFormData(prev => ({ ...prev, childGender: gender }))}
              >
                <Text style={[styles.radioText, formData.childGender === gender && styles.radioTextActive]}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Previous School (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.previousSchool}
            onChangeText={(t) => setFormData(prev => ({ ...prev, previousSchool: t }))}
            placeholder="e.g. Sunrise Primary School"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Contacts Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <MaterialCommunityIcons name="card-account-phone-outline" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Parent / Guardian Contacts</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parent / Guardian Name</Text>
          <TextInput
            style={styles.input}
            value={formData.parentName}
            onChangeText={(t) => setFormData(prev => ({ ...prev, parentName: t }))}
            placeholder="e.g. Farooq Khan"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Contact Number (Mobile) *</Text>
            <Text style={styles.badgeRequired}>Required</Text>
          </View>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="phone" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={formData.parentPhone}
              onChangeText={(t) => setFormData(prev => ({ ...prev, parentPhone: t }))}
              placeholder="e.g. +91 9876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.fieldHint}>School admission counselors will call this number for verification.</Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Gmail / Email Address</Text>
            <Text style={styles.badgeOptional}>Optional</Text>
          </View>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="email-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={formData.parentEmail}
              onChangeText={(t) => setFormData(prev => ({ ...prev, parentEmail: t }))}
              placeholder="e.g. parent.name@gmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.fieldHint}>Optional: to receive admission confirmations & fee receipts.</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.submitBtnContent}>
              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  scrollContent: { padding: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  badgeRequired: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeOptional: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingLeft: 12,
  },
  inputIcon: { marginRight: 6 },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
  },
  fieldHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  radioGroup: { flexDirection: 'row', gap: 8 },
  radioBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  radioBtnActive: {
    borderColor: '#4A90D9',
    backgroundColor: '#4A90D915',
  },
  radioText: { color: '#4A5568', fontWeight: '500' },
  radioTextActive: { color: '#4A90D9', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
