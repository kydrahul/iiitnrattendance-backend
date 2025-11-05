import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

type Status = 'present' | 'absent' | 'pending';

interface Props {
  status: Status;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'medium' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'absent':
        return colors.error;
      case 'pending':
        return colors.warning;
    }
  };

  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: size === 'small' ? spacing.small : spacing.medium,
      paddingVertical: size === 'small' ? 2 : 4,
      borderRadius: borderRadius.full,
      backgroundColor: getStatusColor() + '20',
    },
    text: {
      color: getStatusColor(),
      fontSize: size === 'small' ? typography.sizes.caption : typography.sizes.body,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
  });

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
};