import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store/index';
import { RootStackParamList } from './src/types/navigation';
import { SplashScreen } from './src/screens/SplashScreen';
import { Login } from './src/screens/Login';
import { Home } from './src/screens/Home';
import { Scanner } from './src/screens/Scanner';
import { CourseDetailScreen } from './src/screens/detail/CourseDetail';
import { WeekViewScreen } from './src/screens/tabs/WeekView';
import { HistoryScreen } from './src/screens/tabs/History';
import { ProfileScreen } from './src/screens/Profile';
import { SettingsScreen } from './src/screens/Settings';
import { NotificationsScreen } from './src/screens/Notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1E3A8A',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}>
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Login" 
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={Home} 
              options={{ 
                title: 'IIIT-NR Attendance',
                headerLeft: () => null // Disable back button on home
              }}
            />
            <Stack.Screen 
              name="Scanner" 
              component={Scanner}
              options={{
                title: 'Scan QR Code',
              }}
            />
            <Stack.Screen
              name="CourseDetail"
              component={CourseDetailScreen}
              options={{
                title: '',
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="WeekView"
              component={WeekViewScreen}
              options={{
                title: '',
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{
                title: 'Attendance History',
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: 'My Profile',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                title: 'Notifications',
              }}
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
