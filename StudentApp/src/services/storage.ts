import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  AUTH: '@auth',
  PENDING_SCANS: '@pending_scans',
  COURSES: '@courses',
  OFFLINE_QUEUE: '@offline_queue',
} as const;

// Type for pending scan data
export interface PendingScan {
  id: string;
  sessionId: string;
  timestamp: number;
  qrData: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

// Type for offline queue item
export interface QueueItem {
  id: string;
  type: 'scan' | 'update';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Helper to handle AsyncStorage errors
 */
const handleStorageError = (error: any, operation: string) => {
  console.error(`Storage error during ${operation}:`, error);
  // In production, send to error reporting service
};

/**
 * Storage service for handling offline data persistence
 */
export const storage = {
  // Auth state persistence
  auth: {
    save: async (authData: { token: string; user: any }) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData));
      } catch (error) {
        handleStorageError(error, 'auth.save');
      }
    },
    
    load: async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        handleStorageError(error, 'auth.load');
        return null;
      }
    },
    
    clear: async () => {
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH);
      } catch (error) {
        handleStorageError(error, 'auth.clear');
      }
    },
  },

  // Course data caching
  courses: {
    save: async (courses: any[]) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
      } catch (error) {
        handleStorageError(error, 'courses.save');
      }
    },
    
    load: async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.COURSES);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        handleStorageError(error, 'courses.load');
        return [];
      }
    },
  },

  // Pending scans management
  scans: {
    add: async (scan: PendingScan) => {
      try {
        const currentScans = await storage.scans.getAll();
        const updatedScans = [...currentScans, scan];
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SCANS, JSON.stringify(updatedScans));
      } catch (error) {
        handleStorageError(error, 'scans.add');
      }
    },
    
    remove: async (scanId: string) => {
      try {
        const currentScans = await storage.scans.getAll();
        const updatedScans = currentScans.filter((scan: PendingScan) => scan.id !== scanId);
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SCANS, JSON.stringify(updatedScans));
      } catch (error) {
        handleStorageError(error, 'scans.remove');
      }
    },
    
    getAll: async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SCANS);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        handleStorageError(error, 'scans.getAll');
        return [];
      }
    },
  },

  // Offline queue management
  queue: {
    add: async (item: Omit<QueueItem, 'retryCount'>) => {
      try {
        const currentQueue = await storage.queue.getAll();
        const queueItem: QueueItem = { ...item, retryCount: 0 };
        const updatedQueue = [...currentQueue, queueItem];
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
      } catch (error) {
        handleStorageError(error, 'queue.add');
      }
    },
    
    remove: async (itemId: string) => {
      try {
        const currentQueue = await storage.queue.getAll();
        const updatedQueue = currentQueue.filter(item => item.id !== itemId);
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
      } catch (error) {
        handleStorageError(error, 'queue.remove');
      }
    },
    
    update: async (itemId: string, updates: Partial<QueueItem>) => {
      try {
        const currentQueue = await storage.queue.getAll();
        const updatedQueue = currentQueue.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
      } catch (error) {
        handleStorageError(error, 'queue.update');
      }
    },
    
    getAll: async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
        return data ? JSON.parse(data) as QueueItem[] : [];
      } catch (error) {
        handleStorageError(error, 'queue.getAll');
        return [];
      }
    },
  },

  // Clear all stored data
  clearAll: async () => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      handleStorageError(error, 'clearAll');
    }
  },
};