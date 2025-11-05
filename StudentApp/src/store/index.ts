import { configureStore, Middleware } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import sessionReducer from './slices/sessionSlice';
import { persistenceMiddleware } from './middleware/persistence';

const rootReducer = {
  auth: authReducer,
  courses: courseReducer,
  sessions: sessionReducer,
} as const;

// Create base store without middleware for type extraction
const baseStore = configureStore({ reducer: rootReducer });
export type RootState = ReturnType<typeof baseStore.getState>;
export type AppDispatch = typeof baseStore.dispatch;

// Create actual store with middleware
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/loginSuccess', 'auth/loginFailure'],
      },
    }).concat(persistenceMiddleware as Middleware),
});

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;