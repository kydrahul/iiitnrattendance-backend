import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import { getAttendanceStats } from '@/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';
import type { AttendanceStats } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Statistics'>;

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function StatisticsScreen({ route }: Props) {
  const { courseId } = route.params;
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [courseId, viewMode]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let from: Date, to: Date;

      switch (viewMode) {
        case 'daily':
          from = new Date(now.setDate(now.getDate() - 7)); // Last 7 days
          to = new Date();
          break;
        case 'weekly':
          from = new Date(now.setDate(now.getDate() - 28)); // Last 4 weeks
          to = new Date();
          break;
        case 'monthly':
          from = new Date(now.setMonth(now.getMonth() - 3)); // Last 3 months
          to = new Date();
          break;
      }

      const data = await getAttendanceStats(courseId, from.toISOString(), to.toISOString());
      setStats(data);
    } catch (err) {
      setError('Failed to load attendance statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'No data available'}</Text>
      </View>
    );
  }

  const presentPercentage = ((stats.present / stats.total) * 100).toFixed(1);

  return (
    <ScrollView style={styles.container}>
      <SegmentedButtons
        value={viewMode}
        onValueChange={(value) => setViewMode(value as ViewMode)}
        buttons={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
        style={styles.viewModeButtons}
      />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="displayMedium" style={styles.statValue}>
                {stats.total}
              </Text>
              <Text variant="bodyMedium">Total Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="displayMedium" style={styles.statValue}>
                {presentPercentage}%
              </Text>
              <Text variant="bodyMedium">Present</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Detailed Statistics
          </Text>
          {Object.entries(stats.byDate).map(([date, dateStats]) => (
            <View key={date} style={styles.dateStats}>
              <Text variant="bodyMedium">{new Date(date).toLocaleDateString()}</Text>
              <View style={styles.dateStatsValues}>
                <Text variant="bodyMedium" style={styles.presentCount}>
                  Present: {dateStats.present}
                </Text>
                <Text variant="bodyMedium" style={styles.absentCount}>
                  Absent: {dateStats.absent}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
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
  viewModeButtons: {
    margin: spacing.medium,
  },
  card: {
    margin: spacing.medium,
    marginTop: 0,
    backgroundColor: colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.medium,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
  },
  sectionTitle: {
    marginBottom: spacing.medium,
  },
  dateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  dateStatsValues: {
    flexDirection: 'row',
  },
  presentCount: {
    color: colors.success,
    marginRight: spacing.medium,
  },
  absentCount: {
    color: colors.error,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
});