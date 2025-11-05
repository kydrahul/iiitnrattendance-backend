import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { Icon } from '../../components/ui/Icon';
import { CourseCard } from '../../components/ui/CourseCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAppSelector } from '../../store';

interface Props {
  route: {
    params: {
      courseId: string;
      courseName?: string;
      instructorName?: string;
      semester?: number;
    };
  };
}

export const CourseDetailScreen: React.FC<Props> = ({ route }) => {
  const { courseId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const course = useAppSelector(state => state.courses.courses[courseId]);

  if (!course) return null;

  const sessions = [
    { id: 1, date: 'Nov 5, 2024', time: '9:00 AM', status: 'present' as const, topic: 'Binary Trees Implementation' },
    { id: 2, date: 'Nov 4, 2024', time: '9:00 AM', status: 'present' as const, topic: 'Tree Traversal Algorithms' },
    { id: 3, date: 'Nov 1, 2024', time: '9:00 AM', status: 'absent' as const, topic: 'Graph Data Structures' },
    { id: 4, date: 'Oct 31, 2024', time: '9:00 AM', status: 'present' as const, topic: 'Hashing Techniques' },
    { id: 5, date: 'Oct 29, 2024', time: '9:00 AM', status: 'present' as const, topic: 'Advanced Sorting' },
  ];

  const attendancePercentage = (course.attended / course.totalClasses) * 100;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.courseName}>{course.name}</Text>
          <Text style={styles.courseCode}>{course.code}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vertical" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.attendanceCard}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.sectionTitle}>Overall Attendance</Text>
          <Text style={[
            styles.percentage,
            { color: attendancePercentage >= 75 ? colors.success : colors.error }
          ]}>
            {attendancePercentage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Classes Attended</Text>
            <Text style={styles.statValue}>{course.attended}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Classes</Text>
            <Text style={styles.statValue}>{course.totalClasses}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Classes Missed</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {course.totalClasses - course.attended}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Credits</Text>
            <Text style={styles.statValue}>{course.credits}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Faculty Information</Text>
        <View style={styles.facultyInfo}>
          <View style={styles.infoRow}>
            <Icon name="user" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{course.faculty}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>+91 98765 43210</Text>
            <TouchableOpacity>
              <Text style={styles.copyButton}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Icon name="mail" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>faculty@iiitnr.ac.in</Text>
            <TouchableOpacity>
              <Text style={styles.copyButton}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sectionTitle}>All Sessions</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {sessions.map(session => (
          <TouchableOpacity key={session.id} style={styles.sessionItem}>
            <View style={styles.sessionContent}>
              <View style={styles.sessionDate}>
                <Text style={styles.dateText}>{session.date}</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.timeText}>{session.time}</Text>
              </View>
              <Text style={styles.topicText}>{session.topic}</Text>
            </View>
            <StatusBadge status={session.status} />
            {session.status === 'absent' && (
              <TouchableOpacity style={styles.exceptionButton}>
                <Text style={styles.exceptionText}>Request Exception →</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing.xlarge }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.small,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: spacing.small,
  },
  menuButton: {
    padding: spacing.small,
  },
  courseName: {
    fontSize: typography.sizes.subheading,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  courseCode: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  attendanceCard: {
    backgroundColor: colors.surface,
    margin: spacing.medium,
    padding: spacing.medium,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  percentage: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.small / 2,
  },
  statItem: {
    width: '50%',
    padding: spacing.small,
  },
  statLabel: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.small / 2,
  },
  statValue: {
    fontSize: typography.sizes.subheading,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.surface,
    margin: spacing.medium,
    padding: spacing.medium,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sizes.subheading,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  facultyInfo: {
    gap: spacing.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  copyButton: {
    fontSize: typography.sizes.caption,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  filterButton: {
    padding: spacing.small,
  },
  sessionItem: {
    backgroundColor: colors.background,
    padding: spacing.medium,
    borderRadius: borderRadius.card,
    marginBottom: spacing.small,
  },
  sessionContent: {
    marginBottom: spacing.small,
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small / 2,
    marginBottom: spacing.small / 2,
  },
  dateText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  dotSeparator: {
    fontSize: typography.sizes.caption,
    color: colors.text.disabled,
  },
  timeText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  topicText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  exceptionButton: {
    marginTop: spacing.small,
  },
  exceptionText: {
    fontSize: typography.sizes.caption,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});