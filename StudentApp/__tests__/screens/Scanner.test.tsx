import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Scanner } from '../../src/screens/Scanner';
import authReducer from '../../src/store/slices/authSlice';
import courseReducer from '../../src/store/slices/courseSlice';
import sessionReducer from '../../src/store/slices/sessionSlice';
import { NavigationProp } from '../../src/types/navigation';
import * as Location from 'expo-location';
import * as BarCodeScanner from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';

// Mock Expo modules
const mockBarCodeScannerModule = {
  BarCodeScanner: {
    Constants: {
      BarCodeType: {
        qr: 'qr',
      },
    }
  },
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' })
};

const mockLocationModule = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 0,
      longitude: 0,
      accuracy: 10,
    },
  }),
  Accuracy: {
    Balanced: 3,
  },
};

const mockHapticsModule = {
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
};

jest.mock('expo-barcode-scanner', () => mockBarCodeScannerModule);
jest.mock('expo-location', () => mockLocationModule);
jest.mock('expo-haptics', () => mockHapticsModule);

// Mock React Navigation
const mockNavigation: NavigationProp = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  isFocused: jest.fn(),
  setOptions: jest.fn(),
  getKey: jest.fn(),
} as any;

// Create test store
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    sessions: sessionReducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student' as const,
      },
      token: 'test-token',
      error: null,
      isLoading: false,
    },
  },
});

describe('Scanner', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  it('renders loading state while requesting permissions', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <Scanner navigation={mockNavigation} />
      </Provider>
    );

    expect(getByText('Requesting permissions...')).toBeTruthy();
  });

  it('shows error message when camera permission is denied', async () => {
    // Mock permission denied
    (BarCodeScanner.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const { findByText } = render(
      <Provider store={store}>
        <Scanner navigation={mockNavigation} />
      </Provider>
    );

    const errorText = await findByText('No camera access. Please enable camera permissions in settings.');
    expect(errorText).toBeTruthy();
  });

  it('handles successful QR code scan', async () => {
    const mockQRData = JSON.stringify({
      sessionId: 'test-session',
      courseId: 'test-course',
      timestamp: Date.now(),
      signature: 'test-signature',
    });

    const { findByTestId } = render(
      <Provider store={store}>
        <Scanner navigation={mockNavigation} />
      </Provider>
    );

    // Wait for permissions to be granted
    const scanner = await findByTestId('barcode-scanner');
    
    await act(async () => {
      fireEvent(scanner, 'onBarCodeScanned', {
        type: BarCodeScanner.Constants.BarCodeType.qr,
        data: mockQRData,
      });
    });

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Balanced
    });
    expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
  });

  it('handles invalid QR code data', async () => {
    const invalidQRData = 'invalid-data';

    const { findByTestId, findByText } = render(
      <Provider store={store}>
        <Scanner navigation={mockNavigation} />
      </Provider>
    );

    // Wait for permissions to be granted
    const scanner = await findByTestId('barcode-scanner');
    
    await act(async () => {
      fireEvent(scanner, 'onBarCodeScanned', {
        type: BarCodeScanner.Constants.BarCodeType.qr,
        data: invalidQRData,
      });
    });

    const errorTitle = await findByText('Invalid QR Code');
    const errorMessage = await findByText('Please scan a valid attendance QR code.');
    expect(errorTitle).toBeTruthy();
    expect(errorMessage).toBeTruthy();
  });

  it('handles location permission denied gracefully', async () => {
    // Mock camera permission granted but location denied
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const mockQRData = JSON.stringify({
      sessionId: 'test-session',
      courseId: 'test-course',
      timestamp: Date.now(),
      signature: 'test-signature',
    });

    const { findByTestId } = render(
      <Provider store={store}>
        <Scanner navigation={mockNavigation} />
      </Provider>
    );

    const scanner = await findByTestId('barcode-scanner');
    
    await act(async () => {
      fireEvent(scanner, 'onBarCodeScanned', {
        type: BarCodeScanner.Constants.BarCodeType.qr,
        data: mockQRData,
      });
    });

    // Should still record attendance even without location
    expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
  });
});