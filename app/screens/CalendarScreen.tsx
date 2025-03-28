import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, ScheduledTime, Subtask, Task } from '@/src/context/AppDataContext';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { StackNavigationProps } from '../navigation';
import { formatMinutes, getWeekDates } from '../../src/utils/timeUtils';

// Day Navigation Component
interface DayNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  hasEvents: (dateStr: string) => boolean;
}

const DayNavigation = React.memo(({ currentDate, onDateChange, hasEvents }: DayNavigationProps) => {
  // Format the current date for display
  const formattedDate = useMemo(() => {
    return currentDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  }, [currentDate]);
  
  // Check if current date has events
  const currentDateStr = useMemo(() => currentDate.toISOString().split('T')[0], [currentDate]);
  const currentHasEvents = useMemo(() => hasEvents(currentDateStr), [hasEvents, currentDateStr]);
  
  // Go to previous day
  const goPrevDay = useCallback(() => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  }, [currentDate, onDateChange]);
  
  // Go to next day
  const goNextDay = useCallback(() => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  }, [currentDate, onDateChange]);
  
  // Go to today
  const goToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);
  
  return (
    <View style={styles.dayNavigationContainer}>
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={goPrevDay}
      >
        <Text style={styles.navButtonText}>◀</Text>
      </TouchableOpacity>
      
      <View style={styles.currentDateContainer}>
        <TouchableOpacity onPress={goToday}>
          <Text style={styles.currentDateText}>{formattedDate}</Text>
        </TouchableOpacity>
        {currentHasEvents && <View style={styles.dateEventIndicator} />}
      </View>
      
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={goNextDay}
      >
        <Text style={styles.navButtonText}>▶</Text>
      </TouchableOpacity>
    </View>
  );
});

// Scheduled Subtask component to display on the daily view
interface ScheduledSubtaskProps {
    scheduledTime: ScheduledTime;
    subtask: Subtask;
    taskDescription: string;
    courseName: string;
    onPress: () => void;
    courseColor: string;
}

const ScheduledSubtask = React.memo(({ 
    scheduledTime, 
    subtask, 
    taskDescription,
    courseName,
    onPress,
    courseColor
}: ScheduledSubtaskProps) => {
    const startTime = formatMinutes(scheduledTime.start_time);
    const endTime = formatMinutes(scheduledTime.end_time);
    
    // Calculate height based on duration (1 hour = 60px height)
    const durationMinutes = scheduledTime.end_time - scheduledTime.start_time;
    const heightPx = Math.max(durationMinutes / 60 * 60, 40); // Minimum height of 40px
    
    // Calculate top position based on start time from day start
    // Start time is in minutes from midnight, convert to pixels
    // Assuming day starts at calendarDayStartHour
    const { data } = useAppData();
    const dayStartMinutes = data.preferences.calendarDayStartHour * 60;
    const topPosition = (scheduledTime.start_time - dayStartMinutes) / 60 * 60;
    
    return (
        <TouchableOpacity 
            style={[
                styles.scheduledSubtask, 
                { 
                    height: heightPx, 
                    top: topPosition,
                    backgroundColor: courseColor || '#90caf9',
                    borderLeftWidth: scheduledTime.user_set ? 4 : 0,
                    borderLeftColor: '#ff9800',
                    marginBottom: 6 // Add margin to create more space between tasks
                }
            ]}
            onPress={onPress}
        >
            {/* Remove time display to save space */}
            <Text style={styles.subtaskDescription} numberOfLines={1}>{subtask.description}</Text>
            <Text style={styles.taskDescription} numberOfLines={1}>{taskDescription}</Text>
            <View style={styles.progressContainer}>
                <View 
                    style={[
                        styles.progressBar, 
                        { width: `${subtask.current_percentage_completed}%` }
                    ]}
                />
            </View>
            {scheduledTime.user_set && (
                <View style={styles.userSetBadge}>
                    <Text style={styles.userSetText}>✓</Text>
                </View>
            )}
        </TouchableOpacity>
    );
});

