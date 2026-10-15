import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchInstitutionByIdApi } from '../../../api/institutions';
import { Institution } from '../../../features/developer/types/developer.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SchoolProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [school, setSchool] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const data = await fetchInstitutionByIdApi(id as string);
        setSchool(data);
      } catch (error) {
        console.error("Error fetching school details from backend:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSchool();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!school) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>School not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Profile</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {school.logoUrl ? (
          <Image source={{ uri: school.logoUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <MaterialCommunityIcons name="school" size={60} color="#94A3B8" />
          </View>
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.schoolName}>{school.institutionName}</Text>

          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {school.averageRating ? school.averageRating.toFixed(1) : 'New'} 
              <Text style={styles.ratingCount}>
                {school.totalReviews ? ` (${school.totalReviews} reviews)` : ' (No reviews yet)'}
              </Text>
            </Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {school.description || "No description provided for this institution yet."}
          </Text>

          {school.facilities && school.facilities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.facilitiesList}>
                {school.facilities.map((facility, index) => (
                  <View key={index} style={styles.facilityTag}>
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => router.push(`/(parent)/schools/apply/${school.id}`)}
          >
            <Text style={styles.applyBtnText}>Apply for Admission</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#718096', marginBottom: 16 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  backBtn: { padding: 12, backgroundColor: '#E2E8F0', borderRadius: 8 },
  backBtnText: { color: '#1A202C', fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  coverImage: { width: '100%', height: 200, resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: 200, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  detailsContainer: { padding: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  schoolName: { fontSize: 24, fontWeight: '700', color: '#1A202C', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 6 },
  ratingText: { fontSize: 16, color: '#1A202C', fontWeight: '700' },
  ratingCount: { color: '#718096', fontWeight: '400' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A202C', marginBottom: 12, marginTop: 8 },
  description: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 24 },
  facilitiesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  facilityTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  facilityText: { color: '#475569', fontSize: 14, fontWeight: '500' },
  applyBtn: { backgroundColor: '#4A90D9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  applyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
