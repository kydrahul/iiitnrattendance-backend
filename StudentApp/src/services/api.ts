import { auth } from './firebase';
import Constants from 'expo-constants';

// Get API URL from environment or use default
const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface VerifyResponse {
  success: boolean;
  session?: {
    sessionId: string;
    courseId: string;
    exp: number;
  };
  error?: string;
}

export const verifyAttendance = async (
  qrToken: string,
  location?: { latitude: number; longitude: number; accuracy: number }
): Promise<VerifyResponse> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();
    
    const response = await fetch(`${API_URL}/verify-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        qrToken,
        studentId: user.uid,
        ...(location && {
          lat: location.latitude,
          lng: location.longitude,
        }),
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify attendance');
    }

    return await response.json();
  } catch (err) {
    console.error('Verify attendance error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
};