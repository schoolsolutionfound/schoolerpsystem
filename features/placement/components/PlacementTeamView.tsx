import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listPlacementMembers, searchEligibleMembers, assignPlacementMember } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';

export function PlacementTeamView() {
  const [members, setMembers] = useState<any[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [m, e] = await Promise.all([
        listPlacementMembers(),
        searchEligibleMembers()
      ]);
      setMembers(m || []);
      setEligibleUsers(e || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = (userId: string, fullName: string) => {
    Alert.alert('Assign Member', `Assign ${fullName} to the Placement Cell?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Assign', 
        onPress: async () => {
          try {
            setAssigning(userId);
            await assignPlacementMember({ userId, accessLevel: 'member' });
            Alert.alert('Success', 'Member assigned successfully.');
            await loadData();
            setShowSearch(false);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to assign.');
          } finally {
            setAssigning(null);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4C430" />
      </View>
    );
  }

  // Filter out users who are already in the team
  const availableUsers = eligibleUsers.filter(u => !members.find(m => m.id === u.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Placement Team</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowSearch(!showSearch)}>
          <MaterialCommunityIcons name={showSearch ? "close" : "plus"} size={20} color="#1A1B1C" />
          <Text style={styles.addText}>{showSearch ? "Cancel" : "Add Member"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {showSearch && (
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Eligible Staff ({availableUsers.length})</Text>
            {availableUsers.length === 0 ? (
              <Text style={styles.emptyText}>No eligible staff available to add.</Text>
            ) : (
              availableUsers.map(user => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.fullName?.[0]}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.assignBtn}
                    onPress={() => handleAssign(user.id, user.fullName)}
                    disabled={assigning === user.id}
                  >
                    {assigning === user.id ? (
                      <ActivityIndicator size="small" color="#1A1B1C" />
                    ) : (
                      <Text style={styles.assignText}>Assign</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View style={styles.divider} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Current Team Members</Text>
        {members.length === 0 ? (
          <Text style={styles.emptyText}>No members in the placement cell yet.</Text>
        ) : (
          members.map(member => (
            <View key={member.id} style={styles.userCard}>
              <View style={[styles.avatar, { backgroundColor: '#FDF9E6' }]}>
                <Text style={[styles.avatarText, { color: '#F4C430' }]}>{member.fullName?.[0]}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{member.fullName}</Text>
                <Text style={styles.userRole}>
                  {member.accessLevel === 'head' ? 'Placement Head' : 'Placement Member'}
                </Text>
              </View>
              {member.accessLevel === 'head' && (
                <MaterialCommunityIcons name="star" size={20} color="#F4C430" />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  title: { fontSize: 24, fontFamily: FontFamily.bold, color: '#111827' },
  addBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F4C430', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8,
    gap: 4
  },
  addText: { color: '#1A1B1C', fontFamily: FontFamily.bold, fontSize: 13 },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic', marginBottom: 16 },
  
  searchSection: { marginBottom: 24 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatar: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 12 
  },
  avatarText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#4B5563' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontFamily: FontFamily.bold, color: '#111827' },
  userRole: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280' },
  
  assignBtn: { 
    backgroundColor: '#F4C430', 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  assignText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' }
});
