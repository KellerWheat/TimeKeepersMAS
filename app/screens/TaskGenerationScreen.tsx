// screens/TaskGenerationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { fetchCourseCalendar } from '@/src/api/canvasApi';
import { generateTasksFromData } from '@/src/api/chatgptApi';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';

const TaskGenerationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, setTasks } = useAppData();
    const token = data.token;
    const courses = data.courses;
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!token) {
            console.error("Token is null. Aborting Task Generation.");
            navigation.navigate('Login');
            return;
        }

        // Prevent re-generation if tasks already exist
        if (data.tasks && data.tasks.length > 0) {
            setLoading(false);
            navigation.navigate('TaskReview');
            return;
        }

        const processCourses = async () => {
            let allTasks: any[] = [];
            for (let course of courses) {
                const calendarData = await fetchCourseCalendar(token, course.id);
                const generatedTasks = await generateTasksFromData(calendarData);
                allTasks = [...allTasks, ...generatedTasks];
            }
            setTasks(allTasks); // update global tasks
            setLoading(false);
            navigation.navigate('TaskReview');
        };

        processCourses();
    }, [token, courses, navigation, setTasks, data.tasks]);


    if (loading) {
        return (
            <View style={sharedStyles.container}>
                <Text style={sharedStyles.screenTitle}>Generating Tasks</Text>
                <ActivityIndicator size="large" color="#2980b9" style={{ marginVertical: 20 }} />
                <Text style={sharedStyles.text}>Loading tasks...</Text>
            </View>
        );
    }

    return null;
};

export default TaskGenerationScreen;