// Task Detail Modal
interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    scheduledTime?: ScheduledTime;
    subtask?: Subtask;
    taskDescription?: string;
    courseName?: string;
    courseId?: string;
    taskId?: string;
    updateProgress: (subtaskId: string, courseId: string, taskId: string, progress: number) => void;
    reschedule: () => void;
    manuallyReschedule: (startTime: number, endTime: number) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    visible,
    onClose,
    scheduledTime,
    subtask,
    taskDescription,
    courseName,
    courseId,
    taskId,
    updateProgress,
    reschedule,
    manuallyReschedule
}) => {
    const [progress, setProgress] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editStartTime, setEditStartTime] = useState(0);
    const [editEndTime, setEditEndTime] = useState(0);
    const { data } = useAppData();
    const dayStartHour = data.preferences.calendarDayStartHour;
    const dayEndHour = data.preferences.calendarDayEndHour;
    
    useEffect(() => {
        if (subtask) {
            setProgress(subtask.current_percentage_completed || 0);
        }
        if (scheduledTime) {
            setEditStartTime(scheduledTime.start_time);
            setEditEndTime(scheduledTime.end_time);
        }
    }, [subtask, scheduledTime]);
    
    if (!scheduledTime || !subtask || !courseId || !taskId) return null;
    
    const handleSave = () => {
        updateProgress(
            subtask.id, 
            courseId, 
            taskId, 
            progress
        );
        onClose();
    };
    
    const handleManualReschedule = () => {
        manuallyReschedule(editStartTime, editEndTime);
        setIsEditing(false);
        onClose();
    };
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={sharedStyles.modalOverlay}>
                <View style={[sharedStyles.modalContent, styles.modalContent]}>
                    <Text style={styles.modalTitle}>{subtask.description}</Text>
                    <Text style={styles.modalTaskName}>{taskDescription}</Text>
                    <Text style={styles.modalCourseName}>{courseName}</Text>
                    
                    <View style={styles.modalTimeInfo}>
                        <Text style={styles.modalScheduledDay}>
                            {new Date(scheduledTime.day).toLocaleDateString(undefined, { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </Text>
                        {isEditing ? (
                            <View style={styles.timeEditContainer}>
                                <View style={styles.timeEditRow}>
                                    <Text style={styles.timeEditLabel}>Start:</Text>
                                    <Text style={styles.timeEditValue}>{formatMinutes(editStartTime)}</Text>
                                    <View style={styles.timeButtons}>
                                        <TouchableOpacity 
                                            style={styles.timeButton} 
                                            onPress={() => setEditStartTime(Math.max(dayStartHour * 60, editStartTime - 15))}
                                        >
                                            <Text style={styles.timeButtonText}>-15m</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.timeButton} 
                                            onPress={() => setEditStartTime(Math.min(editEndTime - 15, editStartTime + 15))}
                                        >
                                            <Text style={styles.timeButtonText}>+15m</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.timeEditRow}>
                                    <Text style={styles.timeEditLabel}>End:</Text>
                                    <Text style={styles.timeEditValue}>{formatMinutes(editEndTime)}</Text>
                                    <View style={styles.timeButtons}>
                                        <TouchableOpacity 
                                            style={styles.timeButton} 
                                            onPress={() => setEditEndTime(Math.max(editStartTime + 15, editEndTime - 15))}
                                        >
                                            <Text style={styles.timeButtonText}>-15m</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.timeButton} 
                                            onPress={() => setEditEndTime(Math.min(dayEndHour * 60, editEndTime + 15))}
                                        >
                                            <Text style={styles.timeButtonText}>+15m</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.modalScheduledTime}>
                                {formatMinutes(scheduledTime.start_time)} - {formatMinutes(scheduledTime.end_time)}
                                {scheduledTime.user_set && 
                                    <Text style={styles.userSetModalLabel}> (Manually Set)</Text>
                                }
                            </Text>
                        )}
                    </View>
                    
                    <Text style={styles.progressLabel}>
                        Update Progress: {progress.toFixed(0)}%
                    </Text>
                    <Slider
                        style={styles.progressSlider}
                        minimumValue={0}
                        maximumValue={100}
                        step={5}
                        value={progress}
                        onValueChange={setProgress}
                        minimumTrackTintColor="#2980b9"
                        maximumTrackTintColor="#d3d3d3"
                    />
                    
                    <View style={styles.modalButtonRow}>
                        {isEditing ? (
                            <>
                                <TouchableOpacity 
                                    style={[sharedStyles.button, styles.cancelButton]} 
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={sharedStyles.buttonText}>Cancel Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={sharedStyles.button} 
                                    onPress={handleManualReschedule}
                                >
                                    <Text style={sharedStyles.buttonText}>Save Time</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity 
                                    style={sharedStyles.button} 
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Text style={sharedStyles.buttonText}>Edit Time</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={sharedStyles.button} 
                                    onPress={reschedule}
                                >
                                    <Text style={sharedStyles.buttonText}>Auto-Reschedule</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                    
                    {!isEditing && (
                        <TouchableOpacity 
                            style={sharedStyles.button} 
                            onPress={handleSave}
                        >
                            <Text style={sharedStyles.buttonText}>Save Progress</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

type CalendarScreenProps = {
    navigation: StackNavigationProps<'Calendar'>;
};

const CalendarScreen = ({ navigation }: CalendarScreenProps) => {
    const { data, updateSubtask, autoScheduleTasks, manuallyScheduleTask } = useAppData();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(data.current_date));
    const [selectedDateStr, setSelectedDateStr] = useState<string>(selectedDate.toISOString().split('T')[0]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedScheduledTime, setSelectedScheduledTime] = useState<ScheduledTime | undefined>(undefined);
    const [selectedSubtask, setSelectedSubtask] = useState<Subtask | undefined>(undefined);
    const [selectedTaskDescription, setSelectedTaskDescription] = useState('');
    const [selectedCourseName, setSelectedCourseName] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Store a reference to the date when the calendar was generated
    const lastRefreshRef = useRef(data.current_date.toISOString());
    const hasRunInitialSchedule = useRef(false);
    
    // Create a day timeline view
    const dayStartHour = data.preferences.calendarDayStartHour;
    const dayEndHour = data.preferences.calendarDayEndHour;
    
    // Check if a date has events - memoized to prevent recalculation
    const checkDateHasEvents = useCallback((dateStr: string): boolean => {
        return data.scheduledTasks.some(task => task.day === dateStr);
    }, [data.scheduledTasks]);
    
    // Update selectedDateStr when selectedDate changes
    useEffect(() => {
        setSelectedDateStr(selectedDate.toISOString().split('T')[0]);
    }, [selectedDate]);
    
    // Initialize calendar once on first render
    useEffect(() => {
        // Run auto-schedule ONLY if we haven't yet AND there are no scheduled tasks
        // This ensures we only auto-schedule once on app startup
        if (!hasRunInitialSchedule.current && data.scheduledTasks.length === 0) {
            console.log('Running initial schedule generation');
            setIsLoading(true);
            // Delay to allow loading state to render
            const timerId = setTimeout(() => {
                autoScheduleTasks(false);
                setIsLoading(false);
                setIsInitialized(true);
                lastRefreshRef.current = data.current_date.toISOString();
                hasRunInitialSchedule.current = true;
            }, 300);
            
            return () => clearTimeout(timerId);
        } else {
            // Just mark as initialized without scheduling
            setIsInitialized(true);
            // Ensure we won't try to schedule again
            hasRunInitialSchedule.current = true;
        }
        // Only run this effect once on component mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Map to get subtasks and task info for each scheduled time - heavily memoized
    const scheduledItemsInfo = useMemo(() => {
        return data.scheduledTasks
            .filter(item => item.day === selectedDateStr)
            .map(scheduledTime => {
                // Find the corresponding course, task, and subtask
                const course = data.courses.find(c => c.id === scheduledTime.course_id);
                const task = course?.tasks.find(t => t.id === scheduledTime.task_id);
                const subtask = task?.subtasks.find(s => s.id === scheduledTime.subtask_id);
                
                // Get a color based on course index if no color property exists
                const courseColor = '#90caf9'; // Default blue color
                
                return {
                    scheduledTime,
                    subtask,
                    taskDescription: task?.task_description || 'Unknown Task',
                    courseName: course?.name || 'Unknown Course',
                    courseColor,
                    courseId: course?.id,
                    taskId: task?.id
                };
            })
            .filter(item => item.subtask); // Only include items where subtask was found
    }, [data.scheduledTasks, data.courses, selectedDateStr]);
    
    // Create a day timeline view
    const hourHeight = 70; // Increase from 60px to 70px per hour to have more space
    const totalHours = dayEndHour - dayStartHour;
    const timelineHeight = totalHours * hourHeight;
    
    // Generate hour markers for the timeline
    const hourMarkers = useMemo(() => {
        const markers = [];
        for (let hour = dayStartHour; hour <= dayEndHour; hour++) {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
            markers.push(
                <View key={hour} style={[styles.hourMarker, { top: (hour - dayStartHour) * hourHeight }]}>
                    <Text style={styles.hourText}>{displayHour} {ampm}</Text>
                    <View style={styles.hourLine} />
                </View>
            );
        }
        return markers;
    }, [dayStartHour, dayEndHour, hourHeight]);
    
    // Callback handlers - memoized to prevent rerenders
    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);
    
    const navigateToTaskReview = useCallback(() => {
        navigation.navigate('TaskReview');
    }, [navigation]);
    
    const navigateToSchedule = useCallback(() => {
        navigation.navigate('Schedule');
    }, [navigation]);
    
    const handleSubtaskPress = useCallback((
        scheduledTime: ScheduledTime, 
        subtask: Subtask, 
        taskDescription: string, 
        courseName: string, 
        courseId: string, 
        taskId: string
    ) => {
        setSelectedScheduledTime(scheduledTime);
        setSelectedSubtask(subtask);
        setSelectedTaskDescription(taskDescription);
        setSelectedCourseName(courseName);
        setSelectedCourseId(courseId);
        setSelectedTaskId(taskId);
        setShowTaskModal(true);
    }, []);
    
    // Handle manual reschedule button
    const handleManualAutoSchedule = useCallback(() => {
        setIsLoading(true);
        // Delay to allow loading state to render
        const timerId = setTimeout(() => {
            autoScheduleTasks(true); // Force reschedule all tasks
            setIsLoading(false);
        }, 300);
        
        return () => clearTimeout(timerId);
    }, [autoScheduleTasks]);
    
    // Handle task completion and possible reschedule
    const handleProgressUpdate = useCallback((
        subtaskId: string, 
        courseId: string, 
        taskId: string, 
        progress: number
    ) => {
        updateSubtask(courseId, taskId, subtaskId, { current_percentage_completed: progress });
        
        // Only reschedule if we mark a task as complete (100%)
        if (progress >= 100) {
            setIsLoading(true);
            const timerId = setTimeout(() => {
                autoScheduleTasks(false); // Only reschedule pending tasks
                setIsLoading(false);
            }, 300);
            
            return () => clearTimeout(timerId);
        }
    }, [updateSubtask, autoScheduleTasks]);
    
    const handleReschedule = useCallback(() => {
        // Run auto scheduler with force flag and close modal
        if (selectedSubtask) {
            setIsLoading(true);
            setShowTaskModal(false);
            
            const timerId = setTimeout(() => {
                autoScheduleTasks(true); // Force reschedule
                setIsLoading(false);
            }, 300);
            
            return () => clearTimeout(timerId);
        }
    }, [selectedSubtask, autoScheduleTasks]);
    
    const handleManualReschedule = useCallback((startTime: number, endTime: number) => {
        if (selectedSubtask && selectedCourseId && selectedTaskId && selectedScheduledTime) {
            manuallyScheduleTask(
                selectedSubtask.id,
                selectedCourseId,
                selectedTaskId,
                selectedScheduledTime.day,
                startTime,
                endTime
            );
        }
    }, [selectedSubtask, selectedCourseId, selectedTaskId, selectedScheduledTime, manuallyScheduleTask]);
    
    // Memoize the scheduled items to prevent unnecessary re-renders
    const scheduledItems = useMemo(() => {
        return scheduledItemsInfo.map((item, index) => (
            <ScheduledSubtask
                key={`${item.scheduledTime.id}-${index}`}
                scheduledTime={item.scheduledTime}
                subtask={item.subtask!}
                taskDescription={item.taskDescription}
                courseName={item.courseName}
                courseColor={item.courseColor}
                onPress={() => handleSubtaskPress(
                    item.scheduledTime,
                    item.subtask!,
                    item.taskDescription,
                    item.courseName,
                    item.courseId!,
                    item.taskId!
                )}
            />
        ));
    }, [scheduledItemsInfo, handleSubtaskPress]);
    
    // Close the task modal callback
    const handleCloseTaskModal = useCallback(() => {
        setShowTaskModal(false);
    }, []);
    
    return (
        <View style={sharedStyles.container}>
            {/* Day Navigation */}
            <DayNavigation 
                currentDate={selectedDate}
                onDateChange={handleDateChange}
                hasEvents={checkDateHasEvents}
            />
            
            <View style={styles.dayTimelineContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2980b9" />
                        <Text style={styles.loadingText}>Updating Schedule...</Text>
                    </View>
                ) : (
                    <ScrollView style={{ flex: 1 }} removeClippedSubviews={true}>
                        <View style={[styles.timeline, { height: timelineHeight }]}>
                            {hourMarkers}
                            
                            {/* Render scheduled items */}
                            {scheduledItems}
                        </View>
                    </ScrollView>
                )}
                
                {!isLoading && scheduledItemsInfo.length === 0 && (
                    <View style={styles.noTasksContainer}>
                        <Text style={styles.noTasksText}>No tasks scheduled for this day</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.footerButtons}>
                <TouchableOpacity 
                    style={styles.iconButton} 
                    onPress={navigateToTaskReview}
                >
                    <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.iconButton} 
                    onPress={navigateToSchedule}
                >
                    <Text style={styles.iconText}>⏰</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.iconButton} 
                    onPress={handleManualAutoSchedule}
                    disabled={isLoading}
                >
                    <Text style={styles.iconText}>{isLoading ? '⏳' : '🔄'}</Text>
                </TouchableOpacity>
            </View>
            
            <TaskDetailModal
                visible={showTaskModal}
                onClose={handleCloseTaskModal}
                scheduledTime={selectedScheduledTime}
                subtask={selectedSubtask}
                taskDescription={selectedTaskDescription}
                courseName={selectedCourseName}
                courseId={selectedCourseId}
                taskId={selectedTaskId}
                updateProgress={handleProgressUpdate}
                reschedule={handleReschedule}
                manuallyReschedule={handleManualReschedule}
            />
        </View>
    );
};

export default CalendarScreen;

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingTop: 10 
    },
    title: { 
        fontSize: 24, 
        textAlign: 'center', 
        marginBottom: 20 
    },
    dayNavigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 6,
        marginBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    navButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonText: {
        color: '#2980b9',
        fontWeight: '600',
        fontSize: 16,
    },
    currentDateContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentDateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    dateEventIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2980b9',
        marginLeft: 6,
    },
    dayTimelineContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 5,
    },
    timeline: {
        position: 'relative',
    },
    hourMarker: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 70,
    },
    hourText: {
        position: 'absolute',
        left: 5,
        top: -10,
        fontSize: 12,
        color: '#666',
    },
    hourLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#eee',
    },
    scheduledSubtask: {
        position: 'absolute',
        left: 50,
        right: 10,
        backgroundColor: '#90caf9',
        borderRadius: 5,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
        marginTop: 3,
        marginBottom: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
    },
    userSetBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#ff9800',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userSetText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    subtaskDescription: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#000'
    },
    taskDescription: {
        fontSize: 11,
        color: '#333',
    },
    courseName: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginTop: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#4caf50',
        borderRadius: 2,
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    iconButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2980b9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    iconText: {
        fontSize: 20,
    },
    noTasksContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noTasksText: {
        color: '#666',
        fontSize: 16,
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    
    // Modal styles
    modalContent: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalTaskName: {
        fontSize: 16,
        marginBottom: 4,
    },
    modalCourseName: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#666',
        marginBottom: 16,
    },
    modalTimeInfo: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    modalScheduledDay: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalScheduledTime: {
        fontSize: 14,
        color: '#666',
    },
    userSetModalLabel: {
        fontStyle: 'italic',
        color: '#ff9800',
    },
    progressLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    progressSlider: {
        width: '100%',
        height: 40,
        marginBottom: 16,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    cancelButton: {
        backgroundColor: '#95a5a6',
    },
    closeButton: {
        padding: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#666',
    },
    timeEditContainer: {
        marginTop: 10,
    },
    timeEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeEditLabel: {
        width: 50,
        fontSize: 14,
        fontWeight: 'bold',
    },
    timeEditValue: {
        fontSize: 14,
        marginRight: 10,
        width: 80,
    },
    timeButtons: {
        flexDirection: 'row',
    },
    timeButton: {
        backgroundColor: '#ddd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    timeButtonText: {
        fontSize: 12,
    },
});
