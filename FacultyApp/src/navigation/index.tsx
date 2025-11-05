import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import LoginScreen from '@/screens/auth/LoginScreen';
import CourseListScreen from '@/screens/main/CourseListScreen';
import CourseDetailScreen from '@/screens/main/CourseDetailScreen';
import ManualAttendanceScreen from '@/screens/main/ManualAttendanceScreen';
import StatisticsScreen from '@/screens/main/StatisticsScreen';

export type RootStackParamList = {
  Login: undefined;
  CourseList: undefined;
  CourseDetail: { courseId: string };
  ManualAttendance: { courseId: string; sessionId: string };
  Statistics: { courseId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? 'CourseList' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E3A8A',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="CourseList" 
              component={CourseListScreen}
              options={{ title: 'My Courses' }}
            />
            <Stack.Screen 
              name="CourseDetail" 
              component={CourseDetailScreen}
              options={{ title: 'Course Details' }}
            />
            <Stack.Screen 
              name="ManualAttendance" 
              component={ManualAttendanceScreen}
              options={{ title: 'Mark Attendance' }}
            />
            <Stack.Screen 
              name="Statistics" 
              component={StatisticsScreen}
              options={{ title: 'Attendance Statistics' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}