// screens/TaskReviewScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, Task, Subtask, Course } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';
import { StackNavigationProps } from '../navigation';

interface EditingFields {
    editingDescription: boolean;
    editingDueDate: boolean;
}

// --------------------------
// TaskItem Component
// --------------------------
interface TaskItemProps {
    task: Task;
    courseId: string;
    courseName: string;
    isExpanded: boolean;
    editing: EditingFields | undefined;
    toggleExpansion: (id: string) => void;
    toggleEditing: (id: string, field: 'editingDescription' | 'editingDueDate') => void;
    updateTaskField: (courseId: string, id: string, field: 'task_description' | 'due_date', value: string) => void;
    reorderSubtasks: (courseId: string, taskId: string, newSubtasks: Subtask[]) => void;
    deleteSubtask: (courseId: string, taskId: string, subtaskId: string) => void;
    addSubtask: (courseId: string, taskId: string) => void;
    deleteTask: (courseId: string, id: string) => void;
    updateSubtask: (courseId: string, taskId: string, subtaskId: string, updatedSubtask: Partial<Subtask>) => void;
    toggleApproval: (courseId: string, taskId: string, approved: boolean) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
    task,
    courseId,
    courseName,
    isExpanded,
    editing,
    toggleExpansion,
    toggleEditing,
    updateTaskField,
    reorderSubtasks,
    deleteSubtask,
    addSubtask,
    deleteTask,
    updateSubtask,
    toggleApproval,
}) => {
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);

    const finishEditing = (field: 'editingDescription' | 'editingDueDate', taskId: string) => {
        toggleEditing(taskId, field);
    };

    const renderSubtask = (params: RenderItemParams<Subtask>) => {
        const { item, drag } = params as { item: Subtask; drag: () => void; isActive: boolean };
        const isEditing = editingSubtaskId === item.id;
        return (
            <View style={sharedStyles.subtaskBox}>
                {isEditing ? (
                    <TextInput
                        style={[sharedStyles.text, { borderBottomWidth: 1, borderColor: '#ccc', padding: 4 }]}
                        value={item.description}
                        onChangeText={(text) =>
                            updateSubtask(courseId, task.id, item.id, { description: text })
                        }
                        onBlur={() => setEditingSubtaskId(null)}
                    />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={sharedStyles.text}>
                            {item.description || 'Subtask description'}
                        </Text>
                        <TouchableOpacity onPress={() => setEditingSubtaskId(item.id)}>
                            <Text style={sharedStyles.pencilSmall}>✏️</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={sharedStyles.timeContainer}>
                    <TouchableOpacity
                        onPress={() => updateSubtask(courseId, task.id, item.id, { expected_time: (item.expected_time || 0) - 1 })}
                        style={sharedStyles.timeButton}
                    >
                        <Text style={sharedStyles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={sharedStyles.timeValue}>{item.expected_time} hrs</Text>
                    <TouchableOpacity
                        onPress={() => updateSubtask(courseId, task.id, item.id, { expected_time: (item.expected_time || 0) + 1 })}
                        style={sharedStyles.timeButton}
                    >
                        <Text style={sharedStyles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => deleteSubtask(courseId, task.id, item.id)}
                        style={{ marginLeft: 8 }}
                    >
                        <Text style={{ color: 'red', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onLongPress={drag} style={{ marginLeft: 8 }}>
                        <Text style={{ color: '#2980b9', fontSize: 16 }}>↕</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={[sharedStyles.taskBox, task.approved_by_user ? sharedStyles.approvedTask : {}]}>
            <View style={sharedStyles.taskHeader}>
                <TouchableOpacity onPress={() => toggleExpansion(task.id)} style={{ flex: 1 }}>
                    {editing?.editingDescription ? (
                        <TextInput
                            style={[sharedStyles.text, sharedStyles.editInput]}
                            value={task.task_description}
                            onChangeText={(text) => updateTaskField(courseId, task.id, 'task_description', text)}
                            onBlur={() => finishEditing('editingDescription', task.id)}
                        />
                    ) : (
                        <Text style={[sharedStyles.screenTitle, sharedStyles.taskTitle]}>
                            {task.task_description || 'Task Description'}{' '}
                            <Text onPress={() => toggleEditing(task.id, 'editingDescription')} style={sharedStyles.pencilSmall}>
                                ✏️
                            </Text>
                        </Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => toggleApproval(courseId, task.id, !task.approved_by_user)}
                    style={{ marginHorizontal: 8 }}
                >
                    <Text style={task.approved_by_user ? sharedStyles.approvedIcon : sharedStyles.unapprovedIcon}>
                        {task.approved_by_user ? '✓' : '○'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(courseId, task.id)}>
                    <Text style={{ color: 'red', fontSize: 16, marginLeft: 8 }}>✕</Text>
                </TouchableOpacity>
            </View>
            <View style={[sharedStyles.taskHeader, { justifyContent: 'center' }]}>
                {editing?.editingDueDate ? (
                    <TextInput
                        style={[sharedStyles.text, sharedStyles.editInput, { textAlign: 'center' }]}
                        value={task.due_date}
                        onChangeText={(text) => updateTaskField(courseId, task.id, 'due_date', text)}
                        onBlur={() => finishEditing('editingDueDate', task.id)}
                    />
                ) : (
                    <Text style={[sharedStyles.text, { textAlign: 'center' }]}>
                        {task.due_date || 'No due date'}
                    </Text>
                )}
                <TouchableOpacity onPress={() => toggleEditing(task.id, 'editingDueDate')}>
                    <Text style={sharedStyles.pencilSmall}>✏️</Text>
                </TouchableOpacity>
            </View>
            <Text style={[sharedStyles.text, { textAlign: 'center', color: '#666' }]}>{courseName}</Text>
            {isExpanded && (
                <>
                    <DraggableFlatList
                        data={task.subtasks}
                        keyExtractor={(item) => item.id}
                        renderItem={renderSubtask}
                        onDragEnd={({ data }) => reorderSubtasks(courseId, task.id, data)}
                    />
                    <TouchableOpacity onPress={() => addSubtask(courseId, task.id)} style={sharedStyles.subtaskPlusButton}>
                        <Text style={sharedStyles.pencilSmall}>＋ Add Subtask</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

// Course Selection Modal Component
interface CourseSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (courseId: string) => void;
    courses: Course[];
}

const CourseSelectionModal: React.FC<CourseSelectionModalProps> = ({
    visible,
    onClose,
    onSelect,
    courses,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={sharedStyles.modalOverlay}>
                <View style={sharedStyles.modalContent}>
                    <Text style={sharedStyles.modalTitle}>Select Course</Text>
                    <FlatList
                        data={courses}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={sharedStyles.courseItem}
                                onPress={() => onSelect(item.id)}
                            >
                                <Text style={sharedStyles.courseItemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={sharedStyles.modalCloseButton} onPress={onClose}>
                        <Text style={sharedStyles.modalCloseButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --------------------------
// Main TaskReviewScreen Component
// --------------------------
type TaskReviewScreenProps = {
    navigation: StackNavigationProps<'TaskReview'>;
};

const TaskReviewScreen = ({ navigation }: TaskReviewScreenProps) => {
    const { data, updateTask, addTask, removeTask, updateSubtask, removeSubtask, addSubtask, approveAllTasks, areAllTasksApproved, autoScheduleTasks, toggleTaskApproval } = useAppData();
    const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
    const [editingFields, setEditingFields] = useState<{ [key: string]: EditingFields }>({});
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

    // Calculate the date threshold based on user preferences
    const currentDate = new Date();
    const maxViewDate = new Date();
    maxViewDate.setDate(currentDate.getDate() + data.preferences.taskViewPeriodDays);

    // Get all tasks from all courses and sort by due date, filtering by the view period and excluding past due tasks
    const allTasks = data.courses.flatMap(course => 
        course.tasks.map(task => ({
            ...task,
            courseId: course.id,
            courseName: course.name
        }))
    )
    .filter(task => {
        const taskDate = new Date(task.due_date);
        // Only include tasks that:
        // 1. Have a valid date
        // 2. Are not past due (due date is on or after current date)
        // 3. Are within the specified view period
        return !isNaN(taskDate.getTime()) && 
               taskDate >= currentDate && 
               taskDate <= maxViewDate;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    // Auto-skip to calendar if all tasks are already approved
    useEffect(() => {
        // Only auto-navigate if we haven't done so already and all tasks are approved
        if (!hasAutoNavigated && areAllTasksApproved() && allTasks.length > 0) {
            // Set the flag to prevent repeated navigation
            setHasAutoNavigated(true);
            
            // If all tasks are approved, run auto-scheduling and navigate to calendar
            autoScheduleTasks();
            navigation.navigate('Calendar');
        }
    }, [areAllTasksApproved, allTasks.length, autoScheduleTasks, navigation, hasAutoNavigated]);

    // Helper functions for TaskItem
    const toggleExpansion = (id: string) => {
        setExpandedTaskIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleEditing = (id: string, field: 'editingDescription' | 'editingDueDate') => {
        setEditingFields(prev => {
            const current = prev[id] || { editingDescription: false, editingDueDate: false };
            return { ...prev, [id]: { ...current, [field]: !current[field] } };
        });
    };

    const updateTaskField = (courseId: string, id: string, field: 'task_description' | 'due_date', value: string) => {
        updateTask(courseId, id, { [field]: value });
    };

    const toggleApproval = (courseId: string, taskId: string, approved: boolean) => {
        toggleTaskApproval(courseId, taskId);
    };

    const reorderSubtasks = (courseId: string, taskId: string, newSubtasks: Subtask[]) => {
        updateTask(courseId, taskId, { subtasks: newSubtasks });
    };

    const newSubtask = (courseId: string, taskId: string) => {
        const newSubtask = {
            id: uuidv4(),
            description: '',
            expected_time: 0,
            current_percentage_completed: 0,
        };
        addSubtask(courseId, taskId, newSubtask);
        if (!expandedTaskIds.includes(taskId)) {
            setExpandedTaskIds(prev => [...prev, taskId]);
        }
    };

    const handleNewTask = (courseId: string) => {
        const newTask: Task = {
            id: uuidv4(),
            type: 'assignment',
            due_date: '',
            task_description: '',
            subtasks: [],
            documents: [],
            approved_by_user: true,
        };
        addTask(courseId, newTask);
        setShowCourseModal(false);
    };

    const handleScheduleTasks = useCallback(() => {
        setIsScheduling(true);
        autoScheduleTasks();
        setTimeout(() => {
            setIsScheduling(false);
            navigation.navigate('Calendar');
        }, 500); // Short delay for visual feedback
    }, [autoScheduleTasks, navigation]);

    const handleEditSchedule = useCallback(() => {
        navigation.navigate('Schedule');
    }, [navigation]);

    const renderItem = ({ item }: { item: Task & { courseId: string; courseName: string } }) => (
        <TaskItem
            task={item}
            courseId={item.courseId}
            courseName={item.courseName}
            isExpanded={expandedTaskIds.includes(item.id)}
            editing={editingFields[item.id]}
            toggleExpansion={toggleExpansion}
            toggleEditing={toggleEditing}
            updateTaskField={updateTaskField}
            reorderSubtasks={reorderSubtasks}
            deleteSubtask={removeSubtask}
            addSubtask={newSubtask}
            deleteTask={removeTask}
            updateSubtask={updateSubtask}
            toggleApproval={toggleApproval}
        />
    );

    // Organize tasks by course for display
    const tasksByCourse = data.courses.map(course => ({
        course,
        tasks: course.tasks.filter(task => task.due_date) // Only show tasks with due dates
    })).filter(item => item.tasks.length > 0); // Only show courses with tasks

    return (
        <View style={styles.container}>
            <Text style={sharedStyles.screenTitle}>Review Your Tasks</Text>
            
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Approve the tasks you want to include in your schedule.
                </Text>
            </View>
            
            {allTasks.length === 0 ? (
                <Text style={styles.noTasksText}>
                    No tasks available for review. Generate tasks from your courses first.
                </Text>
            ) : (
                <FlatList
                    data={allTasks}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    style={styles.scrollContainer}
                />
            )}
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        sharedStyles.button,
                        styles.scheduleButton,
                        isScheduling && styles.buttonDisabled
                    ]}
                    onPress={handleScheduleTasks}
                    disabled={isScheduling}
                >
                    <Text style={sharedStyles.buttonText}>
                        {isScheduling ? 'Scheduling...' : 'Schedule Approved Tasks'}
                    </Text>
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCourseModal(true)}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
            
            <CourseSelectionModal
                visible={showCourseModal}
                onClose={() => setShowCourseModal(false)}
                onSelect={handleNewTask}
                courses={data.courses}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f0f4f8',
    },
    scrollContainer: {
        flex: 1,
        marginBottom: 16,
    },
    infoContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 8,
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 80,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2c3e50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    addButtonText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    buttonContainer: {
        marginTop: 8,
    },
    scheduleButton: {
        backgroundColor: '#009688',
        paddingVertical: 12,
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6',
    },
    noTasksText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: '#7f8c8d',
    },
});

export default TaskReviewScreen;
