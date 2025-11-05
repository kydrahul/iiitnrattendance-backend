import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface Props {
  code: string;
  name: string;
  faculty: string;
  attendance: {
    attended: number;
    total: number;
  };
  onPress?: () => void;
}

export const CourseCard: React.FC<Props> = ({ code, name, faculty, attendance, onPress }) => {
  const attendancePercentage = (attendance.attended / attendance.total) * 100;

  const getAttendanceColor = () => {
    if (attendancePercentage >= 75) return colors.success;
    if (attendancePercentage >= 60) return colors.warning;
    return colors.error;
  };

  const getCardBackground = () => {
    return attendancePercentage < 75 ? colors.error + '10' : colors.surface;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: getCardBackground() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{code}</Text>
          </View>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.faculty}>{faculty}</Text>
        <View style={styles.footer}>
          <Text style={styles.attendanceText}>
            {attendance.attended}/{attendance.total} classes
          </Text>
          <Text style={[styles.percentage, { color: getAttendanceColor() }]}>
            {attendancePercentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  badge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: borderRadius.button,
  },
  badgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: '500',
  },
  name: {
    fontSize: typography.sizes.subheading,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small / 2,
  },
  faculty: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  percentage: {
    fontSize: typography.sizes.subheading,
    fontWeight: '700',
  },
});