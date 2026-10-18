import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { StaffEvaluationItem, SubmitEvaluationPayload } from '../types/reviewCycle.types';

interface StaffEvaluationModalProps {
  visible: boolean;
  evaluation: StaffEvaluationItem | null;
  onClose: () => void;
  onSubmit: (payload: SubmitEvaluationPayload) => Promise<void>;
}

export const StaffEvaluationModal: React.FC<StaffEvaluationModalProps> = ({
  visible,
  evaluation,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(evaluation?.rating || 4);
  const [pedagogyScore, setPedagogyScore] = useState<number>(evaluation?.pedagogyScore || 4);
  const [punctualityScore, setPunctualityScore] = useState<number>(evaluation?.punctualityScore || 5);
  const [studentFeedbackScore, setStudentFeedbackScore] = useState<number>(evaluation?.studentFeedbackScore || 4);
  const [strengths, setStrengths] = useState<string>(evaluation?.strengths || '');
  const [areasForGrowth, setAreasForGrowth] = useState<string>(evaluation?.areasForGrowth || '');
  const [reviewerRemarks, setReviewerRemarks] = useState<string>(evaluation?.reviewerRemarks || '');
  const [submitting, setSubmitting] = useState(false);

  if (!evaluation) return null;

  const handleSave = async () => {
    if (!reviewerRemarks.trim()) {
      Alert.alert('Remarks Required', 'Please provide evaluation remarks or feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        evaluationId: evaluation.id,
        rating,
        pedagogyScore,
        punctualityScore,
        studentFeedbackScore,
        strengths,
        areasForGrowth,
        reviewerRemarks,
      });
      Alert.alert('Evaluation Saved', `Review for ${evaluation.staffName} has been submitted.`);
      onClose();
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Could not save evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingBar = (label: string, value: number, onChange: (v: number) => void) => (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.starsWrap}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={star <= value ? 'star' : 'star-outline'}
              size={22}
              color={star <= value ? '#F4C430' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
        <Text style={styles.starScoreText}>{value}.0</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Staff Review Evaluation</Text>
              <Text style={styles.sub}>{evaluation.staffName} • {evaluation.designation}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Staff Details Card */}
            <View style={styles.staffSummaryCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {evaluation.staffName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{evaluation.staffName}</Text>
                <Text style={styles.staffDept}>{evaluation.department}</Text>
                <Text style={styles.staffEmail}>{evaluation.staffEmail}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{evaluation.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Performance Rubric Ratings */}
            <Text style={styles.sectionHeader}>PERFORMANCE METRICS</Text>
            <View style={styles.rubricBox}>
              {renderRatingBar('Overall Performance Rating', rating, setRating)}
              <View style={styles.divider} />
              {renderRatingBar('Pedagogy & Curriculum Delivery', pedagogyScore, setPedagogyScore)}
              <View style={styles.divider} />
              {renderRatingBar('Classroom Punctuality & Discipline', punctualityScore, setPunctualityScore)}
              <View style={styles.divider} />
              {renderRatingBar('Student Engagement & Feedback', studentFeedbackScore, setStudentFeedbackScore)}
            </View>

            {/* Qualitative Notes */}
            <Text style={styles.sectionHeader}>OBSERVATIONS & FEEDBACK</Text>

            <Text style={styles.inputLabel}>Notable Strengths & Commendations</Text>
            <TextInput
              style={styles.textInput}
              value={strengths}
              onChangeText={setStrengths}
              placeholder="Key accomplishments, pedagogical achievements..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Areas for Professional Development</Text>
            <TextInput
              style={styles.textInput}
              value={areasForGrowth}
              onChangeText={setAreasForGrowth}
              placeholder="Recommended workshops, technology adoption, growth goals..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Official Reviewer Remarks / Appraisal Recommendation *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={reviewerRemarks}
              onChangeText={setReviewerRemarks}
              placeholder="Executive remarks, appraisal endorsement, contract continuation..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-decagram" size={18} color="#111827" />
                  <Text style={styles.submitText}>Endorse & Approve Review</Text>
                </>
              )}
            </TouchableOpacity>
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
  panel: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  sub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
  },
  staffSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: '#F4C430',
  },
  staffName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  staffDept: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
  },
  staffEmail: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#8A8A8A',
  },
  statusPill: {
    backgroundColor: '#16A34A18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#8A8A8A',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  rubricBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    marginBottom: 14,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#171717',
    flex: 1,
    minWidth: 160,
  },
  starsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starScoreText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E5DC',
    marginVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#171717',
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  submitText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
