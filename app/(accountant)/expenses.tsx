import React from 'react';
import { Redirect } from 'expo-router';

export default function AccountantExpensesScreen() {
  return <Redirect href={{ pathname: '/(accountant)/home', params: { tab: 'expenses' } }} />;
}
