import { auth } from '../firebaseConfig';

// Backend API URL - update this to match your backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface QRTokenResponse {
  qrToken: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lat: number | null;
  lng: number | null;
  timestamp: Date;
  recordedAt: Date;
}

export interface AttendanceResponse {
  success: boolean;
  attendance: AttendanceRecord[];
}

/**
 * Generate a QR token for a class session
 */
export async function generateQRToken(
  sessionId: string,
  courseId: string,
  ttlSeconds: number = 120
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`${API_URL}/generate-qr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      sessionId,
      courseId,
      ttlSeconds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate QR token');
  }

  const data: QRTokenResponse = await response.json();
  return data.qrToken;
}

/**
 * Fetch attendance records for a session
 */
export async function getAttendance(sessionId: string): Promise<AttendanceRecord[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`${API_URL}/attendance/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch attendance');
  }

  const data: AttendanceResponse = await response.json();
  
  // Convert timestamp strings back to Date objects
  return data.attendance.map(record => ({
    ...record,
    timestamp: new Date(record.timestamp),
    recordedAt: new Date(record.recordedAt),
  }));
}
