import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { NavigationProp } from '../types/navigation';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { useAppDispatch, useAppSelector } from '../store';
import { loginStart, loginFailure, loginSuccess } from '../store/slices/authSlice';
import type { User } from '../store/slices/authSlice';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface Props {
  navigation: NavigationProp;
}

export const Login: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!email.endsWith('@iiitnr.edu.in')) {
      Alert.alert('Error', 'Please use your IIIT-NR email address');
      return;
    }

    try {
      dispatch(loginStart());

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create a user object from Firebase user
      const userData: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'IIIT-NR Student',
        email: firebaseUser.email!,
        role: 'student',
        year: 2, // This should come from your user profile data
        programId: 'CS', // This should come from your user profile data
      };

      // Get the ID token
      const token = await firebaseUser.getIdToken();

      dispatch(loginSuccess({ user: userData, token }));
      navigation.replace('Home');
    } catch (err) {
      console.error('Login error:', err);
      dispatch(loginFailure(err instanceof Error ? err.message : 'Login failed'));
      
      if (err instanceof Error) {
        switch (err.message) {
          case 'Firebase: Error (auth/user-not-found).':
            Alert.alert('Error', 'No account found with this email. Please register first.');
            break;
          case 'Firebase: Error (auth/wrong-password).':
            Alert.alert('Error', 'Incorrect password. Please try again.');
            break;
          case 'Firebase: Error (auth/invalid-email).':
            Alert.alert('Error', 'Invalid email format.');
            break;
          default:
            Alert.alert('Error', 'Login failed. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to IIIT NR Attendance</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email (@iiitnr.edu.in)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityLabel="Login"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      <Text style={styles.helpText}>
        Please use your IIIT-NR student email to login
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.subheading,
    fontWeight: '600',
    marginBottom: spacing.large,
    color: colors.text.primary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 320,
    marginVertical: spacing.large,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.text.disabled,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginTop: spacing.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.caption,
    marginTop: spacing.small,
    textAlign: 'center',
  },
  helpText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.caption,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
});
