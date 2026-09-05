import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../../store/useUserStore';
import { useLibraryStore } from '../store/useLibraryStore';

export const LibrarianHeader: React.FC = () => {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Chief Librarian';
  const institutionName = useUserStore((state) => state.institutionName) || 'DPS Central Library';
  const insideCount = useLibraryStore((s) => s.getInsideVisitorsCount());
  const maxCapacity = useLibraryStore((s) => s.maxCapacity);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.institutionText}>{institutionName}</Text>
            <Text style={styles.librarianGreeting}>Hello, {fullName}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* Live Occupancy Pill */}
          <View style={styles.occupancyBadge}>
            <View style={styles.livePulse} />
            <Text style={styles.occupancyText}>
              {insideCount}/{maxCapacity} Inside
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(librarian)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.profileInitial}>{fullName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  librarianGreeting: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  occupancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  occupancyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
});
