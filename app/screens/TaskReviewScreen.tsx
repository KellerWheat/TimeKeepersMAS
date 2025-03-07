// screens/TaskReviewScreen.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, Task, Subtask } from '@/src/context/AppDataContext';

interface EditingFields {
    editingDescription: boolean;
    editingDueDate: boolean;
}

// --------------------------
// TaskItem Component
// --------------------------
interface TaskItemProps {
    task: Task;
    isExpanded: boolean;
    editing: EditingFields | undefined;
    toggleExpansion: (id: string) => void;
    toggleEditing: (id: string, field: 'editingDescription' | 'editingDueDate') => void;
    updateTaskField: (id: string, field: 'task_description' | 'due_date', value: string) => void;
    updateSubtaskExpectedTime: (taskId: string, subtaskIndex: number, delta: number) => void;
    reorderSubtasks: (taskId: string, newSubtasks: Subtask[]) => void;
    deleteSubtask: (taskId: string, subtaskId: string) => void;
    addSubtask: (taskId: string) => void;
    deleteTask: (id: string) => void;
    updateSubtask: (taskId: string, subtaskId: string, updatedSubtask: Partial<Subtask>) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
                                               task,
                                               isExpanded,
                                               editing,
                                               toggleExpansion,
                                               toggleEditing,
                                               updateTaskField,
                                               updateSubtaskExpectedTime,
                                               reorderSubtasks,
                                               deleteSubtask,
                                               addSubtask,
                                               deleteTask,
                                               updateSubtask,
                                           }) => {
    // Local state to track which subtask is being edited
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);

    // Handler for finishing editing on blur for task fields
    const finishEditing = (field: 'editingDescription' | 'editingDueDate', taskId: string) => {
        toggleEditing(taskId, field);
    };

    // Render each subtask with inline editing support for description
    const renderSubtask = (params: RenderItemParams<Subtask>) => {
        // Cast params to ensure index exists
        const { item, index, drag } = params as unknown as { item: Subtask; index: number; drag: () => void; isActive: boolean };
        const isEditing = editingSubtaskId === item.id;
        return (
            <View style={sharedStyles.subtaskBox}>
                {isEditing ? (
                    <TextInput
                        style={[sharedStyles.text, { borderBottomWidth: 1, borderColor: '#ccc', padding: 4 }]}
                        value={item.description}
                        onChangeText={(text) =>
                            updateSubtask(task.id, item.id, { description: text })
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
                        onPress={() => updateSubtaskExpectedTime(task.id, index, -1)}
                        style={sharedStyles.timeButton}
                    >
                        <Text style={sharedStyles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={sharedStyles.timeValue}>{item.expected_time} hrs</Text>
                    <TouchableOpacity
                        onPress={() => updateSubtaskExpectedTime(task.id, index, 1)}
                        style={sharedStyles.timeButton}
                    >
                        <Text style={sharedStyles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                    {/* Red X to delete subtask */}
                    <TouchableOpacity
                        onPress={() => deleteSubtask(task.id, item.id)}
                        style={{ marginLeft: 8 }}
                    >
                        <Text style={{ color: 'red', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                    {/* Long press to drag */}
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
                            onChangeText={(text) => updateTaskField(task.id, 'task_description', text)}
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
                {/* Red X button to delete entire task */}
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                    <Text style={{ color: 'red', fontSize: 16, marginLeft: 8 }}>✕</Text>
                </TouchableOpacity>
            </View>
            {/* Due date centered, without prefix */}
            <View style={[sharedStyles.taskHeader, { justifyContent: 'center' }]}>
                {editing?.editingDueDate ? (
                    <TextInput
                        style={[sharedStyles.text, sharedStyles.editInput, { textAlign: 'center' }]}
                        value={task.due_date}
                        onChangeText={(text) => updateTaskField(task.id, 'due_date', text)}
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
            {/* Display course if available */}
            {task.course && <Text style={sharedStyles.text}>{task.course}</Text>}
            {/* If expanded, display subtasks */}
            {isExpanded && (
                <>
                    <DraggableFlatList
                        data={task.subtasks}
                        keyExtractor={(_, idx) => idx.toString()}
                        renderItem={renderSubtask}
                        onDragEnd={({ data }) => reorderSubtasks(task.id, data)}
                    />
                    {/* Small box to add a new subtask */}
                    <TouchableOpacity onPress={() => addSubtask(task.id)} style={sharedStyles.subtaskPlusButton}>
                        <Text style={sharedStyles.pencilSmall}>＋ Add Subtask</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

// --------------------------
// Main TaskReviewScreen Component
// --------------------------
const TaskReviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, updateTask, addTask, removeTask, updateSubtask } = useAppData();

    // Deduplicate and filter tasks (only "study" and "assignment")
    const uniqueTasks = Array.from(new Map(data.tasks.map(task => [task.id, task])).values());
    const tasks = uniqueTasks.filter(task => task.type === 'study' || task.type === 'assignment');

    const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
    const [editingFields, setEditingFields] = useState<{ [key: string]: EditingFields }>({});

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

    const updateTaskField = (id: string, field: 'task_description' | 'due_date', value: string) => {
        updateTask(id, { [field]: value });
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

    const reorderSubtasks = (taskId: string, newSubtasks: Subtask[]) => {
        updateTask(taskId, { subtasks: newSubtasks });
    };

    const deleteSubtask = (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
            updateTask(taskId, { subtasks: updatedSubtasks });
        }
    };

    const addSubtask = (taskId: string) => {
        const newSubtask = {
            id: Date.now().toString(), // ensure unique id for each subtask
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

    const deleteTask = (id: string) => {
        removeTask(id);
    };

    const renderItem = ({ item }: { item: Task }) => (
        <TaskItem
            task={item}
            isExpanded={expandedTaskIds.includes(item.id)}
            editing={editingFields[item.id]}
            toggleExpansion={toggleExpansion}
            toggleEditing={toggleEditing}
            updateTaskField={updateTaskField}
            updateSubtaskExpectedTime={updateSubtaskExpectedTime}
            reorderSubtasks={reorderSubtasks}
            deleteSubtask={deleteSubtask}
            addSubtask={addSubtask}
            deleteTask={deleteTask}
            updateSubtask={updateSubtask}
        />
    );

    // Render a small new task box for creating a new regular task.
    const renderNewTaskBox = () => (
        <TouchableOpacity
            style={sharedStyles.taskBox}
            onPress={() => {
                const newTask: Task = {
                    id: Date.now().toString(),
                    type: 'assignment',
                    due_date: '',
                    task_description: '',
                    subtasks: [],
                    updated_at: new Date().toISOString(),
                    course: '',
                };
                addTask(newTask);
            }}
        >
            <Text style={[sharedStyles.text, { color: '#2980b9' }]}>＋ New Task</Text>
        </TouchableOpacity>
    );

    return (
        <View style={sharedStyles.container}>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListFooterComponent={renderNewTaskBox}
            />
            <TouchableOpacity style={sharedStyles.button} onPress={() => navigation.navigate('Calendar')}>
                <Text style={sharedStyles.buttonText}>Submit Tasks</Text>
            </TouchableOpacity>
        </View>
    );
};

export default TaskReviewScreen;
