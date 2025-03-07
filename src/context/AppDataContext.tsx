import React, { createContext, useState, ReactNode, useContext } from 'react';

export interface Subtask {
    id: string;
    description: string;
    expected_time: number;
    current_percentage_completed: number;
}

export interface Task {
    id: string;
    type: string;
    due_date: string;
    task_description: string;
    course: string;
    subtasks: Subtask[];
    updated_at: string;
}

export interface AppData {
    token: string | null;
    courses: any[];
    tasks: Task[];
}

export interface AppDataContextType {
    data: AppData;
    setToken: (token: string) => void;
    setCourses: (courses: any[]) => void;
    setTasks: (tasks: Task[]) => void;
    updateTask: (taskId: string, updatedTask: Partial<Task>) => void;
    removeTask: (taskId: string) => void;
    addTask: (newTask: Task) => void;
    updateData: (newData: Partial<AppData>) => void;
    removeSubtask: (taskId: string, subtaskId: string) => void;
    updateSubtask: (taskId: string, subtaskId: string, updatedSubtask: Partial<Subtask>) => void;
    addSubtask: (taskId: string, newSubtask: Subtask) => void;
}

const defaultData: AppData = {
    token: null,
    courses: [],
    tasks: [],
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProviderProps {
    children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
    const [data, setData] = useState<AppData>(defaultData);

    const setToken = (token: string) => {
        setData((prev) => ({ ...prev, token }));
    };

    const setCourses = (courses: any[]) => {
        setData((prev) => ({ ...prev, courses }));
    };

    const setTasks = (tasks: Task[]) => {
        setData((prev) => ({ ...prev, tasks }));
    };

    const updateTask = (taskId: string, updatedTask: Partial<Task>) => {
        setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map((task) =>
                task.id === taskId
                    ? { ...task, ...updatedTask, updated_at: new Date().toISOString() }
                    : task
            ),
        }));
    };

    const removeTask = (taskId: string) => {
        setData((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((task) => task.id !== taskId),
        }));
    };

    const addTask = (newTask: Task) => {
        setData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, newTask],
        }));
    };

    const updateData = (newData: Partial<AppData>) => {
        setData((prev) => ({ ...prev, ...newData }));
    };

    // Remove a subtask from a task, given the task's id and the subtask's id.
    const removeSubtask = (taskId: string, subtaskId: string) => {
        setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId),
                    }
                    : task
            ),
        }));
    };

    // Update a subtask for a given task.
    const updateSubtask = (taskId: string, subtaskId: string, updatedSubtask: Partial<Subtask>) => {
        setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        subtasks: task.subtasks.map(subtask =>
                            subtask.id === subtaskId
                                ? { ...subtask, ...updatedSubtask }
                                : subtask
                        ),
                    }
                    : task
            ),
        }));
    };

    const addSubtask = (taskId: string, newSubtask: Subtask) => {
        setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        subtasks: [...task.subtasks, newSubtask],
                    }
                    : task
            ),
        }));
    }

    return (
        <AppDataContext.Provider
            value={{
                data,
                setToken,
                setCourses,
                setTasks,
                updateTask,
                removeTask,
                addTask,
                updateData,
                removeSubtask,
                updateSubtask,
                addSubtask,
            }}
        >
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = (): AppDataContextType => {
    const context = useContext(AppDataContext);
    if (!context) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
};
