import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppCard } from '../../../features/shared/components/AppCard';
import { Colors, BorderRadius } from '../../../constants/theme';

export default function DeveloperPlansScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="card-bulleted-outline" size={24} color={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Plans & Subscriptions</Text>
            <Text style={styles.headerSubtitle}>Billing & Tier Management Engine</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.comingSoonCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={36} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Subscription Engine Coming Soon</Text>
          <Text style={styles.description}>
            The subscription tiers, billing integration, and institution limits engine will be introduced in an upcoming dedicated sprint.
          </Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  content: {
    padding: 16,
  },
  comingSoonCard: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
});
