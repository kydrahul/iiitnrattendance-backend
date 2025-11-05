import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, Text, Checkbox, Button, ActivityIndicator } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import { markManualAttendance } from '@/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ManualAttendance'>;

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

const DUMMY_STUDENTS: Student[] = [
  // TODO: Replace with actual API call
  { id: '1', name: 'John Doe', rollNumber: 'CS001' },
  { id: '2', name: 'Jane Smith', rollNumber: 'CS002' },
  // Add more dummy data as needed
];

export default function ManualAttendanceScreen({ route, navigation }: Props) {
  const { courseId, sessionId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>(DUMMY_STUDENTS);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await markManualAttendance(
        sessionId,
        Array.from(selectedStudents),
        'present'
      );
      navigation.goBack();
    } catch (err) {
      setError('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.studentItem}>
      <View style={styles.studentInfo}>
        <Text variant="bodyLarge">{item.name}</Text>
        <Text variant="bodyMedium" style={styles.rollNumber}>
          {item.rollNumber}
        </Text>
      </View>
      <Checkbox
        status={selectedStudents.has(item.id) ? 'checked' : 'unchecked'}
        onPress={() => toggleStudent(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name or roll number"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Text variant="bodyMedium">
          Selected: {selectedStudents.size} students
        </Text>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || selectedStudents.size === 0}
          style={styles.submitButton}
        >
          Mark Present
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchbar: {
    margin: spacing.medium,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.medium,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  studentInfo: {
    flex: 1,
  },
  rollNumber: {
    color: colors.text.secondary,
    marginTop: spacing.small / 2,
  },
  footer: {
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    backgroundColor: colors.background,
  },
  submitButton: {
    marginTop: spacing.small,
    backgroundColor: colors.primary,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
});