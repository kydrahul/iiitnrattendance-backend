export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty';
}

export interface Course {
  id: string;
  code: string;
  name: string;
  faculty: string;
  branch: string;
  year: number;
  session: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  timestamp: number;
  expiresIn: number;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  status: 'active' | 'completed' | 'expired';
}

export interface AttendanceRecord {
  sessionId: string;
  studentId: string;
  timestamp: number;
  type: 'qr' | 'manual';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  status: 'scanned' | 'verified' | 'failed';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  byDate: Record<string, { present: number; absent: number }>;
}