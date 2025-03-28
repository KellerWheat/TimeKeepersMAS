import { Document, Task, Subtask, Course } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';

// Dedicated proxy server URL
const PROXY_SERVER_URL = 'https://proxyserver-o32a.onrender.com/api/claude';

// Type definitions for task processing results
export interface NewTaskResult {
    type: 'new';
    taskType: 'test' | 'assignment';
    description: string;
    dueDate: string;
    subtasks: Subtask[];
}

export interface UpdateTaskResult {
    type: 'update';
    taskId?: string;
    updatedTask: Partial<Task>;
}

export interface IgnoreDocumentResult {
    type: 'ignore';
    reason: string;
}

export type ProcessDocumentResult = NewTaskResult | UpdateTaskResult | IgnoreDocumentResult | null;

/**
 * Makes a request to the Claude API through our dedicated proxy server
 * 
 * @param prompt The prompt to send to Claude
 * @param maxTokens The maximum number of tokens in the response
 * @returns The response from Claude
 */
export const callClaudeAPI = async (prompt: string, maxTokens: number = 1000): Promise<string> => {
    console.log("Calling Claude API through dedicated proxy server");
    
    try {
        // Call the proxy server which handles the Claude API request
        const response = await fetch(PROXY_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",  // Using a smaller model for faster responses
                max_tokens: maxTokens,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });
        
        if (response.ok) {
            console.log("Proxy server request succeeded!");
            const data = await response.json();
            return data.content[0].text;
        } else {
            const errorText = await response.text();
            console.warn(`Proxy server request failed with status ${response.status}: ${errorText}`);
            
            // If proxy request fails, fall back to a predefined response for development
            console.warn("Using fallback response for development");
            return generateFallbackResponse(prompt);
        }
    } catch (error) {
        console.error('Error calling Claude API through proxy server:', error);
        // Fall back to predefined response
        return generateFallbackResponse(prompt);
    }
};

/**
 * Generate a fallback response when the API is unavailable
 * This allows development to continue even when the API cannot be reached
 */
const generateFallbackResponse = (prompt: string): string => {
    console.log("Generating fallback response for development");
    
    // If this is a document summary request
    if (prompt.includes("Summarize the following")) {
        return "This is a fallback summary generated for development purposes. The actual Claude API could not be reached. The document appears to contain information about an assignment or course material.";
    }
    
    // If this is a task generation request
    if (prompt.includes("task manager for a student") || prompt.includes("batch generating tasks")) {
        return `{
  "results": [
    {
      "courseId": "12345",
      "tasks": [
        {
          "id": "task-1",
          "type": "assignment",
          "due_date": "${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}",
          "task_description": "Development Fallback: Complete Project Milestone",
          "subtasks": [
            {
              "id": "subtask-1",
              "description": "Review project requirements and gather necessary resources",
              "expected_time": 1,
              "current_percentage_completed": 0
            },
            {
              "id": "subtask-2",
              "description": "Implement the core functionality for the project milestone",
              "expected_time": 3,
              "current_percentage_completed": 0
            },
            {
              "id": "subtask-3",
              "description": "Review, finalize and submit the completed project milestone",
              "expected_time": 0.5,
              "current_percentage_completed": 0
            }
          ],
          "documents": ["doc-1"],
          "approved_by_user": false
        }
      ]
    }
  ]
}`;
    }
    
    // Generic fallback
    return "This is a fallback response generated for development purposes. The Claude API could not be reached. Your request was received but could not be processed by the actual AI.";
};

/**
 * Parses a JSON response from Claude
 * This handles cases where Claude might add extra text around the JSON
 * 
 * @param response The raw text response from Claude
 * @returns The parsed JSON object
 */
