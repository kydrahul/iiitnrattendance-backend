import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { NavigationProp } from '../../types/navigation';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';

interface Props {
  route: {
    params?: {
      courseId?: string;
      date?: string;
    };
  };
  navigation: NavigationProp;
}

export const HistoryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId, date } = route.params || {};
  const [selectedMonth, setSelectedMonth] = useState(date ? new Date(date) : new Date());

  // Mock data - replace with actual API data
  const mockHistory = [
    {
      id: '1',
      courseId: 'CS301',
      courseName: 'Database Systems',
      date: '2024-02-01',
      time: '9:00 AM',
      status: 'present' as const,
      verifiedBy: 'QR Code',
    },
    {
      id: '2',
      courseId: 'CS302',
      courseName: 'Operating Systems',
      date: '2024-02-01',
      time: '10:00 AM',
      status: 'present' as const,
      verifiedBy: 'QR Code',
    },
    {
      id: '3',
      courseId: 'CS301',
      courseName: 'Database Systems',
      date: '2024-01-31',
      time: '9:00 AM',
      status: 'absent' as const,
      verifiedBy: 'Manual',
    },
  ].filter(item => !courseId || item.courseId === courseId);

  const groupedHistory = mockHistory.reduce((acc, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = [];
    }
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, typeof mockHistory>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.filterSection}>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="calendar" size={16} color={colors.text.secondary} />
          <Text style={styles.filterButtonText}>
            {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Icon name="chevron-down" size={16} color={colors.text.secondary} />
        </TouchableOpacity>

        {courseId ? (
          <TouchableOpacity style={styles.clearButton} onPress={() => navigation.setParams({ courseId: undefined })}>
            <Icon name="x" size={16} color={colors.text.secondary} />
            <Text style={styles.clearButtonText}>Clear Filter</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter" size={16} color={colors.text.secondary} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {Object.entries(groupedHistory).map(([date, records]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>
            {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {records.map((record) => (
            <View key={record.id} style={styles.attendanceCard}>
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.courseName}>{record.courseName}</Text>
                  <Text style={styles.timeText}>{record.time}</Text>
                </View>
                <View style={styles.cardRight}>
                  <StatusBadge status={record.status} />
                  <Text style={styles.verifiedText}>
                    {record.verifiedBy}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    flexDirection: 'row',
    padding: spacing.medium,
    gap: spacing.medium,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  dateGroup: {
    marginBottom: spacing.large,
  },
  dateHeader: {
    fontSize: typography.sizes.subheading,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  attendanceCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.small,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
  },
  courseName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.small / 2,
  },
  timeText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.small / 2,
  },
  verifiedText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
});