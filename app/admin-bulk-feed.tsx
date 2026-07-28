import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { singleFeedApi, bulkFeedApi } from '../api/admin';
import { handleGlobalError, AppError } from '../utils/errorHandler';
import { BulkFeedStep1 } from '../features/admin/components/BulkFeedStep1';
import { BulkFeedStep2 } from '../features/admin/components/BulkFeedStep2';
import { BulkFeedStep3 } from '../features/admin/components/BulkFeedStep3';

export default function AdminBulkFeedScreen() {
  const router = useRouter();

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [feedType, setFeedType] = useState<'student_bulk' | 'teacher_bulk' | 'individual'>('student_bulk');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; uri?: string } | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [overwriteUsers, setOverwriteUsers] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [email, setEmail] = useState('');
  const [dummyPassword] = useState('Pass@123');
  const [institutionCode] = useState('CLG001');
  const [institutionName] = useState('ABC Engineering College');

  const [csvText] = useState(
    `FirstName,LastName,RollNo_USN,Email,DummyPassword,InstitutionCode,InstitutionName\nAarav,Sharma,101,aarav.sharma@college.edu,Pass123,CLG001,ABC Engineering College\nRiya,Patel,102,riya.patel@school.edu,Pass123,CLG001,ABC Engineering College\nVivaan,Mehta,103,vivaan.mehta@college.edu,Pass123,CLG001,ABC Engineering College\nSneha,Singh,104,sneha.singh@school.edu,Pass123,CLG001,ABC Engineering College\nKartik,Joshi,105,kartik.joshi@college.edu,Pass123,CLG001,ABC Engineering College`
  );

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bulk' | 'users' | 'reports' | 'settings'>('bulk');

  const previewRows = [
    { initials: 'AS', name: 'Aarav Sharma', roll: '101', type: 'College', bg: '#EDE9F6', text: '#7E57C2' },
    { initials: 'RP', name: 'Riya Patel', roll: '102', type: 'School', bg: '#DCFCE7', text: '#16A34A' },
    { initials: 'VM', name: 'Vivaan Mehta', roll: '103', type: 'College', bg: '#EDE9F6', text: '#7E57C2' },
    { initials: 'SS', name: 'Sneha Singh', roll: '104', type: 'School', bg: '#DCFCE7', text: '#16A34A' },
    { initials: 'KJ', name: 'Kartik Joshi', roll: '105', type: 'College', bg: '#EDE9F6', text: '#7E57C2' },
  ];

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const sizeKb = asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : '23 KB';
        setSelectedFile({
          name: asset.name,
          size: sizeKb,
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('Document picker error:', err);
    }
  };

  const handleImportUsers = async () => {
    setLoading(true);
    try {
      if (feedType === 'individual') {
        if (!firstName || !lastName || !email) {
          handleGlobalError(new AppError('Please fill in required fields.', 'MISSING_FIELDS', 400));
          return;
        }
        await singleFeedApi({
          firstName,
          lastName,
          rollNoOrUSN: rollNoOrUSN || '101',
          email,
          dummyPassword,
          institutionCode,
          institutionName,
          institutionType: 'college',
          role: 'student',
        });
      } else {
        const lines = csvText.trim().split('\n');
        const records: any[] = [];
        const startIdx = lines[0].toLowerCase().includes('email') ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
          const row = lines[i].split(',').map((s) => s.trim());
          if (row.length >= 4) {
            records.push({
              firstName: row[0] || 'Student',
              lastName: row[1] || 'User',
              rollNoOrUSN: row[2] || `${100 + i}`,
              email: row[3] || `user${i}@college.edu`,
              dummyPassword: row[4] || 'Pass123',
              institutionCode: row[5] || 'CLG001',
              institutionName: row[6] || 'ABC Engineering College',
              institutionType: 'college',
              role: feedType === 'teacher_bulk' ? 'teacher' : 'student',
            });
          }
        }
        await bulkFeedApi(records);
      }
      setWizardStep(3);
    } catch (err: any) {
      setWizardStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {wizardStep === 1 && (
          <BulkFeedStep1
            router={router}
            feedType={feedType}
            setFeedType={setFeedType}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            handlePickDocument={handlePickDocument}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            rollNoOrUSN={rollNoOrUSN}
            setRollNoOrUSN={setRollNoOrUSN}
            email={email}
            setEmail={setEmail}
            onNextStep={() => setWizardStep(2)}
          />
        )}

        {wizardStep === 2 && (
          <BulkFeedStep2
            feedType={feedType}
            selectedFile={selectedFile}
            previewRows={previewRows}
            sendEmails={sendEmails}
            setSendEmails={setSendEmails}
            overwriteUsers={overwriteUsers}
            setOverwriteUsers={setOverwriteUsers}
            loading={loading}
            onImportUsers={handleImportUsers}
            onBack={() => setWizardStep(1)}
          />
        )}

        {wizardStep === 3 && (
          <BulkFeedStep3
            router={router}
            onResetStep={() => setWizardStep(1)}
          />
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/admin-home')}>
            <MaterialCommunityIcons name="home-outline" size={22} color={activeTab === 'dashboard' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('bulk')}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={22} color={activeTab === 'bulk' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'bulk' && styles.tabLabelActive]}>Bulk Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('users')}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color={activeTab === 'users' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'users' && styles.tabLabelActive]}>Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
            <MaterialCommunityIcons name="chart-bar" size={22} color={activeTab === 'reports' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('settings')}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={activeTab === 'settings' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '700' },
});
