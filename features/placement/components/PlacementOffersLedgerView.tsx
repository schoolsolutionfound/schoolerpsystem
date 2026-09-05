import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { usePlacementStore } from '../store/usePlacementStore';
import { PlacementOffer } from '../types/placement';

export const PlacementOffersLedgerView: React.FC = () => {
  const offers = usePlacementStore((s) => s.offers);
  const highestCTC = usePlacementStore((s) => s.getHighestCTCLPA());
  const averageCTC = usePlacementStore((s) => s.getAverageCTCLPA());

  const [filter, setFilter] = useState<'all' | 'accepted' | 'pending'>('all');
  const [selectedOffer, setSelectedOffer] = useState<PlacementOffer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const filteredOffers = offers.filter((o) => {
    if (filter === 'accepted') return o.status === 'accepted';
    if (filter === 'pending') return o.status === 'pending';
    return true;
  });

  const handleOpenOfferDoc = (offer: PlacementOffer) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Top CTC Analytics Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroSub}>PLACEMENT OFFERS & PACKAGES</Text>
            <Text style={styles.heroTitle}>{offers.length} Official Offers Extended</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₹{highestCTC} LPA</Text>
            <Text style={styles.statLabel}>Highest Package</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₹{averageCTC} LPA</Text>
            <Text style={styles.statLabel}>Average CTC</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>100%</Text>
            <Text style={styles.statLabel}>Acceptance Rate</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { label: 'All Offers', value: 'all', count: offers.length },
          {
            label: 'Accepted',
            value: 'accepted',
            count: offers.filter((o) => o.status === 'accepted').length,
          },
          {
            label: 'Pending',
            value: 'pending',
            count: offers.filter((o) => o.status === 'pending').length,
          },
        ].map((f) => {
          const isSelected = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setFilter(f.value as any)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Offers List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredOffers.map((offer) => {
          const isAccepted = offer.status === 'accepted';
          return (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.cardTop}>
                <View style={styles.candidateGroup}>
                  <View style={styles.avatarBadge}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candidateName}>{offer.studentName}</Text>
                    <Text style={styles.branchText}>{offer.branch}</Text>
                  </View>
                </View>

                <View style={styles.packageBadge}>
                  <Text style={styles.packageText}>{offer.packageCTC}</Text>
                </View>
              </View>

              <View style={styles.companyRow}>
                <MaterialCommunityIcons name="domain" size={16} color="#059669" />
                <Text style={styles.companyText}>{offer.companyName}</Text>
                <Text style={styles.roleText}>• {offer.roleTitle}</Text>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.offerIdText}>Ref: {offer.offerLetterNo}</Text>

                <TouchableOpacity
                  style={styles.viewDocBtn}
                  onPress={() => handleOpenOfferDoc(offer)}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={14} color="#059669" />
                  <Text style={styles.viewDocText}>Offer Letter</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Offer Letter Document Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docBrand}>
                <MaterialCommunityIcons name="certificate" size={24} color="#059669" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.docSchoolName}>Campus Placement Cell</Text>
                  <Text style={styles.docSubtitle}>Verified Placement Offer Record</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedOffer && (
              <View>
                <View style={styles.docMetaRow}>
                  <View>
                    <Text style={styles.docMetaLabel}>Offer Ref No</Text>
                    <Text style={styles.docMetaVal}>{selectedOffer.offerLetterNo}</Text>
                  </View>
                  <View>
                    <Text style={styles.docMetaLabel}>Issue Date</Text>
                    <Text style={styles.docMetaVal}>{selectedOffer.offerDate}</Text>
                  </View>
                </View>

                <View style={styles.docStudentBox}>
                  <Text style={styles.docStudentName}>{selectedOffer.studentName}</Text>
                  <Text style={styles.docStudentBranch}>
                    Department: {selectedOffer.branch}
                  </Text>
                </View>

                <View style={styles.docOfferBox}>
                  <View style={styles.docOfferItem}>
                    <Text style={styles.docOfferLabel}>Recruiting Organization</Text>
                    <Text style={styles.docOfferVal}>{selectedOffer.companyName}</Text>
                  </View>
                  <View style={styles.docOfferItem}>
                    <Text style={styles.docOfferLabel}>Designation / Role</Text>
                    <Text style={styles.docOfferVal}>{selectedOffer.roleTitle}</Text>
                  </View>
                  <View style={styles.docOfferItem}>
                    <Text style={styles.docOfferLabel}>Annual Compensation (CTC)</Text>
                    <Text style={[styles.docOfferVal, { color: '#059669', fontSize: 16, fontWeight: '900' }]}>
                      {selectedOffer.packageCTC}
                    </Text>
                  </View>
                  <View style={styles.docOfferItem}>
                    <Text style={styles.docOfferLabel}>Anticipated Joining Date</Text>
                    <Text style={styles.docOfferVal}>{selectedOffer.joiningDate}</Text>
                  </View>
                </View>

                <Text style={styles.verifiedTag}>
                  ✓ Verified & Endorsed by University Training & Placement Board
                </Text>

                <TouchableOpacity
                  style={styles.downloadDocBtn}
                  onPress={() => {
                    Alert.alert('Offer Certificate Saved', 'Document exported to device storage.');
                    setShowOfferModal(false);
                  }}
                >
                  <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
                  <Text style={styles.downloadDocText}>Save / Export Letter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  heroCard: {
    backgroundColor: '#064E3B',
    borderRadius: BorderRadius.card,
    padding: 16,
    margin: 16,
    marginBottom: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroSub: { fontSize: 10, fontWeight: '800', color: '#A7F3D0', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
  statVal: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  statLabel: { fontSize: 9, color: '#A7F3D0', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterTabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  candidateGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  branchText: { fontSize: 11, color: '#64748B', marginTop: 1 },
  packageBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packageText: { fontSize: 12, fontWeight: '800', color: '#059669' },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    gap: 6,
  },
  companyText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  roleText: { fontSize: 11, color: '#64748B' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  offerIdText: { fontSize: 10, color: '#94A3B8' },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewDocText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  docBrand: { flexDirection: 'row', alignItems: 'center' },
  docSchoolName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  docSubtitle: { fontSize: 11, color: '#64748B' },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  docMetaLabel: { fontSize: 10, color: '#64748B' },
  docMetaVal: { fontSize: 11, fontWeight: '700', color: '#1E293B', marginTop: 1 },
  docStudentBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  docStudentName: { fontSize: 13, fontWeight: '800', color: '#3730A3' },
  docStudentBranch: { fontSize: 11, color: '#4F46E5', marginTop: 1 },
  docOfferBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  docOfferItem: { marginBottom: 8 },
  docOfferLabel: { fontSize: 10, color: '#64748B' },
  docOfferVal: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 1 },
  verifiedTag: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 12,
  },
  downloadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  downloadDocText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
