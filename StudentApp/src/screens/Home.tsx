import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchCoursesStart, fetchCoursesSuccess, fetchCoursesFailure } from '../store/slices/courseSlice';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CourseCard } from '../components/ui/CourseCard';
import { Icon } from '../components/ui/Icon';

interface Props {
  navigation: NavigationProp;
}

export const Home: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { courses, isLoading, error } = useAppSelector(state => state.courses);
  const user = useAppSelector(state => state.auth.user);

  const loadCourses = async () => {
    try {
      dispatch(fetchCoursesStart());
      
      // In production, this would be an API call
      const mockCourses = [
        {
          id: '1',
          code: 'CS301',
          name: 'Database Systems',
          section: 'A',
          facultyId: 'faculty1',
          color: '#4F46E5',
          schedule: [
            { day: 'Monday', time: '09:00', room: 'LH-101' },
            { day: 'Wednesday', time: '09:00', room: 'LH-101' }
          ],
          totalClasses: 24,
          attended: 20,
          missed: 4
        },
        {
          id: '2',
          code: 'CS302',
          name: 'Operating Systems',
          section: 'A',
          facultyId: 'faculty2',
          color: '#059669',
          schedule: [
            { day: 'Tuesday', time: '10:00', room: 'LH-102' },
            { day: 'Thursday', time: '10:00', room: 'LH-102' }
          ],
          totalClasses: 24,
          attended: 22,
          missed: 2
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      dispatch(fetchCoursesSuccess(mockCourses));
    } catch (err) {
      dispatch(fetchCoursesFailure(err instanceof Error ? err.message : 'Failed to load courses'));
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const getTodaysClasses = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return Object.values(courses).filter(course => 
      course.schedule.some(slot => slot.day === today)
    );
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCourses}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadCourses} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.name}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Today's Classes</Text>
      {getTodaysClasses().length > 0 ? (
        getTodaysClasses().map(course => (
          <View key={course.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{course.name}</Text>
              <View style={[styles.badge, { backgroundColor: course.color + '20' }]}>
                <Text style={[styles.badgeText, { color: course.color }]}>{course.code}</Text>
              </View>
            </View>
            {course.schedule
              .filter(slot => slot.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))
              .map((slot, index) => (
                <Text key={index} style={styles.cardSubtitle}>
                  {slot.time} • {slot.room}
                </Text>
              ))}
          </View>
        ))
      ) : (
        <Text style={styles.noClassesText}>No classes scheduled for today</Text>
      )}

      <Text style={styles.sectionTitle}>My Courses</Text>
      {Object.values(courses).map(course => {
        const attendancePercentage = (course.attended / course.totalClasses) * 100;
        return (
          <View key={course.id} style={styles.courseCard}>
            <View style={styles.courseInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{course.name}</Text>
                <View style={[styles.badge, { backgroundColor: course.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: course.color }]}>{course.code}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                {course.attended}/{course.totalClasses} classes attended
              </Text>
            </View>
            <Text style={[styles.attendanceText, { color: getAttendanceColor(attendancePercentage) }]}>
              {attendancePercentage.toFixed(1)}%
            </Text>
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scanner')}
        accessibilityLabel="Scan QR code"
      >
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>

      {/* Add padding at bottom for better scrolling */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    padding: spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
  },
  welcomeText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  nameText: {
    fontSize: typography.sizes.subheading,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.small / 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.subheading,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.medium,
    marginBottom: spacing.medium,
    paddingHorizontal: spacing.medium,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  badge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: borderRadius.button,
    marginLeft: spacing.small,
  },
  badgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: '500',
  },
  noClassesText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: typography.sizes.body,
    paddingVertical: spacing.large,
  },
  courseCard: {
    backgroundColor: colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  courseInfo: {
    flex: 1,
  },
  attendanceText: {
    fontSize: typography.sizes.subheading,
    fontWeight: '700',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.body,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  retryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.button,
    elevation: 1,
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: colors.accent,
    marginHorizontal: spacing.medium,
    marginTop: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  scanButtonText: {
    color: '#0F172A',
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
});
