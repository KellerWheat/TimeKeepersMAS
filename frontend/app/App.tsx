import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


import LoginScreen from './screens/LoginScreen';
import CoursesScreen from './screens/CoursesScreen';
import TaskGenerationScreen from './screens/TaskGenerationScreen';
import TaskReviewScreen from './screens/TaskReviewScreen';
import CalendarScreen from './screens/CalendarScreen';
import DayViewScreen from './screens/DayViewScreen';
import SettingsScreen from './screens/SettingsScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import { navHeader } from '@/src/sharedStyles';
import { AppDataProvider } from '@/src/context/AppDataContext';
import { RootStackParamList } from './navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <AppDataProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                        ...navHeader,
                    }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Courses" component={CoursesScreen} options={{ title: 'Your Courses' }} />
                    <Stack.Screen name="TaskGeneration" component={TaskGenerationScreen} options={{ title: 'Generate Tasks' }} />
                    <Stack.Screen name="TaskReview" component={TaskReviewScreen} options={{ title: 'Review Tasks' }} />
                    <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Your Calendar' }} />
                    <Stack.Screen name="DayView" component={DayViewScreen} options={{ title: 'Tasks for the Day' }} />
                    <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Weekly Schedule' }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
                </Stack.Navigator>
            </NavigationContainer>
        </AppDataProvider>
    );
}
