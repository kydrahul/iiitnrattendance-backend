import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { getCourses } from '@/services/api';
import { colors, spacing } from '@/constants/theme';
import type { Course } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseList'>;

export default function CourseListScreen({ navigation }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
    >
      <Card.Content>
        <Text variant="titleLarge">{item.name}</Text>
        <Text variant="bodyMedium" style={styles.courseCode}>
          {item.code}
        </Text>
        <View style={styles.courseInfo}>
          <Text variant="bodyMedium">
            {item.branch} • Year {item.year}
          </Text>
          <Text variant="bodyMedium" style={styles.session}>
            {item.session}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.error}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
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
  list: {
    padding: spacing.medium,
  },
  card: {
    marginBottom: spacing.medium,
    backgroundColor: colors.surface,
  },
  courseCode: {
    color: colors.text.secondary,
    marginTop: spacing.small / 2,
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.medium,
  },
  session: {
    color: colors.text.secondary,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
});