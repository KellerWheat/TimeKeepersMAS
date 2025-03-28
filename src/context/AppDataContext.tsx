import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    approved_by_user: boolean;
    documents: Document[];
}

export interface Document {
    id: string;
    title: string;
    content: string;
    summary?: string;
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
    resetAppData: () => Promise<void>;
    isLoading: boolean;
}

// Keys for AsyncStorage
const STORAGE_KEYS = {
    APP_DATA: 'app_data',
    CANVAS_TOKEN: 'canvas_access_token',
};

const defaultData: AppData = {
    token: null,
    courses: [],
    current_date: new Date(),
    preferences: {
        taskViewPeriodDays: 28, // Default to 2 weeks
    }
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProviderProps {
    children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
    const [data, setData] = useState<AppData>(defaultData);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Load stored data on app start
    useEffect(() => {
        const loadStoredData = async () => {
            try {
                setIsLoading(true);
                const storedDataJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_DATA);
                
                if (storedDataJson) {
                    const storedData = JSON.parse(storedDataJson);
                    
                    // Handle date conversion from string to Date objects
                    if (storedData.current_date) {
                        storedData.current_date = new Date(storedData.current_date);
                    }
                    if (storedData.preferences?.lastTaskGenerationDate) {
                        storedData.preferences.lastTaskGenerationDate = 
                            new Date(storedData.preferences.lastTaskGenerationDate);
                    }
                    
                    setData(storedData);
                } else {
                    // First app start, initialize with defaults
                    setData(defaultData);
                }
            } catch (error) {
                console.error('Error loading stored app data:', error);
                // Fallback to defaults on error
                setData(defaultData);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredData();
    }, []);

    // Save data to AsyncStorage whenever it changes
    useEffect(() => {
        const saveData = async () => {
            try {
                await AsyncStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(data));
            } catch (error) {
                console.error('Error saving app data:', error);
            }
        };

        if (!isLoading) {
            saveData();
        }
    }, [data, isLoading]);

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

    // Function to reset all app data
    const resetAppData = async () => {
        try {
            // Clear all stored data
            await AsyncStorage.removeItem(STORAGE_KEYS.APP_DATA);
            await AsyncStorage.removeItem(STORAGE_KEYS.CANVAS_TOKEN);
            
            // Reset state to defaults
            setData(defaultData);
            
            return Promise.resolve();
        } catch (error) {
            console.error('Error resetting app data:', error);
            return Promise.reject(error);
        }
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
                resetAppData,
                isLoading,
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
