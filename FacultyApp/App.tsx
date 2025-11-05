import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import Navigation from '@/navigation';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/contexts/AuthContext';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primary}
        />
        <Navigation />
      </AuthProvider>
    </PaperProvider>
  );
}