export const parseJsonResponse = (response: string): any => {
    console.log("Attempting to parse JSON response:", response.substring(0, 100) + "...");
    
    try {
        // Try parsing the entire response as JSON first
        return JSON.parse(response);
    } catch (error) {
        console.log("Failed to parse entire response as JSON, trying to extract JSON portion");
        
        // If that fails, try to extract just the JSON part
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                          response.match(/```\s*([\s\S]*?)\s*```/) ||
                          response.match(/(\{[\s\S]*\})/);
                          
        if (jsonMatch && jsonMatch[1]) {
            try {
                console.log("Extracted JSON portion:", jsonMatch[1].substring(0, 100) + "...");
                return JSON.parse(jsonMatch[1]);
            } catch (innerError) {
                console.error('Error parsing extracted JSON:', innerError);
                throw new Error('Could not parse JSON from Claude response');
            }
        } else if (jsonMatch) {
            // If we matched the full JSON pattern but not the group
            try {
                console.log("Trying to parse full match:", jsonMatch[0].substring(0, 100) + "...");
                return JSON.parse(jsonMatch[0]);
            } catch (fullMatchError) {
                console.error('Error parsing full match JSON:', fullMatchError);
                throw new Error('Could not parse JSON from Claude response');
            }
        } else {
            console.error('No JSON found in Claude response');
            throw new Error('No JSON found in Claude response');
        }
    }
};

export const generateTasksFromData = async (calendarData: any): Promise<any[]> => {
    const prompt = `
Given the following calendar data: ${JSON.stringify(calendarData)}
Generate a list of tasks in this JSON format:
{
  type: "test", "class", "assignment", or "study",
  due_date: date,
  task_description: string,
  subtasks: [
    {
      description: string,
      expected_time: null,
      current_percentage_completed: 0
    }
  ]
}
If the assignment is a test, include both the test and a study task.
  `;
    
    try {
        const response = await callClaudeAPI(prompt, 2000);
        const parsedResponse = parseJsonResponse(response);
        return parsedResponse;
    } catch (error) {
        console.error('Error generating tasks from calendar data:', error);
        // Fall back to a simulated response on error
        return simulateTaskGeneration();
    }
};

/**
 * Fallback function to simulate task generation when API is unavailable
 */
const simulateTaskGeneration = (): any[] => {
    return [
        {
            id: '1',
            type: 'test',
            due_date: '2025-03-13',
            task_description: 'Midterm 2',
            subtasks: [
                {
                    id: '1',
                    description: 'Study Godels incompleteness theorem',
                    expected_time: 2,
                    current_percentage_completed: 0,
                },
                {
                    id: '2',
                    description: 'Study Turing Machines',
                    expected_time: 2,
                    current_percentage_completed: 0,
                },
            ],
            updated_at: new Date().toISOString(),
            documents: [],
            approved_by_user: true,
        },
        {
            id: '2',
            type: 'assignment',
            due_date: '2025-03-20',
            task_description: 'Sprint 3',
            subtasks: [
                {
                    id: '1',
                    description: 'Create interactive prototype',
                    expected_time: 2,
                    current_percentage_completed: 0,
                },
                {
                    id: '2',
                    description: 'Create video',
                    expected_time: 2,
                    current_percentage_completed: 0,
                },
            ],
            updated_at: new Date().toISOString(),
            documents: [],
            approved_by_user: true,
        },
    ];
};

/**
 * Process a document to determine how it should affect tasks
 * @param document The document to process
 * @param existingTask The task already associated with this document, if any
 * @param allTasks All existing tasks for context
 * @returns ProcessDocumentResult indicating what to do with this document
 */
