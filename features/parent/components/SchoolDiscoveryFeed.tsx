import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchInstitutionsApi } from '../../../api/institutions';
import { fetchAdmissionsApi } from '../../../api/admissions';
import { auth } from '../../../firebaseConfig';
import { Institution } from '../../developer/types/developer.types';
import { useUserStore } from '../../../store/useUserStore';

export const SchoolDiscoveryFeed = () => {
  const router = useRouter();
  const [schools, setSchools] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedSchoolInfo, setAcceptedSchoolInfo] = useState<{ code: string; name: string; childName: string } | null>(null);

  // User & Student Affiliation details from store
  const linkedStudentUSN = useUserStore((state) => state.linkedStudentUSN);
  const storeChildName = useUserStore((state) => state.childName);
  const userInstCode = useUserStore((state) => state.institutionCode || state.institutionId || state.schoolId);
  const userInstName = useUserStore((state) => state.institutionName || state.schoolName);

  // Check if student is affiliated with parent (either from store or from accepted admission)
  const effectiveCode = (userInstCode && userInstCode !== 'DEFAULT') ? userInstCode : (acceptedSchoolInfo?.code || '');
  const effectiveName = userInstName || acceptedSchoolInfo?.name || '';
  const effectiveChild = storeChildName || acceptedSchoolInfo?.childName || '';

  const isAffiliated = Boolean(
    (linkedStudentUSN && linkedStudentUSN.trim().length > 0) ||
    (effectiveChild && effectiveChild.trim().length > 0) ||
    (effectiveCode && effectiveCode.trim().length > 0 && effectiveCode !== 'DEFAULT')
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instData, admData] = await Promise.all([
          fetchInstitutionsApi(),
          auth.currentUser?.uid ? fetchAdmissionsApi({ parentId: auth.currentUser.uid }).catch(() => []) : Promise.resolve([]),
        ]);

        // Filter schools and sort by rating desc
        const list = (instData || []).filter(
          (inst) => !inst.institutionType || inst.institutionType === 'school'
        );
        list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        setSchools(list);

        // Check if parent has any officially accepted admission application
        const acceptedApp = (admData || []).find((a) => a.status === 'accepted');
        if (acceptedApp) {
          setAcceptedSchoolInfo({
            code: acceptedApp.schoolId,
            name: acceptedApp.schoolName || '',
            childName: acceptedApp.childFullName,
          });

          // Sync to store if not already set
          if (!storeChildName || !userInstCode || userInstCode === 'DEFAULT') {
            useUserStore.getState().setUserProfile({
              childName: acceptedApp.childFullName,
              institutionCode: acceptedApp.schoolId,
              schoolId: acceptedApp.schoolId,
              institutionName: acceptedApp.schoolName,
              schoolName: acceptedApp.schoolName,
              relation: 'Parent',
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data for school discovery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeChildName, userInstCode]);

  // Filter schools: If affiliated, ONLY show the school that the student is affiliated with!
  const displayedSchools = useMemo(() => {
    if (!isAffiliated) {
      return schools;
    }

    const matched = schools.filter((s) => {
      const codeMatch =
        effectiveCode &&
        (s.institutionCode?.toUpperCase() === effectiveCode.toUpperCase() ||
          s.id?.toUpperCase() === effectiveCode.toUpperCase());
      const nameMatch =
        effectiveName &&
        s.institutionName?.toLowerCase().trim() === effectiveName.toLowerCase().trim();
      return Boolean(codeMatch || nameMatch);
    });

    if (matched.length > 0) {
      return matched;
    }

    // Fallback if the affiliated school was not in the default list
    if (effectiveName || effectiveCode) {
      const fallbackSchool: Institution = {
        id: effectiveCode || 'AFFILIATED_SCHOOL',
        institutionCode: effectiveCode || 'AFFILIATED',
        institutionName: effectiveName || 'Affiliated Campus',
        institutionType: 'school',
        subscriptionStatus: 'active',
        description: 'Your currently affiliated institution campus.',
        averageRating: 5.0,
        totalReviews: 1,
      };
      return [fallbackSchool];
    }

    return schools;
  }, [schools, isAffiliated, effectiveCode, effectiveName]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Affiliation Banner when affiliated */}
      {isAffiliated && (
        <View style={styles.affiliationBanner}>
          <View style={styles.affiliationIconWrap}>
            <MaterialCommunityIcons name="shield-check" size={22} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.affiliationTitle}>Student Affiliated Campus</Text>
            <Text style={styles.affiliationSub}>
              Showing only your student&apos;s affiliated school (
              {effectiveChild ? `${effectiveChild}` : linkedStudentUSN || effectiveName || 'Enrolled'}
              ).
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={displayedSchools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialCommunityIcons name="school-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No affiliated school records found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <MaterialCommunityIcons name="school" size={40} color="#0284C7" />
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.schoolName}>{item.institutionName}</Text>
                {isAffiliated && (
                  <View style={styles.enrolledBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={13} color="#10B981" />
                    <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                  </View>
                )}
              </View>

              <View style={styles.codeRow}>
                <Text style={styles.codeText}>Code: {item.institutionCode}</Text>
              </View>

              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {item.averageRating ? item.averageRating.toFixed(1) : '5.0'} 
                  {item.totalReviews ? ` (${item.totalReviews} reviews)` : ' (Official Campus)'}
                </Text>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {item.description || "Official affiliated school offering comprehensive academic curriculum."}
              </Text>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => router.push(`/(parent)/schools/${item.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>
                  {isAffiliated ? 'View School Profile & Details' : 'View Profile & Apply'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#718096', marginTop: 8 },
  listContainer: { padding: 16, gap: 16 },

  // Affiliation Alert Banner
  affiliationBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  affiliationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  affiliationSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 1,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logo: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  enrolledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  codeRow: {
    marginTop: 2,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  applyBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
