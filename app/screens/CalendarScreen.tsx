// screens/TaskReviewScreen.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, Task } from '@/src/context/AppDataContext';

interface EditingFields {
    editingDescription: boolean;
    editingDueDate: boolean;
}

const TaskReviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, updateTask } = useAppData();
    // Filter tasks: only "study" and "assignment" types.
    const tasks = data.tasks.filter(task => task.type === 'study' || task.type === 'assignment');
    const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
    const [editingFields, setEditingFields] = useState<{ [key: string]: EditingFields }>({});

    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const toggleEditing = (taskId: string, field: keyof EditingFields) => {
        setEditingFields(prev => {
            const current = prev[taskId] || { editingDescription: false, editingDueDate: false };
            return { ...prev, [taskId]: { ...current, [field]: !current[field] } };
        });
    };

    const updateTaskField = (taskId: string, field: 'task_description' | 'due_date', value: string) => {
        updateTask(taskId, { [field]: value });
    };

    const updateSubtaskExpectedTime = (taskId: string, subtaskIndex: number, delta: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const currentTime = parseInt(task.subtasks[subtaskIndex].expected_time || '0', 10);
            const newTime = Math.max(currentTime + delta, 0);
            const updatedSubtasks = task.subtasks.map((subtask, idx) =>
                idx === subtaskIndex ? { ...subtask, expected_time: newTime.toString() } : subtask
            );
            updateTask(taskId, { subtasks: updatedSubtasks });
        }
    };

    const addSubtask = (taskId: string) => {
        const newSubtask = {
            description: '',
            expected_time: '0',
            current_percentage_completed: 0,
        };
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const updatedSubtasks = [...task.subtasks, newSubtask];
            updateTask(taskId, { subtasks: updatedSubtasks });
        }
        if (!expandedTaskIds.includes(taskId)) {
            setExpandedTaskIds(prev => [...prev, taskId]);
        }
    };

    const renderSubtasks = (task: Task) => (
        <View style={sharedStyles.subtaskContainer}>
            {task.subtasks.map((subtask, index) => (
                <View key={index} style={sharedStyles.subtaskBox}>
                    <Text style={sharedStyles.text}>
                        {subtask.description || 'Subtask description'}
                    </Text>
                    <View style={sharedStyles.timeContainer}>
                        <TouchableOpacity
                            onPress={() => updateSubtaskExpectedTime(task.id, index, -1)}
                            style={sharedStyles.timeButton}
                        >
                            <Text style={sharedStyles.timeButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={sharedStyles.timeValue}>{subtask.expected_time} hrs</Text>
                        <TouchableOpacity
                            onPress={() => updateSubtaskExpectedTime(task.id, index, 1)}
                            style={sharedStyles.timeButton}
                        >
                            <Text style={sharedStyles.timeButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderItem = ({ item }: { item: Task }) => {
        const isEditingDescription = editingFields[item.id]?.editingDescription;
        const isEditingDueDate = editingFields[item.id]?.editingDueDate;
        return (
            <View style={sharedStyles.taskBox}>
                <View style={sharedStyles.taskHeader}>
                    {isEditingDescription ? (
                        <TextInput
                            style={[sharedStyles.text, sharedStyles.editInput]}
                            value={item.task_description}
                            onChangeText={(text) => updateTaskField(item.id, 'task_description', text)}
                        />
                    ) : (
                        <Text style={[sharedStyles.screenTitle, sharedStyles.taskTitle]}>
                            {item.task_description || 'Task Description'}
                        </Text>
                    )}
                    <TouchableOpacity onPress={() => toggleEditing(item.id, 'editingDescription')}>
                        <Text style={sharedStyles.pencil}>✏️</Text>
                    </TouchableOpacity>
                </View>
                {/* Display course under task description, if provided */}
                {item.course && (
                    <Text style={sharedStyles.text}>{item.course}</Text>
                )}
                <View style={sharedStyles.taskHeader}>
                    {isEditingDueDate ? (
                        <TextInput
                            style={[sharedStyles.text, sharedStyles.editInput]}
                            value={item.due_date}
                            onChangeText={(text) => updateTaskField(item.id, 'due_date', text)}
                        />
                    ) : (
                        <Text style={sharedStyles.text}>
                            Due: {item.due_date || 'No due date'}
                        </Text>
                    )}
                    <TouchableOpacity onPress={() => toggleEditing(item.id, 'editingDueDate')}>
                        <Text style={sharedStyles.pencil}>✏️</Text>
                    </TouchableOpacity>
                </View>
                {/* Plus button for adding a subtask */}
                <TouchableOpacity onPress={() => addSubtask(item.id)} style={sharedStyles.subtaskPlusButton}>
                    <Text style={sharedStyles.pencil}>＋</Text>
                </TouchableOpacity>
                {expandedTaskIds.includes(item.id) && renderSubtasks(item)}
            </View>
        );
    };

    return (
        <View style={sharedStyles.container}>
            <FlatList data={tasks} keyExtractor={(item) => item.id} renderItem={renderItem} />
            <TouchableOpacity style={sharedStyles.button} onPress={() => navigation.navigate('Calendar')}>
                <Text style={sharedStyles.buttonText}>Submit Tasks</Text>
            </TouchableOpacity>
        </View>
    );
};

export default TaskReviewScreen;