export const processDocumentForTasks = async (
    document: Document,
    existingTask: Task | null,
    allTasks: Task[]
): Promise<ProcessDocumentResult> => {
    console.log(`Processing document: ${document.title}`);
    
    const prompt = `
You are an assistant helping to process a document for a student task management system.

DOCUMENT:
- Title: ${document.title}
- Type: ${document.type}
- Due Date: ${document.due_date.toISOString()}
- Content: ${document.content.substring(0, 2000)}${document.content.length > 2000 ? '...' : ''}

CONTEXT:
- ${existingTask ? `This document is already associated with a task: ${JSON.stringify(existingTask)}` : 'This document is not associated with any existing task.'}
- There are ${allTasks.length} existing tasks in the system.

Please analyze this document and determine how it should be handled. Return ONLY a JSON object with one of these formats:

1. If a new task should be created:
{
  "type": "new",
  "taskType": "test" or "assignment",
  "description": "task description",
  "dueDate": "ISO date string",
  "subtasks": [
    {
      "description": "Detailed and specific subtask description",
      "expected_time": number of hours,
      "current_percentage_completed": 0
    }
  ]
}

2. If an existing task should be updated:
{
  "type": "update",
  "taskId": "optional ID of task to update, if not the associated task",
  "updatedTask": {
    "task_description": "optional new description",
    "due_date": "optional new ISO date string",
    "type": "optional new type"
  }
}

3. If the document should be ignored:
{
  "type": "ignore",
  "reason": "reason for ignoring"
}

IMPORTANT: When creating subtasks:
- Create at least 4-6 specific subtasks for each task
- Extract specific requirements from the document content
- Include specific deliverables mentioned in the assignment description
- Be very specific about what each subtask requires (e.g., instead of "Complete assignment", use "Write a 2-page analysis of the case study")
- Include research steps if relevant to the assignment
- Include specific studying recommendations for tests
- Break larger assignments into logical steps (planning, research, writing, review, etc.)
- Include specific submission requirements if mentioned

Analyze carefully whether this document represents:
- A new assignment or test
- An update to an existing assignment or test
- A general announcement not requiring action
`;

    try {
        const response = await callClaudeAPI(prompt, 1500);
        return parseJsonResponse(response);
    } catch (error) {
        console.error('Error processing document for tasks:', error);
        
        // If the document is already associated with a task, update the task
        if (existingTask) {
            console.log(`Document is already associated with task: ${existingTask.task_description}`);
            
            // Simulate some basic updates based on document type and content
            if (document.type === 'assignment' && document.title.includes('Updated')) {
                return {
                    type: 'update',
                    updatedTask: {
                        task_description: `${existingTask.task_description} (Updated)`,
                        due_date: document.due_date.toISOString(),
                    }
                };
            }
            
            // No updates needed
            return {
                type: 'update',
                updatedTask: {}
            };
        }
        
        // Determine if this document should create a new task
        if (document.type === 'assignment') {
            // Check if there's already a similar task
            const similarTaskIndex = allTasks.findIndex(task => 
                task.task_description.toLowerCase().includes(document.title.toLowerCase()) ||
                document.title.toLowerCase().includes(task.task_description.toLowerCase())
            );
            
            if (similarTaskIndex >= 0) {
                // Update existing similar task
                return {
                    type: 'update',
                    taskId: allTasks[similarTaskIndex].id,
                    updatedTask: {
                        task_description: document.title,
                        due_date: document.due_date.toISOString(),
                    }
                };
            }
            
            // Create a new task with more detailed subtasks
            const subtasks: Subtask[] = [
                {
                    id: uuidv4(),
                    description: `Read through the entire ${document.title} description and requirements carefully`,
                    expected_time: 0.5,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Research the main topics related to "${document.title}" using course materials and online resources`,
                    expected_time: 1.5,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Create an outline or plan for completing ${document.title}`,
                    expected_time: 1,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Complete a draft version of ${document.title}`,
                    expected_time: 2,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Review and revise your work for ${document.title}`,
                    expected_time: 1,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Submit final version of ${document.title} before the deadline`,
                    expected_time: 0.5,
                    current_percentage_completed: 0
                }
            ];
            
            return {
                type: 'new',
                taskType: 'assignment',
                description: document.title,
                dueDate: document.due_date.toISOString(),
                subtasks
            };
        }
        
        // For documents that look like test announcements
        if (document.title.toLowerCase().includes('exam') || 
            document.title.toLowerCase().includes('test') || 
            document.title.toLowerCase().includes('midterm') ||
            document.title.toLowerCase().includes('final')) {
            
            // Create a new task for the test with more detailed subtasks
            const subtasks: Subtask[] = [
                {
                    id: uuidv4(),
                    description: `Create a study plan for ${document.title}`,
                    expected_time: 1,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Review all lecture notes and readings related to ${document.title}`,
                    expected_time: 2,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Create summary notes or flashcards for key concepts`,
                    expected_time: 1.5,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Practice with sample problems or past exams if available`,
                    expected_time: 2,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Form or join a study group for ${document.title}`,
                    expected_time: 1.5,
                    current_percentage_completed: 0
                },
                {
                    id: uuidv4(),
                    description: `Final review the day before ${document.title}`,
                    expected_time: 1,
                    current_percentage_completed: 0
                }
            ];
            
            return {
                type: 'new',
                taskType: 'test',
                description: document.title,
                dueDate: document.due_date.toISOString(),
                subtasks
            };
        }
        
        // For documents that should be ignored (e.g., announcements about lectures)
        if (document.type === 'announcement' && 
            !document.title.toLowerCase().includes('assignment') &&
            !document.title.toLowerCase().includes('exam') &&
            !document.title.toLowerCase().includes('due')) {
            
            return {
                type: 'ignore',
                reason: 'This appears to be a general announcement not related to any tasks'
            };
        }
        
        // Default - ignore any documents we don't know how to handle
        return {
            type: 'ignore',
            reason: 'Document type or content not recognized as task-related'
        };
    }
};

/**
 * Generate a summary for a document using Claude
 * @param document The document to summarize
 * @returns A summary string
 */
export const generateDocumentSummary = async (document: Document): Promise<string> => {
    console.log(`Generating summary for document: ${document.title}`);
    
    const prompt = `
Summarize the following ${document.type} titled "${document.title}":

${document.content.substring(0, 2000)}${document.content.length > 2000 ? '...' : ''}

Generate a concise summary (max 2-3 sentences) that:
1. Includes the likely assignment name or test name
2. Describes the main requirements or content
3. Extracts any key information like due dates or important details
`;

    try {
        // Call the Claude API via proxy server
        const response = await callClaudeAPI(prompt, 1000);
        
        if (!response || response.includes("fallback response generated for development")) {
            console.warn('Got a fallback response from Claude API, using simulated summary');
            return simulateDocumentSummary(document);
        }
        
        return response.trim();
    } catch (error) {
        console.error('Error generating document summary:', error);
        // Fall back to a simulated response on error
        return simulateDocumentSummary(document);
    }
};

/**
 * Fallback function to simulate document summaries when API is unavailable
 */
const simulateDocumentSummary = (document: Document): string => {
    if (document.type === 'assignment') {
        return `${document.title}: Assignment requiring students to ${document.content.length > 100 ? 'complete a project' : 'submit work'} on the topic. Due on ${document.due_date.toLocaleDateString()}.`;
    } else if (document.title.toLowerCase().includes('exam') || 
             document.title.toLowerCase().includes('test') || 
             document.title.toLowerCase().includes('midterm')) {
        return `${document.title}: Upcoming assessment covering course material. Scheduled for ${document.due_date.toLocaleDateString()}.`;
    } else {
        return `${document.title}: Announcement about course information or updates.`;
    }
};

/**
 * Generate tasks for all courses in a single batch operation
 * @param courses List of courses with their documents
 * @returns Updated list of tasks for each course
 */
export const batchGenerateTasks = async (courses: Course[]): Promise<{[courseId: string]: Task[]}> => {
    console.log('Batch generating tasks for all courses');
    
    // Prepare data to send to LLM - include more document details for better subtask generation
    const courseSummaries = courses.map(course => ({
        courseId: course.id,
        courseName: course.name,
        existingTasks: course.tasks,
        documents: Object.values(course.documents).map(doc => ({
            id: doc.id,
            title: doc.title,
            summary: doc.summary,
            content: doc.content.substring(0, 500), // Include a portion of content for better context
            due_date: doc.due_date,
            type: doc.type,
        }))
    }));
    
    // Create the prompt for the LLM with enhanced instructions for specific subtasks
    const prompt = `
You are a task manager for a student. Given the following courses and their documents, generate or update tasks.

Course information:
${JSON.stringify(courseSummaries, null, 2)}

Please follow these guidelines:
1. Assignments are always associated with a task
2. Announcements may augment an assignment, announce a test (that has no associated assignment), or be irrelevant to tasks
3. If a document is already associated with a task, update the task rather than creating a new one
4. For each task, create DETAILED and SPECIFIC subtasks to help the student complete it

IMPORTANT: When creating subtasks, ALWAYS follow this specific 3-part structure:
1. First subtask(s): Complete learning or research necessary to do the task
   - This might include reading materials, watching videos, understanding requirements, or researching topics
   - Example: "Read through the assignment instructions carefully" or "Research the main topics related to the project"

2. Middle subtask(s): Complete the specific requirements of the task
   - If there are specific problems/components, make separate subtasks for each
   - If there are no specific components, use a single subtask like "Complete the assignment"
   - Example: "Write the 5-page analysis report" or "Implement the database schema"

3. Final subtask: Finalize and submit the work (this should be quick, around 30 minutes)
   - Always include a submission step
   - Example: "Review, finalize and submit the completed assignment"

Examples of good subtask structures:
- For a coding project:
  1. "Review project requirements and set up development environment"
  2. "Implement the user authentication feature"
  3. "Create the database models and relationships"
  4. "Test the application with sample data"
  5. "Finalize code, document, and submit the project"

- For a group project:
  1. "Coordinate with group to determine work breakdown"
  2. "Complete your section of the project" 
  3. "Proofread and submit the final version"

For each course, provide a list of tasks in this exact format:
{
  "results": [
    {
      "courseId": "string",
      "tasks": [
        {
          "id": "string" (use existing ID if updating a task, or generate a new one if creating),
          "type": "test" | "assignment",
          "due_date": "ISO string",
          "task_description": "string",
          "subtasks": [
            {
              "id": "string",
              "description": "detailed and specific description of subtask",
              "expected_time": number (hours),
              "current_percentage_completed": 0
            }
          ],
          "documents": ["documentId1", "documentId2"],
          "approved_by_user": false
        }
      ]
    }
  ]
}

Important: Return ONLY the JSON with no additional explanations, markdown formatting, or surrounding text.
`;

    try {
        // Call the Claude API via proxy server with increased token limit
        const response = await callClaudeAPI(prompt, 4000);
        console.log("Received raw response from Claude API, length:", response.length);
        
        // Log the first 300 and last 300 characters of the response for debugging
        console.log("RAW RESPONSE START:");
        console.log(response.substring(0, 300));
        console.log("...");
        console.log(response.substring(response.length - 300));
        console.log("RAW RESPONSE END");
        
        // Check if we got a fallback response
        if (!response || response.includes("fallback response generated for development")) {
            console.warn('Got a fallback response from Claude API, using simulated tasks');
            return simulateBatchTaskGeneration(courses);
        }
        
        // Save the response to a global variable for debugging if needed
        (global as any).lastClaudeResponse = response;
        console.log("Saved response to global.lastClaudeResponse for debugging");
        
        // Process the response using our dedicated function
        return processJsonTaskResponse(response, courses);
    } catch (error) {
        console.error('Error batch generating tasks:', error);
        // Fall back to a simulated response on error
        return simulateBatchTaskGeneration(courses);
    }
};

/**
 * Fallback function to simulate batch task generation when API is unavailable
 */
const simulateBatchTaskGeneration = (courses: Course[]): {[courseId: string]: Task[]} => {
    const tasksByCourse: {[courseId: string]: Task[]} = {};
    
    courses.forEach(course => {
        const documents = Object.values(course.documents);
        const assignments = documents.filter(doc => doc.type === 'assignment');
        const announcements = documents.filter(doc => doc.type === 'announcement');
        
        // Start with any existing tasks
        const courseTasks = [...course.tasks];
        
        // Create tasks for assignments if they don't already exist
        assignments.forEach(assignment => {
            // Check if this assignment already has a task
            const existingTaskIndex = courseTasks.findIndex(task => 
                task.documents.some(doc => doc.id === assignment.id)
            );
            
            if (existingTaskIndex < 0) {
                // Create a new task for this assignment
                courseTasks.push({
                    id: uuidv4(),
                    type: 'assignment',
                    due_date: assignment.due_date.toISOString(),
                    task_description: assignment.title,
                    subtasks: [
                        {
                            id: uuidv4(),
                            description: `Read through the ${assignment.title} instructions and understand requirements`,
                            expected_time: 1,
                            current_percentage_completed: 0
                        },
                        {
                            id: uuidv4(),
                            description: `Complete the ${assignment.title} according to requirements`,
                            expected_time: 3,
                            current_percentage_completed: 0
                        },
                        {
                            id: uuidv4(),
                            description: `Review, finalize and submit the ${assignment.title}`,
                            expected_time: 0.5,
                            current_percentage_completed: 0
                        }
                    ],
                    documents: [assignment],
                    approved_by_user: false
                });
            }
        });
        
        // Process announcements for tests
        announcements.forEach(announcement => {
            if (announcement.title.toLowerCase().includes('exam') || 
                announcement.title.toLowerCase().includes('test') || 
                announcement.title.toLowerCase().includes('midterm') ||
                announcement.title.toLowerCase().includes('final')) {
                
                // Check if we already have a task for this test
                const existingTestTask = courseTasks.find(task => 
                    task.type === 'test' && 
                    (task.task_description.toLowerCase().includes(announcement.title.toLowerCase()) ||
                     announcement.title.toLowerCase().includes(task.task_description.toLowerCase()))
                );
                
                if (!existingTestTask) {
                    // Create a new task for this test
                    courseTasks.push({
                        id: uuidv4(),
                        type: 'test',
                        due_date: announcement.due_date.toISOString(),
                        task_description: announcement.title,
                        subtasks: [
                            {
                                id: uuidv4(),
                                description: `Review all course materials and readings for ${announcement.title}`,
                                expected_time: 2,
                                current_percentage_completed: 0
                            },
                            {
                                id: uuidv4(),
                                description: `Practice with sample problems and create study notes for ${announcement.title}`,
                                expected_time: 2,
                                current_percentage_completed: 0
                            },
                            {
                                id: uuidv4(),
                                description: `Complete final review and prepare for ${announcement.title}`,
                                expected_time: 1,
                                current_percentage_completed: 0
                            }
                        ],
                        documents: [announcement],
                        approved_by_user: false
                    });
                }
            }
        });
        
        tasksByCourse[course.id] = courseTasks;
    });
    
    return tasksByCourse;
};

/**
 * Directly process a pre-existing JSON response string into tasks
 * This is useful for testing and debugging purposes
 * 
 * @param jsonString The JSON string to process
 * @param courses The courses to associate tasks with
 * @returns Updated list of tasks for each course
 */
export const processJsonTaskResponse = (jsonString: string, courses: Course[]): {[courseId: string]: Task[]} => {
    console.log('Processing pre-existing JSON response');
    
    try {
        // Parse the response JSON
        let parsedResponse;
        try {
            parsedResponse = parseJsonResponse(jsonString);
            console.log("Successfully parsed response:", 
                        parsedResponse && parsedResponse.results ? 
                        `Found ${parsedResponse.results.length} course results` : 
                        "Invalid response structure");
            
            // Log the parsed response structure for debugging
            console.log("PARSED RESPONSE STRUCTURE:");
            if (parsedResponse && parsedResponse.results) {
                parsedResponse.results.forEach((result: any, index: number) => {
                    console.log(`Result ${index + 1}:`);
                    console.log(`  courseId: ${result.courseId}`);
                    console.log(`  tasks: ${result.tasks ? result.tasks.length : 'undefined'} tasks`);
                    
                    if (result.tasks && result.tasks.length > 0) {
                        // Log the first task as a sample
                        const firstTask = result.tasks[0];
                        console.log(`  Sample task:`, JSON.stringify(firstTask, null, 2).substring(0, 200) + '...');
                    }
                });
            } else {
                console.log("Unexpected structure:", Object.keys(parsedResponse || {}).join(', '));
            }
        } catch (parseError) {
            console.error("Failed to parse response:", parseError);
            return simulateBatchTaskGeneration(courses);
        }
        
        // Process the results
        const tasksByCourse: {[courseId: string]: Task[]} = {};
        
        if (parsedResponse && parsedResponse.results) {
            parsedResponse.results.forEach((result: any) => {
                if (result.courseId && Array.isArray(result.tasks)) {
                    console.log(`Processing ${result.tasks.length} tasks for course ${result.courseId}`);
                    
                    // Convert document IDs to actual document objects
                    const course = courses.find(c => c.id === result.courseId);
                    
                    if (course) {
                        console.log(`Found matching course: ${course.name}`);
                        
                        // Process the tasks to ensure they have the right structure
                        const processedTasks = result.tasks.map((task: any, taskIndex: number) => {
                            console.log(`  Processing task ${taskIndex + 1}: ${task.task_description || 'Unnamed task'}`);
                            
                            // Convert document IDs to actual document objects
                            const documentObjects = [];
                            if (Array.isArray(task.documents)) {
                                console.log(`    Task has ${task.documents.length} document references`);
                                for (const docId of task.documents) {
                                    if (course.documents[docId]) {
                                        documentObjects.push(course.documents[docId]);
                                        console.log(`    ✓ Found document: ${course.documents[docId].title}`);
                                    } else {
                                        console.log(`    ✗ Document not found: ${docId}`);
                                    }
                                }
                            } else {
                                console.log(`    Task has no document references`);
                            }
                            
                            // Ensure all required fields are present
                            const processedTask = {
                                id: task.id || uuidv4(),
                                type: task.type || 'assignment',
                                due_date: task.due_date || new Date().toISOString(),
                                task_description: task.task_description || 'Untitled Task',
                                subtasks: Array.isArray(task.subtasks) 
                                    ? task.subtasks.map((subtask: any) => ({
                                        id: subtask.id || uuidv4(),
                                        description: subtask.description || 'Untitled Subtask',
                                        expected_time: subtask.expected_time || 1,
                                        current_percentage_completed: subtask.current_percentage_completed || 0
                                    }))
                                    : [],
                                documents: documentObjects,
                                approved_by_user: false
                            };
                            
                            console.log(`    Processed task has ${processedTask.subtasks.length} subtasks and ${processedTask.documents.length} documents`);
                            return processedTask;
                        });
                        
                        tasksByCourse[result.courseId] = processedTasks;
                        console.log(`Added ${processedTasks.length} tasks for course ${course.name}`);
                    } else {
                        console.warn(`Course ${result.courseId} not found, skipping tasks`);
                    }
                } else {
                    console.warn(`Invalid result format - missing courseId or tasks array`);
                }
            });
        } else {
            console.error("Invalid response structure, missing results array");
            return simulateBatchTaskGeneration(courses);
        }
        
        console.log(`Generated tasks for ${Object.keys(tasksByCourse).length} courses`);
        return tasksByCourse;
    } catch (error) {
        console.error('Error processing JSON response:', error);
        // Fall back to a simulated response on error
        return simulateBatchTaskGeneration(courses);
    }
}; 