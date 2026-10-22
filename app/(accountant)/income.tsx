import React from 'react';
import { Redirect } from 'expo-router';

export default function AccountantIncomeScreen() {
  return <Redirect href={{ pathname: '/(accountant)/home', params: { tab: 'income' } }} />;
}
