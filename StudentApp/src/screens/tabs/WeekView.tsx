import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { Icon } from '../../components/ui/Icon';

export const WeekViewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Timetable</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('History')}
          >
            <Icon name="history" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="filter" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal>
        <View style={styles.timetableContainer}>
          <View style={styles.daysRow}>
            <View style={styles.timeCell}>
              <Text style={styles.dayText}>Time</Text>
            </View>
            {days.map(day => (
              <View key={day} style={styles.dayCell}>
                <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
              </View>
            ))}
          </View>

          {timeSlots.map((time, timeIdx) => (
            <View key={time} style={styles.timeRow}>
              <View style={styles.timeCell}>
                <Text style={styles.timeText}>{time}</Text>
              </View>
              {days.map((day, dayIdx) => {
                const hasClass = (dayIdx + timeIdx) % 3 === 0;
                return (
                  <View
                    key={`${day}-${time}`}
                    style={[
                      styles.classCell,
                      hasClass ? styles.classCellActive : styles.classCellEmpty
                    ]}
                  >
                    {hasClass && (
                      <>
                        <Text style={styles.courseCode}>CS{200 + timeIdx}</Text>
                        <Text style={styles.roomText}>Room {300 + timeIdx}</Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
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
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.medium,
    fontSize: typography.sizes.subheading,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  actionButton: {
    padding: spacing.small,
  },
  timetableContainer: {
    padding: spacing.medium,
    minWidth: 800,
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: spacing.small,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: spacing.small,
  },
  timeCell: {
    width: 80,
    justifyContent: 'center',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.small,
  },
  classCell: {
    flex: 1,
    marginHorizontal: spacing.small / 2,
    padding: spacing.small,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    minHeight: 60,
  },
  classCellActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '20',
  },
  classCellEmpty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  dayText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  timeText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  courseCode: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  roomText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
});