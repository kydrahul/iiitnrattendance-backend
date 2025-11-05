import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { NavigationProp } from '../types/navigation';
import { useAppSelector } from '../store';
import { Icon } from '../components/ui/Icon';

interface Props {
  navigation: NavigationProp;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAppSelector(state => state.auth.user);

  if (!user) return null;

  const menuItems = [
    {
      icon: 'user',
      title: 'Personal Information',
      subtitle: 'Name, roll number, program details',
    },
    {
      icon: 'shield',
      title: 'Password & Security',
      subtitle: 'Change password, 2FA settings',
    },
    {
      icon: 'bell',
      title: 'Notifications',
      subtitle: 'Push notifications, email alerts',
    },
    {
      icon: 'settings',
      title: 'App Settings',
      subtitle: 'Theme, language, accessibility',
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      subtitle: 'FAQs, contact support',
    },
    {
      icon: 'info',
      title: 'About',
      subtitle: 'App version, terms, privacy policy',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Icon name="edit-2" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.programInfo}>
          <Text style={styles.infoText}>
            {user.programId} • Year {user.year}
          </Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
          >
            <Icon name={item.icon as any} size={24} color={colors.text.primary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.text.disabled} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Icon name="log-out" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.large,
    backgroundColor: colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.medium,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.background,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    padding: spacing.small,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.small / 2,
  },
  email: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
  },
  programInfo: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.button,
  },
  infoText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  menuSection: {
    backgroundColor: colors.surface,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  menuItemTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '10',
    marginHorizontal: spacing.medium,
    marginTop: spacing.xlarge,
    padding: spacing.medium,
    borderRadius: borderRadius.button,
    gap: spacing.small,
  },
  logoutText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.sizes.caption,
    color: colors.text.disabled,
    marginTop: spacing.medium,
    marginBottom: spacing.xlarge,
  },
});