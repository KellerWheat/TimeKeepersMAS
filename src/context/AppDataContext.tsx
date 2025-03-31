import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Subtask {
    id: string;
    description: string;
    expected_time: number;
    current_percentage_completed: number;
    scheduled_time?: ScheduledTime; // Reference to when this subtask is scheduled
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

// The time slot when a subtask is scheduled
export interface ScheduledTime {
    id: string;
    day: string; // ISO date string for the day
    start_time: number; // Minutes from midnight
    end_time: number; // Minutes from midnight
    subtask_id: string;
    course_id: string;
    task_id: string;
    user_set: boolean; // Flag to indicate if this was manually set by the user
}

// Weekly schedule for user availability
export interface WeeklySchedule {
    // Key is day of week (0-6, 0 = Sunday)
    [dayOfWeek: number]: {
        // Array of available time blocks
        available_blocks: TimeBlock[];
    };
}

// Represents a block of time
export interface TimeBlock {
    id: string;
    start_time: number; // Minutes from midnight
    end_time: number; // Minutes from midnight
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
    calendarDayStartHour: number; // Hour to start calendar view (e.g., 8 for 8:00 AM)
    calendarDayEndHour: number; // Hour to end calendar view (e.g., 22 for 10:00 PM)
}

export interface AppData {
    token: string | null;
    courses: Course[];
    current_date: Date;
    preferences: UserPreferences;
    weeklySchedule: WeeklySchedule;
    scheduledTasks: ScheduledTime[]; // All scheduled subtasks
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
    updateWeeklySchedule: (schedule: Partial<WeeklySchedule>) => void;
    addScheduledTime: (scheduledTime: ScheduledTime) => void;
    removeScheduledTime: (id: string) => void;
    updateScheduledTime: (id: string, updates: Partial<ScheduledTime>) => void;
    approveAllTasks: () => void;
    areAllTasksApproved: () => boolean;
    autoScheduleTasks: (forceReschedule?: boolean) => void; // Function to automatically schedule tasks
    resetAppData: () => Promise<void>;
    isLoading: boolean;
    toggleTaskApproval: (courseId: string, taskId: string) => void; // Toggle a task's approval status
    manuallyScheduleTask: (subtaskId: string, courseId: string, taskId: string, day: string, startTime: number, endTime: number) => void; // Manually schedule a task
}

// Keys for AsyncStorage
const STORAGE_KEYS = {
    APP_DATA: 'app_data',
    CANVAS_TOKEN: 'canvas_access_token',
};

// Default weekly schedule with some reasonable availability
const defaultWeeklySchedule: WeeklySchedule = {
    0: { available_blocks: [{ id: '0-1', start_time: 820, end_time: 1320 }] }, // Sunday
    1: { available_blocks: [{ id: '1-1', start_time: 540, end_time: 720 }, { id: '1-2', start_time: 840, end_time: 1020 }] }, // Monday
    2: { available_blocks: [{ id: '2-1', start_time: 540, end_time: 720 }, { id: '2-2', start_time: 840, end_time: 1020 }] }, // Tuesday
    3: { available_blocks: [{ id: '3-1', start_time: 540, end_time: 720 }, { id: '3-2', start_time: 840, end_time: 1020 }] }, // Wednesday
    4: { available_blocks: [{ id: '4-1', start_time: 540, end_time: 720 }, { id: '4-2', start_time: 840, end_time: 1020 }] }, // Thursday
    5: { available_blocks: [{ id: '5-1', start_time: 540, end_time: 720 }, { id: '5-2', start_time: 840, end_time: 1020 }] }, // Friday
    6: { available_blocks: [{ id: '6-1', start_time: 820, end_time: 1320 }] }, // Saturday
};

const defaultData: AppData = {
    token: null,
    courses: [],
    current_date: new Date(),
    preferences: {
        taskViewPeriodDays: 28, // Default to 4 weeks
        calendarDayStartHour: 8, // Default to 8:00 AM
        calendarDayEndHour: 22, // Default to 10:00 PM
    },
    weeklySchedule: defaultWeeklySchedule,
    scheduledTasks: [],
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
                    
                    // Ensure all required fields exist
                    setData({
                        ...defaultData,
                        ...storedData,
                        preferences: {
                            ...defaultData.preferences,
                            ...storedData.preferences,
                        },
                        weeklySchedule: storedData.weeklySchedule || defaultWeeklySchedule,
                        scheduledTasks: storedData.scheduledTasks || [],
                    });
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
        // First remove any scheduled times associated with this task
        const newScheduledTasks = data.scheduledTasks.filter(
            st => !(st.course_id === courseId && st.task_id === taskId)
        );
        
        setData((prev) => ({
            ...prev,
            scheduledTasks: newScheduledTasks,
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
        // First remove any scheduled times associated with this subtask
        const newScheduledTasks = data.scheduledTasks.filter(
            st => !(st.subtask_id === subtaskId)
        );
        
        setData((prev) => ({
            ...prev,
            scheduledTasks: newScheduledTasks,
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

    const updateWeeklySchedule = (schedule: Partial<WeeklySchedule>) => {
        setData((prev) => {
            // Create a properly typed merged schedule
            const mergedSchedule: WeeklySchedule = { ...prev.weeklySchedule };
            
            // Process each day in the update
            Object.entries(schedule).forEach(([dayKey, dayValue]) => {
                const day = parseInt(dayKey);
                if (!isNaN(day) && dayValue) {
                    mergedSchedule[day] = dayValue;
                }
            });
            
            return {
                ...prev,
                weeklySchedule: mergedSchedule
            };
        });
    };

    const addScheduledTime = (scheduledTime: ScheduledTime) => {
        setData((prev) => ({
            ...prev,
            scheduledTasks: [...prev.scheduledTasks, scheduledTime]
        }));
    };

    const removeScheduledTime = (id: string) => {
        setData((prev) => ({
            ...prev,
            scheduledTasks: prev.scheduledTasks.filter(st => st.id !== id)
        }));
    };

    const updateScheduledTime = (id: string, updates: Partial<ScheduledTime>) => {
        setData((prev) => ({
            ...prev,
            scheduledTasks: prev.scheduledTasks.map(st => 
                st.id === id ? { ...st, ...updates } : st
            )
        }));
    };

    const approveAllTasks = () => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map(course => ({
                ...course,
                tasks: course.tasks.map(task => ({
                    ...task,
                    approved_by_user: true
                }))
            }))
        }));
    };

    // Toggle a task's approval status
    const toggleTaskApproval = (courseId: string, taskId: string) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map(course => 
                course.id === courseId 
                    ? {
                        ...course,
                        tasks: course.tasks.map(task => 
                            task.id === taskId 
                                ? { ...task, approved_by_user: !task.approved_by_user }
                                : task
                        )
                    }
                    : course
            )
        }));
    };

    const areAllTasksApproved = (): boolean => {
        return data.courses.every(course => 
            course.tasks.every(task => task.approved_by_user)
        );
    };

    // Automatically schedule tasks based on due dates, time requirements, and user availability
    const autoScheduleTasks = (forceReschedule = false) => {
        // Instead of clearing all schedules, we'll only remove schedules for tasks that need rescheduling
        const newScheduledTasks: ScheduledTime[] = [];
        
        // Keep track of which subtasks we've processed
        const processedSubtaskIds = new Set<string>();
        
        // First, preserve scheduled times that were manually set by the user or have progress
        const preservedSchedules = data.scheduledTasks.filter(scheduledTime => {
            const course = data.courses.find(c => c.id === scheduledTime.course_id);
            const task = course?.tasks.find(t => t.id === scheduledTime.task_id);
            const subtask = task?.subtasks.find(s => s.id === scheduledTime.subtask_id);
            
            // Get current date to check if the task is in the past
            const currentDate = new Date(data.current_date);
            const scheduledDate = new Date(scheduledTime.day);
            const isPastDate = scheduledDate < currentDate && scheduledDate.toDateString() !== currentDate.toDateString();
            
            // Don't preserve past tasks that aren't complete
            if (isPastDate && (!subtask || subtask.current_percentage_completed < 100)) {
                return false;
            }
            
            // Preserve if:
            // 1. subtask exists and was manually set by user (unless forceReschedule is true)
            // 2. OR subtask has progress but isn't complete
            if (subtask && 
                ((scheduledTime.user_set && !forceReschedule) || 
                 (subtask.current_percentage_completed > 0 && subtask.current_percentage_completed < 100))) {
                // Mark this subtask as processed
                processedSubtaskIds.add(subtask.id);
                return true;
            }
            return false;
        });
        
        // Add the preserved schedules to our new list
        newScheduledTasks.push(...preservedSchedules);
        
        // Get all subtasks from all tasks, sorted by task due date
        const allSubtasks: {
            subtask: Subtask;
            task: Task;
            courseId: string;
            dueDate: Date;
            taskIndex: number; // Store the original order of the tasks
        }[] = [];

        data.courses.forEach(course => {
            // First sort the tasks by due date to ensure ordering
            const sortedTasks = [...course.tasks]
                .filter(task => task.approved_by_user && task.due_date)
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
            
            sortedTasks.forEach((task, taskIndex) => {
                const dueDate = new Date(task.due_date);
                task.subtasks.forEach(subtask => {
                    // Skip subtasks we're already preserving schedules for
                    if (!processedSubtaskIds.has(subtask.id)) {
                        allSubtasks.push({
                            subtask,
                            task,
                            courseId: course.id,
                            dueDate,
                            taskIndex
                        });
                    }
                });
            });
        });

        // Sort subtasks by:
        // 1. First by due date (earliest first)
        // 2. Then by original task index to preserve task order
        allSubtasks.sort((a, b) => {
            const dateCompare = a.dueDate.getTime() - b.dueDate.getTime();
            if (dateCompare !== 0) return dateCompare;
            return a.taskIndex - b.taskIndex;
        });

        // Get the next 14 days based on current date
        const startDate = new Date(data.current_date);
        const days: string[] = [];
        
        for (let i = 0; i < 14; i++) {
            const day = new Date(startDate);
            day.setDate(day.getDate() + i);
            days.push(day.toISOString().split('T')[0]);
        }

        // Find available time slots for each day
        const availableSlots: {
            day: string;
            slots: { start: number; end: number }[];
        }[] = [];

        days.forEach(dayStr => {
            const date = new Date(dayStr);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            const daySchedule = data.weeklySchedule[dayOfWeek];
            if (daySchedule && daySchedule.available_blocks.length > 0) {
                availableSlots.push({
                    day: dayStr,
                    slots: daySchedule.available_blocks.map(block => ({
                        start: block.start_time,
                        end: block.end_time
                    }))
                });
            }
        });

        // Adjust available slots to account for preserved scheduled times
        preservedSchedules.forEach(schedule => {
            const daySlot = availableSlots.find(slot => slot.day === schedule.day);
            if (daySlot) {
                // Find the slot that contains this schedule
                for (let i = 0; i < daySlot.slots.length; i++) {
                    const slot = daySlot.slots[i];
                    
                    // If the scheduled time overlaps with this slot
                    if (schedule.start_time < slot.end && schedule.end_time > slot.start) {
                        // Split the slot if needed
                        if (schedule.start_time > slot.start && schedule.end_time < slot.end) {
                            // The schedule is in the middle of the slot, split into two
                            daySlot.slots.push({
                                start: schedule.end_time,
                                end: slot.end
                            });
                            slot.end = schedule.start_time;
                        } else if (schedule.start_time <= slot.start && schedule.end_time >= slot.end) {
                            // The schedule covers the entire slot
                            daySlot.slots.splice(i, 1);
                            i--;
                        } else if (schedule.start_time <= slot.start) {
                            // The schedule covers the beginning of the slot
                            slot.start = schedule.end_time;
                        } else if (schedule.end_time >= slot.end) {
                            // The schedule covers the end of the slot
                            slot.end = schedule.start_time;
                        }
                        
                        // Remove slot if it's now too small
                        if (slot.end - slot.start < 15) { // Minimum 15 minutes
                            daySlot.slots.splice(i, 1);
                            i--;
                        }
                    }
                }
            }
        });

        // Schedule each subtask
        allSubtasks.forEach(({ subtask, task, courseId, dueDate }) => {
            // Skip if already 100% complete
            if (subtask.current_percentage_completed >= 100) {
                return;
            }

            // Calculate how much time is still needed (in minutes)
            const timeNeededHours = subtask.expected_time * (1 - subtask.current_percentage_completed / 100);
            const timeNeededMinutes = Math.ceil(timeNeededHours * 60);
            const adjustedDueDate = new Date(dueDate);
            adjustedDueDate.setDate(adjustedDueDate.getDate() - 1);
            const dueDateOnly = adjustedDueDate.toISOString().split('T')[0];
            
            // Skip if no time needed
            if (timeNeededMinutes <= 0) {
                return;
            }

            // Try to find a slot
            // First look at days closer to the due date
            for (let i = availableSlots.length - 1; i >= 0; i--) {
                const daySlot = availableSlots[i];
                
                if (daySlot.day > dueDateOnly) {
                    continue;
                }
                
                // Try to find a slot in this day
                for (let j = 0; j < daySlot.slots.length; j++) {
                    const slot = daySlot.slots[j];
                    const slotDuration = slot.end - slot.start;
                    
                    // Skip if slot is too small
                    if (slotDuration < timeNeededMinutes) {
                        continue;
                    }
                    
                    // Found a slot! Create a scheduled time
                    const scheduledTime: ScheduledTime = {
                        id: `${subtask.id}-${daySlot.day}`,
                        day: daySlot.day,
                        start_time: slot.start,
                        end_time: slot.start + timeNeededMinutes,
                        subtask_id: subtask.id,
                        course_id: courseId,
                        task_id: task.id,
                        user_set: false // Set by the system, not the user
                    };
                    
                    newScheduledTasks.push(scheduledTime);
                    
                    // Update the slot
                    slot.start += timeNeededMinutes;
                    
                    // If slot is now too small, remove it
                    if (slot.end - slot.start < 15) { // Minimum 15 minutes
                        daySlot.slots.splice(j, 1);
                        j--;
                    }
                    
                    // We've scheduled this subtask, so break out of the inner loop
                    break;
                }
                
                // If we've scheduled this subtask, break out of the outer loop
                if (newScheduledTasks.some(st => st.subtask_id === subtask.id && !preservedSchedules.includes(st))) {
                    break;
                }
            }
            
            // If we couldn't schedule on preferred days, look at all days
            if (!newScheduledTasks.some(st => st.subtask_id === subtask.id && !preservedSchedules.includes(st))) {
                for (let i = 0; i < availableSlots.length; i++) {
                    const daySlot = availableSlots[i];
                    // Skip days that are after the due date
                    if (daySlot.day > dueDateOnly) {
                        continue;
                    }
                    // Try to find a slot in this day
                    for (let j = 0; j < daySlot.slots.length; j++) {
                        const slot = daySlot.slots[j];
                        const slotDuration = slot.end - slot.start;
                        
                        // Skip if slot is too small
                        if (slotDuration < timeNeededMinutes) {
                            continue;
                        }
                        
                        // Found a slot! Create a scheduled time
                        const scheduledTime: ScheduledTime = {
                            id: `${subtask.id}-${daySlot.day}`,
                            day: daySlot.day,
                            start_time: slot.start,
                            end_time: slot.start + timeNeededMinutes,
                            subtask_id: subtask.id,
                            course_id: courseId,
                            task_id: task.id,
                            user_set: false // Set by the system, not the user
                        };
                        
                        newScheduledTasks.push(scheduledTime);
                        
                        // Update the slot
                        slot.start += timeNeededMinutes;
                        
                        // If slot is now too small, remove it
                        if (slot.end - slot.start < 15) { // Minimum 15 minutes
                            daySlot.slots.splice(j, 1);
                            j--;
                        }
                        
                        // We've scheduled this subtask, so break out of the inner loop
                        break;
                    }
                    
                    // If we've scheduled this subtask, break out of the outer loop
                    if (newScheduledTasks.some(st => st.subtask_id === subtask.id && !preservedSchedules.includes(st))) {
                        break;
                    }
                }
            }
        });

        // Update the scheduled tasks
        setData((prev) => ({
            ...prev,
            scheduledTasks: newScheduledTasks
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

    const manuallyScheduleTask = (subtaskId: string, courseId: string, taskId: string, day: string, startTime: number, endTime: number) => {
        // First, remove any existing schedules for this subtask
        const newSchedules = data.scheduledTasks.filter(st => st.subtask_id !== subtaskId);
        
        // Create a new scheduled time with the user_set flag
        const newSchedule: ScheduledTime = {
            id: `${subtaskId}-${day}`,
            day,
            start_time: startTime,
            end_time: endTime,
            subtask_id: subtaskId,
            course_id: courseId,
            task_id: taskId,
            user_set: true // Mark as manually set by user
        };
        
        // Add the new schedule
        newSchedules.push(newSchedule);
        
        // Update the data
        setData(prev => ({
            ...prev,
            scheduledTasks: newSchedules
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
                updateWeeklySchedule,
                addScheduledTime,
                removeScheduledTime,
                updateScheduledTime,
                approveAllTasks,
                areAllTasksApproved,
                autoScheduleTasks,
                resetAppData,
                isLoading,
                toggleTaskApproval,
                manuallyScheduleTask,
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
