import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Task } from '@/src/context/AppDataContext';

const DayViewScreen: React.FC = () => {
    const route = useRoute();
    const { date, tasks }: { date: string; tasks: Task[] } = route.params as any;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Tasks for {date}</Text>
            {tasks.length === 0 ? (
                <Text style={styles.emptyText}>No tasks for this day.</Text>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.taskItem}>
                            <Text style={styles.taskText}>{item.task_description}</Text>
                            <Text style={styles.taskDueDate}>Due: {item.due_date || 'No due date'}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    taskItem: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 1,
    },
    taskText: {
        fontSize: 18,
        fontWeight: '500',
    },
    taskDueDate: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
    },
});

export default DayViewScreen;
