import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLibraryStore } from '../store/useLibraryStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, type: 'book' | 'student') => void;
}

export const LibraryBarcodeScannerModal: React.FC<Props> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const books = useLibraryStore((s) => s.books);
  const loans = useLibraryStore((s) => s.loans);

  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulateScan = (code: string, type: 'book' | 'student') => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onScanSuccess(code, type);
      onClose();
    }, 600);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Empty Code', 'Please enter a barcode or accession code.');
      return;
    }
    const code = manualCode.trim().toUpperCase();
    const isStudent = code.startsWith('STD') || code.startsWith('SCH');
    onScanSuccess(code, isStudent ? 'student' : 'book');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.scannerCard}>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color="#D97706" />
              <Text style={styles.title}>Digital Barcode & QR Scanner</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Viewport Simulation */}
          <View style={styles.viewport}>
            <View style={styles.laserLine} />
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={120}
              color="rgba(255,255,255,0.4)"
            />
            <Text style={styles.viewportHint}>
              Align Book Accession Barcode or Student Smart ID within camera frame
            </Text>
          </View>

          {/* Quick Preset Scan Chips */}
          <Text style={styles.presetLabel}>Simulate 1-Tap Physical Scan:</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleSimulateScan('ACC-8821', 'book')}
            >
              <MaterialCommunityIcons name="book" size={14} color="#D97706" />
              <Text style={styles.presetText}>Scan ACC-8821 (Physics)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleSimulateScan('ACC-7041', 'book')}
            >
              <MaterialCommunityIcons name="book" size={14} color="#D97706" />
              <Text style={styles.presetText}>Scan ACC-7041 (Algorithms)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleSimulateScan('SCH-2024-1082', 'student')}
            >
              <MaterialCommunityIcons name="account-card" size={14} color="#4F46E5" />
              <Text style={styles.presetText}>Scan Rohan ID Badge</Text>
            </TouchableOpacity>
          </View>

          {/* Manual Barcode Input */}
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Or type accession code (e.g. ACC-8910)..."
              placeholderTextColor="#94A3B8"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <TouchableOpacity style={styles.manualBtn} onPress={handleManualSubmit}>
              <Text style={styles.manualBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  scannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 4 },
  viewport: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
  },
  laserLine: {
    position: 'absolute',
    top: '45%',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  viewportHint: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  presetLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 14, marginBottom: 8 },
  presetsRow: { flexDirection: 'column', gap: 6 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  presetText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  manualBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  manualBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
