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
    subtasks: Subtask[];
    documents: Document[];
    approved_by_user: boolean;
}

export interface Document {
    id: string;
    title: string;
    content: string;
    last_updated: Date;
    due_date: Date;
    type: string;
}

export interface Course {
    id: string;
    name: string;
    tasks: Task[];
    documents: { [id: string]: Document };
}

export interface UserPreferences {
    taskViewPeriodDays: number; // How many days ahead to show tasks
    lastTaskGenerationDate?: Date; // Timestamp of last task generation
}

export interface AppData {
    token: string | null;
    courses: Course[];
    current_date: Date;
    preferences: UserPreferences;
}

export interface AppDataContextType {
    data: AppData;
    setToken: (token: string) => void;
    setCourses: (courses: Course[]) => void;
    updateTask: (courseId: string, taskId: string, updatedTask: Partial<Task>) => void;
    removeTask: (courseId: string, taskId: string) => void;
    addTask: (courseId: string, newTask: Task) => void;
    updateData: (newData: Partial<AppData>) => void;
    removeSubtask: (courseId: string, taskId: string, subtaskId: string) => void;
    updateSubtask: (courseId: string, taskId: string, subtaskId: string, updatedSubtask: Partial<Subtask>) => void;
    addSubtask: (courseId: string, taskId: string, newSubtask: Subtask) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const defaultData: AppData = {
    token: null,
    courses: [],
    current_date: new Date(),
    preferences: {
        taskViewPeriodDays: 28 // Default to 2 weeks
    }
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

    const setCourses = (courses: Course[]) => {
        setData((prev) => ({ ...prev, courses }));
    };

    const updateTask = (courseId: string, taskId: string, updatedTask: Partial<Task>) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((course) =>
                course.id === courseId
                    ? {
                          ...course,
                          tasks: course.tasks.map((task) =>
                              task.id === taskId
                                  ? { ...task, ...updatedTask, updated_at: new Date().toISOString() }
                                  : task
                          ),
                      }
                    : course
            ),
        }));
    };

    const removeTask = (courseId: string, taskId: string) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((course) =>
                course.id === courseId
                    ? {
                          ...course,
                          tasks: course.tasks.filter((task) => task.id !== taskId),
                      }
                    : course
            ),
        }));
    };

    const addTask = (courseId: string, newTask: Task) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((course) =>
                course.id === courseId
                    ? {
                          ...course,
                          tasks: [...course.tasks, newTask],
                      }
                    : course
            ),
        }));
    };

    const updateData = (newData: Partial<AppData>) => {
        setData((prev) => ({ ...prev, ...newData }));
    };

    const removeSubtask = (courseId: string, taskId: string, subtaskId: string) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((course) =>
                course.id === courseId
                    ? {
                          ...course,
                          tasks: course.tasks.map((task) =>
                              task.id === taskId
                                  ? {
                                        ...task,
                                        subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
                                    }
                                  : task
                          ),
                      }
                    : course
            ),
        }));
    };

    const updateSubtask = (courseId: string, taskId: string, subtaskId: string, updatedSubtask: Partial<Subtask>) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((course) =>
                course.id === courseId
                    ? {
                          ...course,
                          tasks: course.tasks.map((task) =>
                              task.id === taskId
                                  ? {
                                        ...task,
                                        subtasks: task.subtasks.map((subtask) =>
                                            subtask.id === subtaskId
                                                ? { ...subtask, ...updatedSubtask }
                                                : subtask
                                        ),
                                    }
                                  : task
                          ),
                      }
                    : course
            ),
        }));
    };

    const addSubtask = (courseId: string, taskId: string, newSubtask: Subtask) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((course) =>
                course.id === courseId
                    ? {
                          ...course,
                          tasks: course.tasks.map((task) =>
                              task.id === taskId
                                  ? {
                                        ...task,
                                        subtasks: [...task.subtasks, newSubtask],
                                    }
                                  : task
                          ),
                      }
                    : course
            ),
        }));
    };

    const updatePreferences = (preferences: Partial<UserPreferences>) => {
        setData((prev) => ({
            ...prev,
            preferences: { ...prev.preferences, ...preferences }
        }));
    };

    return (
        <AppDataContext.Provider
            value={{
                data,
                setToken,
                setCourses,
                updateTask,
                removeTask,
                addTask,
                updateData,
                removeSubtask,
                updateSubtask,
                addSubtask,
                updatePreferences,
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
