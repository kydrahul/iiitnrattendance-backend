import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AttendanceSession {
  id: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  qrToken: string;
  geoLocation: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  scannedStudents: string[];
  status: 'active' | 'completed' | 'cancelled';
}

import { PendingScan } from '../../services/storage';

interface SessionState {
  activeSessions: Record<string, AttendanceSession>;
  pendingScans: PendingScan[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  activeSessions: {},
  pendingScans: [],
  isLoading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    fetchSessionsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSessionsSuccess: (state, action: PayloadAction<AttendanceSession[]>) => {
      state.isLoading = false;
      state.activeSessions = action.payload.reduce((acc, session) => {
        acc[session.id] = session;
        return acc;
      }, {} as Record<string, AttendanceSession>);
      state.error = null;
    },
    fetchSessionsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addPendingScan: (state, action: PayloadAction<PendingScan>) => {
      state.pendingScans.push(action.payload);
    },
    removePendingScan: (state, action: PayloadAction<{ sessionId: string }>) => {
      state.pendingScans = state.pendingScans.filter(scan => scan.sessionId !== action.payload.sessionId);
    },
    updateSessionStatus: (state, action: PayloadAction<{ sessionId: string; status: AttendanceSession['status'] }>) => {
      const session = state.activeSessions[action.payload.sessionId];
      if (session) {
        session.status = action.payload.status;
      }
    },
  },
});

export const {
  fetchSessionsStart,
  fetchSessionsSuccess,
  fetchSessionsFailure,
  addPendingScan,
  removePendingScan,
  updateSessionStatus,
} = sessionSlice.actions;

export default sessionSlice.reducer;