import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';
import { performLogout } from '../utils/logout';
import { FontFamily, FontSize } from '../constants/fonts';

export default function AccountBlockedScreen() {
  const email = useUserStore((state) => state.email);
  const reason = useUserStore((state) => state.accessBlockedReason);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await performLogout();
    setSigningOut(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="account-alert-outline" size={38} color="#171717" />
          </View>

          <Text style={styles.eyebrow}>KIVQUO ACCESS</Text>
          <Text style={styles.title}>Account not provisioned</Text>
          <Text style={styles.body}>
            {reason || 'No role is assigned to this account. Contact your institution administrator.'}
          </Text>

          {!!email && (
            <View style={styles.emailPill}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#6B6B6B" />
              <Text style={styles.emailText}>{email}</Text>
            </View>
          )}

          <Text style={styles.hint}>
            Ask your institution administrator to assign your role. Once it is assigned, sign out and sign in again.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            disabled={signingOut}
            onPress={handleSignOut}
            style={({ pressed }) => [styles.button, (pressed || signingOut) && styles.buttonPressed]}
          >
            {signingOut ? (
              <ActivityIndicator color="#171717" />
            ) : (
              <Text style={styles.buttonText}>Sign out</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.caption,
    letterSpacing: 1.6,
    color: '#B58A00',
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: '#171717',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#4B4B4B',
    textAlign: 'center',
    marginBottom: 18,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  emailText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#4B4B4B',
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    minWidth: 170,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#171717',
  },
});
