import { Middleware } from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import { storage, PendingScan } from '../../services/storage';
import { verifyAttendance } from '../../services/api';
import { addPendingScan, removePendingScan } from '../slices/sessionSlice';
import { RootState } from '../index';

const SYNC_INTERVAL = 60000; // 1 minute
const MAX_RETRIES = 3;

let syncTimer: ReturnType<typeof setInterval>;

const syncMiddleware: Middleware = store => {
  // Start sync timer on middleware initialization
  if (!syncTimer) {
    syncTimer = setInterval(async () => {
      const state = store.getState();
      const netInfo = await NetInfo.fetch();

      // Only sync if we're online and have pending scans
      if (netInfo.isConnected && state.sessions.pendingScans.length > 0) {
        syncPendingScans(store);
      }
    }, SYNC_INTERVAL);
  }

  return next => action => {
    // Handle new pending scans
    if (addPendingScan.match(action)) {
      storage.scans.add(action.payload);
    }

    // Handle removed pending scans
    if (removePendingScan.match(action)) {
      storage.scans.remove(action.payload.sessionId);
    }

    return next(action);
  };
};

async function syncPendingScans(store: any) {
  const state = store.getState();
  const pendingScans = state.sessions.pendingScans.filter((scan: PendingScan) => !scan.verified);

  for (const scan of pendingScans) {
    try {
      const result = await verifyAttendance(
        scan.qrData,
        scan.location
      );

      if (result.success) {
        // Remove from pending queue on success
        store.dispatch(removePendingScan({ sessionId: scan.sessionId }));
      } else {
        // Update scan with error if verification failed
        const updatedScan = {
          ...scan,
          error: result.error || 'Verification failed'
        };
        store.dispatch(removePendingScan({ sessionId: scan.sessionId }));
        store.dispatch(addPendingScan(updatedScan));
      }
    } catch (err) {
      console.error('Sync error for scan:', scan.id, err);
      // Only keep retrying if we haven't hit max retries
      if (!scan.retryCount || scan.retryCount < MAX_RETRIES) {
        const updatedScan = {
          ...scan,
          retryCount: (scan.retryCount || 0) + 1,
          error: err instanceof Error ? err.message : 'Sync failed'
        };
        store.dispatch(removePendingScan({ sessionId: scan.sessionId }));
        store.dispatch(addPendingScan(updatedScan));
      }
    }
  }
}

export default syncMiddleware;