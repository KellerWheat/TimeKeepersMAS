import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';
import { Task } from './TaskReviewScreen';
import { useNavigation } from '@react-navigation/native';

const CalendarScreen: React.FC = () => {
    const { data } = useAppData();
    const tasks = data.tasks;
    const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
    const navigation = useNavigation();

    useEffect(() => {
        const marks: { [date: string]: any } = {};
        tasks.forEach((task: Task) => {
            let date = task.due_date;
            if (date) {
                if (!marks[date]) {
                    marks[date] = { marked: true, dots: [{ color: 'blue' }] };
                } else {
                    marks[date].dots.push({ color: 'blue' });
                }
            }
        });
        setMarkedDates(marks);
    }, [tasks]);

    // Get tasks for the selected day
    const getTasksForDate = (date: string) => {
        return tasks.filter(task => task.due_date === date);
    };

    // Handle day press and navigate to DayViewScreen
    const handleDayPress = (day: any) => {
        const selectedDate = day.dateString;
        const selectedTasks = getTasksForDate(selectedDate);
    
        navigation.navigate('DayView', {
            date: selectedDate,
            tasks: selectedTasks
        });
    };
    
    return (
        <View style={localStyles.container}>
            <Text style={localStyles.title}>Your Calendar</Text>
            <Calendar
                markedDates={markedDates}
                onDayPress={handleDayPress}
            />
        </View>
    );
};

export default CalendarScreen;

const localStyles = StyleSheet.create({
    container: { flex: 1, paddingTop: 40 },
    title: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
});
