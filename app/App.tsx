// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import CoursesScreen from './screens/CoursesScreen';
import TaskGenerationScreen from './screens/TaskGenerationScreen';
import TaskReviewScreen from './screens/TaskReviewScreen';
import CalendarScreen from './screens/CalendarScreen';
import { navHeader } from '@/src/sharedStyles';
import { AppDataProvider } from '@/src/context/AppDataContext';

const Stack = createStackNavigator();

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
                    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Canvas Login' }} />
                    <Stack.Screen name="Courses" component={CoursesScreen} options={{ title: 'Your Courses' }} />
                    <Stack.Screen name="TaskGeneration" component={TaskGenerationScreen} options={{ title: 'Generate Tasks' }} />
                    <Stack.Screen name="TaskReview" component={TaskReviewScreen} options={{ title: 'Review Tasks' }} />
                    <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Your Calendar' }} />
                </Stack.Navigator>
            </NavigationContainer>
        </AppDataProvider>
    );
}
