// screens/TaskReviewScreen.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, Task, Subtask, Course } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';

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
        <View style={sharedStyles.taskBox}>
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
const TaskReviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, updateTask, addTask, removeTask, updateSubtask, removeSubtask, addSubtask } = useAppData();
    const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
    const [editingFields, setEditingFields] = useState<{ [key: string]: EditingFields }>({});
    const [showCourseModal, setShowCourseModal] = useState(false);

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
        />
    );

    return (
        <View style={sharedStyles.container}>
            <FlatList
                data={allTasks}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListFooterComponent={
                    <TouchableOpacity
                        style={sharedStyles.taskBox}
                        onPress={() => setShowCourseModal(true)}
                    >
                        <Text style={[sharedStyles.text, { color: '#2980b9' }]}>＋ New Task</Text>
                    </TouchableOpacity>
                }
            />
            <TouchableOpacity style={sharedStyles.button} onPress={() => navigation.navigate('Calendar')}>
                <Text style={sharedStyles.buttonText}>Submit Tasks</Text>
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

export default TaskReviewScreen;
