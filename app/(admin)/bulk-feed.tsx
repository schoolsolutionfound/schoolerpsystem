import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useUserStore } from '../../store/useUserStore';
import { singleFeedApi, bulkFeedApi } from '../../api/admin';
import { handleGlobalError, AppError } from '../../utils/errorHandler';
import { BulkFeedStep1 } from '../../features/admin/components/BulkFeedStep1';
import { BulkFeedStep2 } from '../../features/admin/components/BulkFeedStep2';
import { BulkFeedStep3 } from '../../features/admin/components/BulkFeedStep3';

export default function AdminBulkFeedScreen() {
  const router = useRouter();
  const storeInstitutionCode = useUserStore((state) => state.institutionCode || state.institutionId) || 'CLG001';
  const storeInstitutionName = useUserStore((state) => state.institutionName) || 'My Institution';

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [feedType, setFeedType] = useState<'student_bulk' | 'teacher_bulk' | 'individual'>('student_bulk');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; uri?: string; content?: string } | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [overwriteUsers, setOverwriteUsers] = useState(false);
  const [, setImportError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualRole, setIndividualRole] = useState<'student' | 'teacher'>('student');
  const dummyPassword = 'Pass@123';

  const [csvRecords, setCsvRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bulk' | 'users' | 'reports' | 'settings'>('bulk');

  const parseCsvFromUri = async (uri: string): Promise<any[]> => {
    try {
      const response = await fetch(uri);
      const text = await response.text();
      const lines = text.trim().split('\n').filter(Boolean);
      if (lines.length < 2) return [];
      const records: any[] = [];
      const startIdx = 1;
      for (let i = startIdx; i < lines.length; i++) {
        const row = lines[i].split(',').map((s) => s.trim());
        if (row.length >= 4) {
          records.push({
            firstName: row[0] || 'User',
            lastName: row[1] || 'Unknown',
            rollNoOrUSN: row[2] || '',
            email: row[3] || `user${i}@school.edu`,
            dummyPassword: row[4] || dummyPassword,
            institutionCode: row[5] || storeInstitutionCode,
            institutionName: row[6] || storeInstitutionName,
            institutionType: 'college',
            role: feedType === 'teacher_bulk' ? 'teacher' : 'student',
          });
        }
      }
      return records;
    } catch {
      return [];
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const sizeKb = asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : '23 KB';
        const records = asset.uri ? await parseCsvFromUri(asset.uri) : [];
        setCsvRecords(records);
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
    setImportError(null);
    setLoading(true);
    try {
      if (feedType === 'individual') {
        if (!firstName || !lastName || !individualEmail) {
          handleGlobalError(new AppError('Please fill in required fields.', 'MISSING_FIELDS', 400));
          setLoading(false);
          return;
        }
        await singleFeedApi({
          firstName,
          lastName,
          rollNoOrUSN: rollNoOrUSN || '101',
          email: individualEmail,
          dummyPassword,
          institutionCode: storeInstitutionCode,
          institutionName: storeInstitutionName,
          institutionType: 'college',
          role: individualRole,
        });
        setImportCount(1);
      } else {
        const records = selectedFile?.uri ? await parseCsvFromUri(selectedFile.uri) : csvRecords;
        if (records.length === 0) {
          handleGlobalError(new AppError('No valid records found in file. Check CSV format.', 'EMPTY_FILE', 400));
          setLoading(false);
          return;
        }
        await bulkFeedApi(records);
        setImportCount(records.length);
      }
      setWizardStep(3);
    } catch (err: any) {
      setImportError(err.message || 'Import failed. Please try again.');
      handleGlobalError(err, 'Import failed');
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
            email={individualEmail}
            setEmail={setIndividualEmail}
            individualRole={individualRole}
            setIndividualRole={setIndividualRole}
            onNextStep={() => setWizardStep(2)}
          />
        )}

        {wizardStep === 2 && (
          <BulkFeedStep2
            feedType={feedType}
            selectedFile={selectedFile}
            totalRows={csvRecords.length || 1}
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
            importCount={importCount}
            roleName={feedType === 'teacher_bulk' || individualRole === 'teacher' ? 'teacher' : 'student'}
            onResetStep={() => {
              setWizardStep(1);
              setImportCount(0);
              setImportError(null);
            }}
          />
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(admin)/home')}>
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
