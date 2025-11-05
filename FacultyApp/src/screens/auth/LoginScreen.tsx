import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }

      setLoading(true);
      setError('');

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if the user is a faculty member
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'faculty') {
        navigation.replace('CourseList');
      } else {
        // If user is not a faculty member, sign them out
        await auth.signOut();
        throw new Error('Access denied. This app is for faculty members only.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          IIIT NR Faculty
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Attendance Management
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.large,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xlarge * 2,
    marginBottom: spacing.xlarge,
  },
  title: {
    color: colors.primary,
    marginBottom: spacing.small,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  form: {
    marginTop: spacing.xlarge,
  },
  input: {
    marginBottom: spacing.medium,
  },
  button: {
    marginTop: spacing.medium,
    backgroundColor: colors.primary,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
});