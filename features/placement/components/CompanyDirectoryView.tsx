import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { usePlacementStore } from '../store/usePlacementStore';
import { CompanyPartner, CompanyTier } from '../types/placement';

export const CompanyDirectoryView: React.FC = () => {
  const companies = usePlacementStore((s) => s.companies);
  const addCompany = usePlacementStore((s) => s.addCompany);
  const updateCompany = usePlacementStore((s) => s.updateCompany);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyPartner | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [hrContactName, setHrContactName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  const [tier, setTier] = useState<CompanyTier>('Tier 1');
  const [averageCTCLPA, setAverageCTCLPA] = useState('20.0');

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.hrContactName.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setName('');
    setIndustry('Technology / Software');
    setWebsite('https://careers.company.com');
    setHrContactName('');
    setHrEmail('');
    setHrPhone('+91 98');
    setTier('Tier 1');
    setAverageCTCLPA('24.0');
    setShowModal(true);
  };

  const handleOpenEdit = (c: CompanyPartner) => {
    setEditingCompany(c);
    setName(c.name);
    setIndustry(c.industry);
    setWebsite(c.website);
    setHrContactName(c.hrContactName);
    setHrEmail(c.hrEmail);
    setHrPhone(c.hrPhone);
    setTier(c.tier);
    setAverageCTCLPA(String(c.averageCTCLPA));
    setShowModal(true);
  };

  const handleSaveCompany = () => {
    if (!name.trim() || !hrContactName.trim()) {
      Alert.alert('Missing Info', 'Please enter Company Name and HR Contact Name.');
      return;
    }

    if (editingCompany) {
      updateCompany(editingCompany.id, {
        name: name.trim(),
        industry: industry.trim(),
        website: website.trim(),
        hrContactName: hrContactName.trim(),
        hrEmail: hrEmail.trim(),
        hrPhone: hrPhone.trim(),
        tier,
        averageCTCLPA: parseFloat(averageCTCLPA) || 12,
      });
      Alert.alert('Company Updated', `${name} updated in Recruiter CRM.`);
    } else {
      addCompany({
        name: name.trim(),
        industry: industry.trim(),
        website: website.trim(),
        hrContactName: hrContactName.trim(),
        hrEmail: hrEmail.trim(),
        hrPhone: hrPhone.trim(),
        tier,
        pastHiresCount: 0,
        activeDrivesCount: 0,
        averageCTCLPA: parseFloat(averageCTCLPA) || 12,
      });
      Alert.alert('Company Added', `${name} added to Recruiter CRM.`);
    }

    setShowModal(false);
  };

  const handleCallHR = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Recruiter', `Contacting ${phone}`);
    });
  };

  const handleEmailHR = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Emailing Recruiter', `Sending email to ${email}`);
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Add Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search company or HR contact..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Partner</Text>
        </TouchableOpacity>
      </View>

      {/* Recruiter List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.countText}>
          {filteredCompanies.length} Active Corporate Recruiting Partners
        </Text>

        {filteredCompanies.map((company) => (
          <View key={company.id} style={styles.companyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.companyGroup}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="domain" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <View style={styles.tierTag}>
                      <Text style={styles.tierText}>{company.tier}</Text>
                    </View>
                  </View>
                  <Text style={styles.industryText}>{company.industry}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => handleOpenEdit(company)} style={styles.editBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#059669" />
              </TouchableOpacity>
            </View>

            {/* HR Contact Box */}
            <View style={styles.hrBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hrName}>HR: {company.hrContactName}</Text>
                <Text style={styles.hrSub}>{company.hrEmail} • {company.hrPhone}</Text>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactIconBtn}
                  onPress={() => handleCallHR(company.hrPhone)}
                >
                  <MaterialCommunityIcons name="phone" size={16} color="#059669" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactIconBtn}
                  onPress={() => handleEmailHR(company.hrEmail)}
                >
                  <MaterialCommunityIcons name="email-outline" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Past Stats Footer */}
            <View style={styles.footerRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{company.pastHiresCount}</Text>
                <Text style={styles.statLabel}>Past Hires</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#059669' }]}>
                  ₹{company.averageCTCLPA} LPA
                </Text>
                <Text style={styles.statLabel}>Avg CTC</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: '#4F46E5' }]}>
                  {company.activeDrivesCount}
                </Text>
                <Text style={styles.statLabel}>Live Drives</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add / Edit Company Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCompany ? 'Edit Corporate Partner' : 'Register Corporate Recruiter'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Company Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Microsoft India"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Industry Domain</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Cloud & AI / Fintech"
                placeholderTextColor="#94A3B8"
                value={industry}
                onChangeText={setIndustry}
              />

              <Text style={styles.inputLabel}>Careers / Website URL</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://careers..."
                placeholderTextColor="#94A3B8"
                value={website}
                onChangeText={setWebsite}
              />

              <Text style={styles.inputLabel}>HR / Talent Lead Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Mr. Arvind Saxena"
                placeholderTextColor="#94A3B8"
                value={hrContactName}
                onChangeText={setHrContactName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>HR Email</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="hr@company.com"
                    placeholderTextColor="#94A3B8"
                    value={hrEmail}
                    onChangeText={setHrEmail}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>HR Phone</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="+91 98..."
                    placeholderTextColor="#94A3B8"
                    value={hrPhone}
                    onChangeText={setHrPhone}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Avg Package (LPA)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="24.0"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
                value={averageCTCLPA}
                onChangeText={setAverageCTCLPA}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCompany} activeOpacity={0.8}>
              <MaterialCommunityIcons name="content-save-check" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{editingCompany ? 'Update Recruiter' : 'Save Recruiter'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 },
  countText: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 10 },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  companyName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  tierTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: { fontSize: 9, fontWeight: '800', color: '#4F46E5' },
  industryText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  editBtn: { padding: 4 },
  hrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  hrName: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  hrSub: { fontSize: 10, color: '#64748B', marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: 6 },
  contactIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  statCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  statVal: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
