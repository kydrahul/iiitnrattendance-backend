import { auth } from './firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export const registerUser = async (email: string, password: string, name: string) => {
  if (!email.endsWith('@iiitnr.edu.in')) {
    throw new Error('Please use your IIIT-NR email address');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: name
    });

    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};