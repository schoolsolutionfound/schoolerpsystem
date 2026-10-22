import React from 'react';
import { Redirect } from 'expo-router';

export default function AccountantTallyScreen() {
  return <Redirect href={{ pathname: '/(accountant)/home', params: { tab: 'accounts' } }} />;
}
