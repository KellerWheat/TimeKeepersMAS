// Type definitions for the navigation stack
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Define all the screens in our navigation stack
export type RootStackParamList = {
  Login: undefined;
  Courses: undefined;
  TaskGeneration: { courseId: string };
  TaskReview: undefined;
  Calendar: undefined;
  DayView: { date: string };
  Schedule: undefined;
  Settings: undefined;
};

// Export types for navigation prop and route prop
export type StackNavigationProps<T extends keyof RootStackParamList> = 
  StackNavigationProp<RootStackParamList, T>;

export type StackRouteProp<T extends keyof RootStackParamList> = 
  RouteProp<RootStackParamList, T>; 