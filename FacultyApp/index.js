import 'expo/build/Expo.fx';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root') ?? document.getElementById('main');
  registerRootComponent(App, { rootTag });
} else {
  registerRootComponent(App);
}