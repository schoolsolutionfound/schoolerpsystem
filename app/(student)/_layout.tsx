import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="marks" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="fees" />
    </Stack>
  );
}
