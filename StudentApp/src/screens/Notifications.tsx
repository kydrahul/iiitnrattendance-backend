import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { NavigationProp } from '../types/navigation';
import { Icon } from '../components/ui/Icon';

interface Props {
  navigation: NavigationProp;
}

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const notifications = [
    {
      id: '1',
      type: 'attendance',
      title: 'Attendance Marked',
      message: 'Your attendance for Database Systems (CS301) has been marked.',
      time: '2 minutes ago',
      isRead: false,
    },
    {
      id: '2',
      type: 'reminder',
      title: 'Class Reminder',
      message: 'Operating Systems (CS302) class starts in 15 minutes.',
      time: '15 minutes ago',
      isRead: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Attendance Warning',
      message: 'Your attendance in Software Engineering (CS303) is below 75%.',
      time: '1 hour ago',
      isRead: true,
    },
    {
      id: '4',
      type: 'info',
      title: 'Holiday Notice',
      message: 'All classes will be suspended on Republic Day (26th January).',
      time: '2 hours ago',
      isRead: true,
    },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'check-circle';
      case 'reminder':
        return 'clock';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'bell';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'attendance':
        return colors.success;
      case 'reminder':
        return colors.primary;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.text.secondary;
      default:
        return colors.text.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="check-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.headerButtonText}>Mark all as read</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="trash-2" size={20} color={colors.text.secondary} />
          <Text style={styles.headerButtonText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotification,
            ]}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: getColorForType(notification.type) + '20' },
            ]}>
              <Icon
                name={getIconForType(notification.type)}
                size={24}
                color={getColorForType(notification.type)}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.time}>{notification.time}</Text>
            </View>
            {!notification.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    padding: spacing.small,
  },
  headerButtonText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadNotification: {
    backgroundColor: colors.primary + '05',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  time: {
    fontSize: typography.sizes.caption,
    color: colors.text.disabled,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.small,
    alignSelf: 'center',
  },
});