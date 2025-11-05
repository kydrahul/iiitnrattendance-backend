import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface Props {
  percentage: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const AttendancePercentage: React.FC<Props> = ({ percentage, showLabel = true, size = 'medium' }) => {
  const getPercentageColor = () => {
    if (percentage >= 75) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return typography.sizes.body;
      case 'large':
        return typography.sizes.h2;
      default:
        return typography.sizes.subheading;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.percentage, { color: getPercentageColor(), fontSize: getFontSize() }]}>
        {percentage.toFixed(1)}%
      </Text>
      {showLabel && (
        <Text style={styles.label}>Attendance</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  percentage: {
    fontWeight: '700',
  },
  label: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.small / 2,
  },
});