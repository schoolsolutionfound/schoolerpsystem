import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors } from '../../../constants/theme';

interface AuthBypassButtonsProps {
  onAdminBypass: () => void;
  onStudentBypass: () => void;
}

export const AuthBypassButtons: React.FC<AuthBypassButtonsProps> = ({
  onAdminBypass,
  onStudentBypass,
}) => {
  return (
    <View style={styles.devBox}>
      <Text style={styles.devTitle}>⚡ Quick Demo Login Bypasses</Text>
      <View style={styles.devButtons}>
        <TouchableOpacity style={styles.devBtn} onPress={onAdminBypass}>
          <MaterialCommunityIcons name="office-building" size={16} color="#7E57C2" />
          <Text style={[styles.devBtnText, { color: '#7E57C2' }]}>Institution Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.devBtn} onPress={onStudentBypass}>
          <MaterialCommunityIcons name="account-school" size={16} color="#16A34A" />
          <Text style={[styles.devBtnText, { color: '#16A34A' }]}>Student</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  devBox: {
    backgroundColor: '#F8F9FB',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 24,
    gap: 10,
  },
  devTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textAlign: 'center' },
  devButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  devBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  devBtnText: { fontSize: 11, fontWeight: '700' },
});
