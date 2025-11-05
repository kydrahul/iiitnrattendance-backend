import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Scanner: undefined;
  CourseDetail: {
    courseId: string;
    courseName?: string;
    instructorName?: string;
    semester?: number;
  };
  WeekView: {
    courseId?: string;
  };
  History: {
    courseId?: string;
    date?: string;
  };
  Profile: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;