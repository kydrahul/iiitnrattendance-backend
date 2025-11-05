import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { storage } from '../../services/storage';
import { 
  loginSuccess, 
  logout,
} from '../slices/authSlice';
import { 
  fetchCoursesSuccess
} from '../slices/courseSlice';
import {
  addPendingScan,
  removePendingScan,
} from '../slices/sessionSlice';

// Helper type for actions with payload
type PayloadAction<T> = {
  payload: T;
  type: string;
};

/**
 * Redux middleware to sync state with AsyncStorage
 */
export const persistenceMiddleware: Middleware<{}, RootState> = store => next => async action => {
  const result = next(action);

  if (loginSuccess.match(action)) {
    const { token, user } = action.payload;
    await storage.auth.save({ token, user });
  } else if (logout.match(action)) {
    await storage.auth.clear();
  }

  // Cache course data
  if (fetchCoursesSuccess.match(action)) {
    await storage.courses.save(action.payload);
  }

  // Handle offline scans
  if (addPendingScan.match(action)) {
    const scan = action.payload;
    await storage.scans.add({
      id: scan.sessionId, // Use sessionId as unique id
      sessionId: scan.sessionId,
      timestamp: scan.timestamp,
      qrData: scan.qrData,
      location: scan.location,
    });
  } else if (removePendingScan.match(action)) {
    await storage.scans.remove(action.payload.sessionId);
  }

  return result;
};