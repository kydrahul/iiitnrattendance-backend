import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { NavigationProp } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import { addPendingScan } from '../store/slices/sessionSlice';

interface Props {
  navigation: NavigationProp;
}

interface QRPayload {
  sessionId: string;
  courseId: string;
  timestamp: number;
  signature: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export const Scanner: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { pendingScans } = useAppSelector(state => state.sessions);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const requestPermissions = async () => {
      try {
        const [cameraResult, locationResult] = await Promise.all([
          BarCodeScanner.requestPermissionsAsync(),
          Location.requestForegroundPermissionsAsync()
        ]);

        if (mounted) {
          setHasCameraPermission(cameraResult.status === 'granted');
          setHasLocationPermission(locationResult.status === 'granted');
          
          if (cameraResult.status !== 'granted') {
            setErrorMessage('Camera access is required to scan QR codes');
          } else if (locationResult.status !== 'granted') {
            setErrorMessage('Location access is required for attendance verification');
          }
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage('Failed to request permissions. Please try again.');
          console.error('Permission error:', err);
        }
      }
    };

    requestPermissions();
    return () => { mounted = false; };
  }, []);

  const parseQRData = useCallback((data: string): QRPayload | null => {
    try {
      // In production, verify JWT signature here
      const payload = JSON.parse(data);
      
      // Validate required fields
      if (!payload.sessionId || !payload.courseId || !payload.timestamp || !payload.signature) {
        throw new Error('Invalid QR payload format');
      }

      // Check if scan already exists
      const existingScan = pendingScans.find(scan => scan.sessionId === payload.sessionId);
      if (existingScan) {
        throw new Error('You have already scanned this QR code');
      }

      // Check if QR code is expired
      const expiryTime = payload.timestamp + (15 * 60 * 1000); // 15 minutes
      if (Date.now() > expiryTime) {
        throw new Error('This QR code has expired');
      }

      return payload;
    } catch (err) {
      console.error('QR parse error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Invalid QR code');
      return null;
    }
  }, [pendingScans]);

  const validateLocation = useCallback(async (userLocation: Location.LocationObject, qrLocation?: QRPayload['location']): Promise<boolean> => {
    if (!qrLocation) return true; // If no location restriction in QR, accept any location
    
    const distance = Math.sqrt(
      Math.pow(userLocation.coords.latitude - qrLocation.latitude, 2) +
      Math.pow(userLocation.coords.longitude - qrLocation.longitude, 2)
    ) * 111000; // Convert to meters (rough approximation)

    return distance <= qrLocation.radius;
  }, []);

  const handleBarCodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (!isScanning || type !== BarCodeScanner.Constants.BarCodeType.qr || isProcessing) return;
    
    setIsScanning(false);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Parse QR data
      const payload = parseQRData(data);
      if (!payload) {
        throw new Error('Invalid QR code');
      }

      // Get current location
      let userLocation;
      try {
        userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        // Validate location if required
        if (payload.location) {
          const isLocationValid = await validateLocation(userLocation, payload.location);
          if (!isLocationValid) {
            throw new Error('You are too far from the class location');
          }
        }
      } catch (err) {
        if (payload.location) {
          throw new Error('Location verification failed. Please ensure you are in class.');
        }
        console.warn('Location warning:', err);
      }

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add to pending scans queue
      dispatch(addPendingScan({
        id: `scan-${Date.now()}`,
        sessionId: payload.sessionId,
        timestamp: Date.now(),
        qrData: data,
        location: userLocation?.coords ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          accuracy: userLocation.coords.accuracy || 0,
        } : undefined
      }));

      Alert.alert(
        'Success!',
        'Your attendance has been recorded and will be synced when online.',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }]
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record attendance');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsScanning(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPermissionScreen = () => (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.msg}>Requesting permissions...</Text>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Access Required</Text>
      <Text style={styles.msg}>{errorMessage}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => navigation.replace('Scanner')}
      >
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return renderPermissionScreen();
  }

  if (hasCameraPermission === false || hasLocationPermission === false) {
    return renderErrorScreen();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <BarCodeScanner
        testID="barcode-scanner"
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      >
        <View style={styles.overlay}>
          <View style={styles.topSection}>
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            )}
          </View>

          <View style={styles.scanSection}>
            <View style={styles.scanFrame}>
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator color={colors.accent} size="large" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
            <Text style={styles.hint}>Position QR code within frame</Text>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Close scanner"
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BarCodeScanner>
    </View>
  );
};

const _windowDims = Dimensions && typeof Dimensions.get === 'function' ? Dimensions.get('window') : { width: 375, height: 812 };
const SCAN_FRAME_SIZE = Math.min(_windowDims.width, _windowDims.height) * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xlarge,
  },
  scanSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xlarge,
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: borderRadius.card,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.card,
  },
  processingText: {
    color: '#ffffff',
    fontSize: typography.sizes.body,
    fontWeight: '600',
    marginTop: spacing.medium,
  },
  hint: {
    marginTop: spacing.large,
    color: '#ffffff',
    fontSize: typography.sizes.body,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: typography.sizes.headline,
    fontWeight: '700',
    color: colors.error,
    marginBottom: spacing.medium,
  },
  msg: {
    marginTop: spacing.medium,
    color: colors.text.primary,
    fontSize: typography.sizes.body,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.button,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  errorMessage: {
    color: colors.error,
    fontSize: typography.sizes.body,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: spacing.large,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.button,
  },
  retryText: {
    color: '#ffffff',
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
  closeButton: {
    width: '80%',
    backgroundColor: colors.surface,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: typography.sizes.body,
  },
});
