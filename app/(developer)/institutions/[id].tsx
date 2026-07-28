import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { InstitutionDetailsScreen } from '../../../features/developer/screens/InstitutionDetailsScreen';

export default function DeveloperInstitutionDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <InstitutionDetailsScreen id={id || ''} />;
}
