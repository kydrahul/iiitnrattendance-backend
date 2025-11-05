import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { colors, spacing, QR_TIME_OPTIONS } from '@/constants/theme';
import { getCourseDetails, generateQR } from '@/services/api';
import type { Course } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetail'>;

export default function CourseDetailScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await getCourseDetails(courseId);
      setCourse(data);
    } catch (err) {
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (expiresIn: number) => {
    try {
      setGeneratingQR(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission is required to generate QR code');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { qrData: newQRData } = await generateQR(courseId, expiresIn, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setQrData(newQRData);
    } catch (err) {
      setError('Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.error}>
          {error || 'Course not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{course.name}</Text>
          <Text variant="bodyMedium" style={styles.courseCode}>
            {course.code}
          </Text>
          <View style={styles.courseInfo}>
            <Text variant="bodyMedium">
              {course.branch} • Year {course.year}
            </Text>
            <Text variant="bodyMedium" style={styles.session}>
              {course.session}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Generate QR Code
          </Text>
          <View style={styles.qrOptions}>
            {QR_TIME_OPTIONS.map((minutes) => (
              <Button
                key={minutes}
                mode="outlined"
                onPress={() => handleGenerateQR(minutes * 60)}
                disabled={generatingQR}
                style={styles.timeButton}
              >
                {minutes} min
              </Button>
            ))}
          </View>
          {qrData && (
            <View style={styles.qrContainer}>
              <QRCode value={qrData} size={200} />
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() =>
            navigation.navigate('ManualAttendance', {
              courseId,
              sessionId: '', // Will be filled when creating a new session
            })
          }
          style={styles.button}
        >
          Manual Attendance
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Statistics', { courseId })}
          style={styles.button}
        >
          View Statistics
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: spacing.medium,
    backgroundColor: colors.surface,
  },
  courseCode: {
    color: colors.text.secondary,
    marginTop: spacing.small / 2,
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.medium,
  },
  session: {
    color: colors.text.secondary,
  },
  sectionTitle: {
    marginBottom: spacing.medium,
  },
  qrOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.small / 2,
  },
  timeButton: {
    margin: spacing.small / 2,
    flex: 1,
    minWidth: '45%',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: spacing.large,
    padding: spacing.medium,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  actions: {
    padding: spacing.medium,
    paddingTop: 0,
  },
  button: {
    marginBottom: spacing.medium,
    backgroundColor: colors.primary,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
});