import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AdmissionApplication } from '../../../api/admission';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

interface AdmissionStudentDetailModalProps {
  visible: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
  onAllocatePress: (student: AdmissionApplication) => void;
  onUnallocatePress: (student: AdmissionApplication) => void;
  onConfirmPress: (student: AdmissionApplication) => void;
  onCancelPress: (student: AdmissionApplication) => void;
}

export const AdmissionStudentDetailModal: React.FC<AdmissionStudentDetailModalProps> = ({
  visible,
  onClose,
  application,
  onAllocatePress,
  onUnallocatePress,
  onConfirmPress,
  onCancelPress,
}) => {
  if (!application) return null;

  const isWaiting = application.status === 'waiting_list';
  const isAllocated = application.status === 'allocated';
  const isConfirmed = application.status === 'confirmed';

  const getStatusBadge = () => {
    switch (application.status) {
      case 'waiting_list':
        return { label: 'WAITING LIST', color: '#B45309' };
      case 'allocated':
        return { label: 'PROVISIONALLY ALLOCATED', color: '#1E40AF' };
      case 'confirmed':
        return { label: 'ADMISSION CONFIRMED', color: '#15803D' };
      case 'cancelled':
        return { label: 'CANCELLED', color: '#6B7280' };
      default:
        return { label: String(application?.status || '').toUpperCase(), color: '#1A1B1C' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.appName} numberOfLines={1}>
                {application.fullName}
              </Text>
              <Text style={styles.appNumber}>
                {application.applicationNumber} • Batch {application.academicYear}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Status Highlight (Clean transparent typography, centered, no pill bg) */}
            <View style={styles.statusBanner}>
              <Text style={[styles.statusBannerText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
              {isAllocated && (
                <Text style={styles.statusSubText}>
                  Assigned to {application.allocatedCourseName || 'Branch'} under {application.allocatedQuota || 'General'} quota.
                </Text>
              )}
              {isConfirmed && (
                <Text style={styles.statusSubText}>
                  Admission finalized and seat permanently locked in {application.allocatedCourseName || 'Branch'}.
                </Text>
              )}
            </View>

            {/* SEAT & ADMISSION ALLOCATION */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>SEAT & BRANCH DETAILS</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Preferred Branch</Text>
                <Text style={styles.detailValue}>
                  {application.preferredCourseName || 'Not Specified'}
                </Text>
              </View>
              {application.allocatedCourseName ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Allocated Branch</Text>
                  <Text style={[styles.detailValue, { color: '#4F46E5', fontWeight: '800' }]}>
                    {application.allocatedCourseName}
                  </Text>
                </View>
              ) : null}
              {application.allocatedQuota ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Allotted Quota</Text>
                  <Text style={[styles.detailValue, { color: '#16A34A', fontWeight: '800' }]}>
                    {application.allocatedQuota}
                  </Text>
                </View>
              ) : null}
              {application.allocatedAt ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Allocated On</Text>
                  <Text style={styles.detailValue}>
                    {new Date(application.allocatedAt).toLocaleDateString()}
                  </Text>
                </View>
              ) : null}
              {application.confirmedAt ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Confirmed On</Text>
                  <Text style={styles.detailValue}>
                    {new Date(application.confirmedAt).toLocaleDateString()}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* APPLICANT PROFILE */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>APPLICANT INFORMATION</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{application.fullName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{application.dob || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Group</Text>
                <Text style={styles.detailValue}>{application.bloodGroup || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Residential Address</Text>
                <Text style={styles.detailValue}>{application.address || '—'}</Text>
              </View>
            </View>

            {/* PARENT & GUARDIAN */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>PARENT & GUARDIAN</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Parent Mobile</Text>
                <Text style={[styles.detailValue, { fontWeight: '800', color: '#171717' }]}>
                  {application.parentPhone}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Father's Name</Text>
                <Text style={styles.detailValue}>{application.fatherName || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mother's Name</Text>
                <Text style={styles.detailValue}>{application.motherName || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Guardian Phone</Text>
                <Text style={styles.detailValue}>{application.guardianPhone || '—'}</Text>
              </View>
            </View>

            {/* CUSTOM / DYNAMIC PIPELINE FIELDS */}
            {application.customFields && Object.keys(application.customFields).length > 0 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>ADDITIONAL DETAILS</Text>
                {Object.entries(application.customFields).map(([key, value]) => (
                  <View style={styles.detailRow} key={key}>
                    <Text style={styles.detailLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Text>
                    <Text style={styles.detailValue}>{String(value ?? '—')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Notes */}
            {application.notes ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>OFFICER NOTES</Text>
                <Text style={styles.notesText}>{application.notes}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerBar}>
            {isWaiting && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => onCancelPress(application)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => onAllocatePress(application)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionBtnText}>Allocate Seat</Text>
                </TouchableOpacity>
              </View>
            )}

            {isAllocated && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => onUnallocatePress(application)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineActionBtnText}>Unallocate Seat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmActionBtn}
                  onPress={() => onConfirmPress(application)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmActionBtnText}>Confirm Admission</Text>
                </TouchableOpacity>
              </View>
            )}

            {isConfirmed && (
              <View style={styles.confirmedLockedRow}>
                <Text style={styles.confirmedLockedText}>
                  ✓ Seat confirmed & permanently reserved
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  appNumber: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statusBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
  },
  statusBannerText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statusSubText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#1A1B1C',
    fontWeight: '700',
    flex: 1.2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  primaryActionBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  outlineActionBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmActionBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  confirmedLockedRow: {
    height: 36,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmedLockedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
});
