// screens/TaskGenerationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { fetchEnrolledCourses, fetchCourseDocuments } from '@/src/api/canvasApi';
import { generateDocumentSummary, batchGenerateTasks, processJsonTaskResponse } from '@/src/api/llmApi';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, Document, Course } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';

// Debug mode for testing with sample JSON
const DEBUG_MODE = false;

// Sample JSON response for testing - this is the response from the LLM that wasn't parsing correctly
const SAMPLE_JSON_RESPONSE = `{
  "results": [
    {
      "courseId": "451354",
      "tasks": [
        {
          "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          "type": "assignment",
          "due_date": "2025-01-15T14:30:00.000Z",
          "task_description": "Discussion Post 1",
          "subtasks": [
            {
              "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
              "description": "Write two discussion questions based on the readings, with enough detail for the audience to understand and follow the questions. The questions should be rooted in evidence from the readings.",
              "expected_time": 2,
              "current_percentage_completed": 0
            },
            {
              "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
              "description": "Submit the discussion questions before class on Wednesday, January 15th.",
              "expected_time": 1,
              "current_percentage_completed": 0
            }
          ],
          "documents": ["1993588"],
          "approved_by_user": false
        },
        {
          "id": "f47ac10b-58cc-4372-a567-0e02b2c3d480",
          "type": "assignment",
          "due_date": "2025-01-22T14:30:00.000Z",
          "task_description": "Discussion Post 2",
          "subtasks": [
            {
              "id": "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
              "description": "Write a discussion question for the reading \\"Cruel Pies\\" that is rooted in evidence from the text.",
              "expected_time": 1,
              "current_percentage_completed": 0
            },
            {
              "id": "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
              "description": "Briefly explain ideas for visually representing the data in Du Bois' article and the USDA Census data.",
              "expected_time": 1,
              "current_percentage_completed": 0
            },
            {
              "id": "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
              "description": "Submit the assignment before class on Wednesday, January 22nd.",
              "expected_time": 1,
              "current_percentage_completed": 0
            }
          ],
          "documents": ["2002276"],
          "approved_by_user": false
        }
      ]
    }
  ]
}`;

interface DocumentProcessingStatus {
    totalDocuments: number;
    processedDocuments: number;
    message: string;
}

// Define a minimum time (in hours) between task generations
const MIN_HOURS_BETWEEN_GENERATIONS = 24;

const TaskGenerationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, setCourses, updatePreferences } = useAppData();
    const token = data.token;
    const courses = data.courses;
    const preferences = data.preferences;
    const metrics = data.metrics;
    const [loading, setLoading] = useState<boolean>(true);
    const [status, setStatus] = useState<DocumentProcessingStatus>({ 
        totalDocuments: 0, 
        processedDocuments: 0,
        message: 'Loading course data...'
    });
    // Add a flag to track if we've already handled navigation for this screen mount
    const [hasHandledNavigation, setHasHandledNavigation] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            if (hasHandledNavigation) return;

            if (!token) {
                console.error("Token is null. Aborting Task Generation.");
                navigation.navigate('Login');
                setHasHandledNavigation(true);
                return;
            }

            try {
                // Check if we've generated tasks recently
                if (preferences.lastTaskGenerationDate) {
                    const lastGenTime = new Date(preferences.lastTaskGenerationDate).getTime();
                    const currentTime = new Date().getTime();
                    const hoursSinceLastGen = (currentTime - lastGenTime) / (1000 * 60 * 60);
                    if (hoursSinceLastGen < MIN_HOURS_BETWEEN_GENERATIONS) {
                        console.log(`Skipping task generation: Last generated ${hoursSinceLastGen.toFixed(1)} hours ago`);
                        navigation.navigate('TaskReview');
                        setHasHandledNavigation(true);
                        return;
                    }
                }

                // Skip generation if courses already have tasks
                if (courses.some(course => course.tasks && course.tasks.length > 0)) {
                    console.log("Tasks already exist. Skipping generation.");
                    navigation.navigate('TaskReview');
                    setHasHandledNavigation(true);
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
                    setHasHandledNavigation(true);
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
                    try {
                        console.log(`Processing course ${i+1}/${updatedCourses.length}: ${course.name}`);
                        setStatus({
                            totalDocuments,
                            processedDocuments: processedCount,
                            message: `Processing course: ${course.name}`
                        });

                        // Step 4: Fetch documents for the course
                        const documents = await fetchCourseDocuments(token, course.id, metrics.generationType === 'A');
                        
                        totalDocuments += documents.length;
                        setStatus({
                            totalDocuments,
                            processedDocuments: processedCount,
                            message: `Processing ${documents.length} documents for ${course.name}`
                        });

                        // Create a map of document IDs to documents
                        const documentMap: { [id: string]: Document } = {};

                        // Step 5: Process each document to generate summaries
                        for (const document of documents) {
                            // Skip documents with due dates in the past
                            const currentDate = new Date();
                            if (document.due_date && document.due_date < currentDate) {
                                console.log(`Skipping ${document.type} "${document.title}" because due date is in the past (${document.due_date.toLocaleDateString()})`);
                                continue;
                            }

                            // Update status with current document
                        setStatus({
                            totalDocuments,
                            processedDocuments: processedCount,
                                message: `Generating summary for: ${document.title.substring(0, 30)}${document.title.length > 30 ? '...' : ''}`
                            });

                            // Print document details for debugging
                            console.log(`\n=== DOCUMENT DETAILS: "${document.title}" ===`);
                            console.log(`Type: ${document.type}`);
                            console.log(`Due Date: ${document.due_date.toISOString()}`);
                            console.log(`Content (first 300 chars): ${document.content.substring(0, 300).replace(/\n/g, ' ')}${document.content.length > 300 ? '...' : ''}`);

                            // Check if document already exists in our data with a summary
                            const existingDocument = course.documents[document.id];
                            if (existingDocument && existingDocument.summary) {
                            // Use existing document with its summary
                                documentMap[document.id] = existingDocument;
                                console.log(`Using existing summary: ${existingDocument.summary}`);
                            } else {
                            // Generate a summary for the document
                                const summary = await generateDocumentSummary(document);

                            // Store document with its generated summary
                                documentMap[document.id] = {
                                    ...document,
                                    summary
                                };

                            // Log the generated summary
                                console.log(`Generated summary: ${summary}`);
                            }
                            console.log(`=== END DOCUMENT DETAILS ===\n`);

                            // Update progress
                            processedCount++;
                            setStatus({
                                totalDocuments,
                                processedDocuments: processedCount,
                                message: `Processed ${processedCount}/${totalDocuments} documents`
                            });
                        }

                        // Update the course with documents and their summaries
                        updatedCourses[i] = {
                            ...course,
                            documents: documentMap
                        };

                    } catch (error) {
                        console.error(`Error processing course "${course.name}"`, error);
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                    
                }

                // Step 6: Batch generate tasks with LLM using document summaries
                setStatus({
                    totalDocuments,
                    processedDocuments: processedCount,
                    message: 'Generating tasks based on document summaries...'
                });
                
                let courseTasksMap;

                if (DEBUG_MODE) {
                // Use sample JSON in debug mode
                    console.log("DEBUG MODE: Using sample JSON response");
                    courseTasksMap = processJsonTaskResponse(SAMPLE_JSON_RESPONSE, updatedCourses);
                } else {
                // Call the real API
                    courseTasksMap = await batchGenerateTasks(updatedCourses);
                }

                // Step 7: Update the courses with the generated tasks
                const finalCourses = updatedCourses.map(course => ({
                    ...course,
                    tasks: courseTasksMap[course.id] || []
                }));

                // Log the tasks for debugging
                console.log("=== TASK GENERATION RESULTS ===");
                console.log(`Generated tasks for ${Object.keys(courseTasksMap).length} courses`);
                Object.entries(courseTasksMap).forEach(([courseId, tasks]) => {
                    const course = updatedCourses.find(c => c.id === courseId);
                    console.log(`\nCourse: ${course?.name || 'Unknown'} (${courseId})`);
                    console.log(`Number of tasks: ${tasks.length}`);

                    tasks.forEach((task, index) => {
                        console.log(`\n  Task ${index + 1}: ${task.task_description}`);
                        console.log(`    Type: ${task.type}`);
                        console.log(`    Due date: ${task.due_date}`);
                        console.log(`    Subtasks: ${task.subtasks.length}`);
                        console.log(`    Documents: ${task.documents.length}`);

                        // Log subtasks
                        task.subtasks.forEach((subtask, sIndex) => {
                            console.log(`      Subtask ${sIndex + 1}: ${subtask.description.substring(0, 50)}${subtask.description.length > 50 ? '...' : ''}`);
                        });

                        // Log document IDs
                        if (task.documents.length > 0) {
                            console.log(`      Document IDs: ${task.documents.map(doc => doc.id).join(', ')}`);
                        }
                    });
                });
                console.log("=== END TASK GENERATION RESULTS ===");

                // Step 8: Update all courses at once in the global state
                console.log(`Finished processing. Updating ${finalCourses.length} courses in global state.`);
                setStatus({
                    totalDocuments,
                    processedDocuments: processedCount,
                    message: 'Finalizing task generation...'
                });
                
                // Update courses in the global state and wait for Firestore sync
                await setCourses(finalCourses);

                // Update the last task generation date
                updatePreferences({ lastTaskGenerationDate: new Date() });
                
                // Add a delay to ensure state updates are processed
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Verify the data was saved
                const savedCourses = data.courses;
                if (savedCourses.length === 0) {
                    console.error("Courses were not saved properly");
                    setStatus({
                        ...status,
                        message: 'Error saving tasks. Please try again.'
                    });
                    setLoading(false);
                    return;
                }

                // Navigate to the task review screen
                setStatus({
                    totalDocuments,
                    processedDocuments: processedCount,
                    message: 'Task generation complete! Redirecting...'
                });
                
                navigation.navigate('TaskReview');
                setHasHandledNavigation(true);
            } catch (error) {
                console.error('Error generating tasks:', error);
                setStatus({
                    ...status,
                    message: `Error generating tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                setLoading(false);
                setHasHandledNavigation(true);
            }
        })();
    }, [
        token,
        navigation,
        setCourses,
        updatePreferences,
        preferences.lastTaskGenerationDate,
        courses,
        hasHandledNavigation,
        metrics.generationType
    ]);

    if (loading) {
        return (
            <View style={sharedStyles.container}>
                <Text style={sharedStyles.screenTitle}>Generating Tasks</Text>
                <ActivityIndicator size="large" color="#2980b9" style={{ marginVertical: 20 }} />
                <Text style={sharedStyles.text}>{status.message}</Text>
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