// screens/TaskGenerationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { fetchEnrolledCourses, fetchCourseDocuments } from '@/src/api/canvasApi';
import { processDocumentForTasks } from '@/src/api/chatgptApi';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, Task, Document, Course } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';

interface DocumentProcessingStatus {
    totalDocuments: number;
    processedDocuments: number;
    message: string;
}

// Define a minimum time (in hours) between task generations
const MIN_HOURS_BETWEEN_GENERATIONS = 24;

const TaskGenerationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, setCourses, updateTask, addTask, updatePreferences } = useAppData();
    const token = data.token;
    const courses = data.courses;
    const preferences = data.preferences;
    const [loading, setLoading] = useState<boolean>(true);
    const [status, setStatus] = useState<DocumentProcessingStatus>({ 
        totalDocuments: 0, 
        processedDocuments: 0,
        message: 'Loading course data...'
    });

    useEffect(() => {
        if (!token) {
            console.error("Token is null. Aborting Task Generation.");
            navigation.navigate('Login');
            return;
        }

        const navigateToTaskReview = () => {
            console.log("All tasks generated successfully. Navigating to TaskReview screen.");
            setLoading(false);
            navigation.navigate('TaskReview');
        };

        const generateTasks = async () => {
            try {
                // Check if we've already generated tasks recently
                if (preferences.lastTaskGenerationDate) {
                    const lastGenTime = new Date(preferences.lastTaskGenerationDate).getTime();
                    const currentTime = new Date().getTime();
                    const hoursSinceLastGen = (currentTime - lastGenTime) / (1000 * 60 * 60);
                    
                    // If less than minimum hours have passed, skip generation
                    if (hoursSinceLastGen < MIN_HOURS_BETWEEN_GENERATIONS) {
                        console.log(`Skipping task generation: Last generated ${hoursSinceLastGen.toFixed(1)} hours ago`);
                        navigateToTaskReview();
                        return;
                    }
                }

                // Check if courses already have tasks, skip generation if they do
                if (courses.some(course => course.tasks && course.tasks.length > 0)) {
                    console.log("Tasks already exist. Skipping generation.");
                    navigateToTaskReview();
                    return;
                }

                // Step 1: Fetch courses if they don't exist
                setStatus({ ...status, message: 'Fetching courses...' });
                let currentCourses = [...courses];
                if (courses.length === 0) {
                    console.log("No courses found. Fetching courses...");
                    const fetchedCourses = await fetchEnrolledCourses(token);
                    currentCourses = fetchedCourses;
                    // Update courses in state right away so we can see them
                    setCourses(currentCourses);
                }

                if (currentCourses.length === 0) {
                    console.error("No courses available. Aborting task generation.");
                    setStatus({ ...status, message: 'No courses found. Please check your Canvas account.' });
                    setLoading(false);
                    return;
                }

                // Step 2: Prepare for document fetching and processing
                setStatus({ ...status, message: 'Fetching documents from courses...' });
                
                // Calculate total documents for progress tracking
                let totalDocuments = 0;
                let processedCount = 0;
                
                // Create a copy of courses to work with
                const updatedCourses = [...currentCourses];
                
                // Step 3: Process each course
                for (let i = 0; i < updatedCourses.length; i++) {
                    const course = updatedCourses[i];
                    console.log(`Processing course ${i+1}/${updatedCourses.length}: ${course.name}`);
                    setStatus({
                        totalDocuments,
                        processedDocuments: processedCount,
                        message: `Processing course: ${course.name}`
                    });
                    
                    // Step 4: Fetch documents for the course
                    const documents = await fetchCourseDocuments(token, course.id);
                    totalDocuments += documents.length;
                    setStatus({
                        totalDocuments,
                        processedDocuments: processedCount,
                        message: `Processing ${documents.length} documents for ${course.name}`
                    });
                    
                    // Create a map of document IDs to documents
                    const documentMap: { [id: string]: Document } = {};
                    const updatedTasks = [...course.tasks];
                    
                    // Step 5: Process each document
                    for (const document of documents) {
                        // Store document in the course's document collection
                        documentMap[document.id] = document;
                        
                        // Update status with current document
                        setStatus({
                            totalDocuments,
                            processedDocuments: processedCount,
                            message: `Processing document: ${document.title.substring(0, 30)}${document.title.length > 30 ? '...' : ''}`
                        });
                        
                        // Check if document is already associated with a task
                        const existingTaskIndex = updatedTasks.findIndex(task => 
                            task.documents.some(doc => doc.id === document.id)
                        );
                        
                        if (existingTaskIndex >= 0) {
                            // Document already assigned to a task, update the task
                            const task = updatedTasks[existingTaskIndex];
                            
                            // Process document for task updates via LLM
                            const taskUpdate = await processDocumentForTasks(document, task, updatedTasks);
                            
                            if (taskUpdate && taskUpdate.type === 'update') {
                                // Update the existing task
                                updatedTasks[existingTaskIndex] = {
                                    ...task,
                                    ...taskUpdate.updatedTask,
                                    approved_by_user: false,
                                    documents: [...task.documents, document] // Add document to task if not already there
                                };
                            }
                        } else {
                            // Document not yet assigned to any task, process via LLM
                            const taskResult = await processDocumentForTasks(document, null, updatedTasks);
                            
                            if (taskResult) {
                                if (taskResult.type === 'new') {
                                    // Create a new task
                                    const newTask: Task = {
                                        id: uuidv4(),
                                        type: taskResult.taskType || 'assignment',
                                        due_date: taskResult.dueDate || new Date().toISOString(),
                                        task_description: taskResult.description || document.title,
                                        subtasks: taskResult.subtasks || [],
                                        documents: [document],
                                        approved_by_user: false
                                    };
                                    
                                    // Add the new task to the updated tasks list
                                    updatedTasks.push(newTask);
                                } else if (taskResult.type === 'update' && taskResult.taskId) {
                                    // Update an existing task
                                    const taskIndex = updatedTasks.findIndex(t => t.id === taskResult.taskId);
                                    if (taskIndex >= 0) {
                                        const task = updatedTasks[taskIndex];
                                        updatedTasks[taskIndex] = {
                                            ...task,
                                            ...taskResult.updatedTask,
                                            approved_by_user: false,
                                            documents: [...task.documents, document]
                                        };
                                    }
                                }
                                // If taskResult.type === 'ignore', we do nothing
                            }
                        }
                        
                        // Update progress
                        processedCount++;
                        setStatus({
                            totalDocuments,
                            processedDocuments: processedCount,
                            message: `Processed ${processedCount}/${totalDocuments} documents`
                        });
                    }
                    
                    // Step 6: Update the course with the updated document map and tasks
                    updatedCourses[i] = {
                        ...course,
                        documents: documentMap,
                        tasks: updatedTasks
                    };
                }
                
                // Step 7: Update all courses at once in the global state
                console.log(`Finished processing all documents. Updating ${updatedCourses.length} courses in global state.`);
                setStatus({
                    totalDocuments,
                    processedDocuments: processedCount,
                    message: 'Finalizing task generation...'
                });
                
                // First update courses in the global state
                setCourses(updatedCourses);
                
                // Then update the last task generation date
                updatePreferences({ lastTaskGenerationDate: new Date() });
                
                // Finally, navigate to the task review screen
                setStatus({
                    totalDocuments,
                    processedDocuments: processedCount,
                    message: 'Task generation complete! Redirecting...'
                });
                
                // Add a small delay to ensure state updates are processed
                setTimeout(navigateToTaskReview, 500);
            } catch (error) {
                console.error('Error generating tasks:', error);
                setStatus({
                    ...status,
                    message: `Error generating tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                setLoading(false);
            }
        };
        
        generateTasks();
    }, [token, navigation, setCourses, updateTask, addTask, updatePreferences, preferences, courses]);

    if (loading) {
        return (
            <View style={sharedStyles.container}>
                <Text style={sharedStyles.screenTitle}>Generating Tasks</Text>
                <ActivityIndicator size="large" color="#2980b9" style={{ marginVertical: 20 }} />
                <Text style={sharedStyles.text}>
                    {status.message}
                </Text>
                {status.totalDocuments > 0 && (
                    <Text style={[sharedStyles.text, { marginTop: 10 }]}>
                        Progress: {status.processedDocuments}/{status.totalDocuments} documents
                    </Text>
                )}
            </View>
        );
    }

    return null;
};

export default TaskGenerationScreen;
