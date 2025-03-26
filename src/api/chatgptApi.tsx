import { Document, Task, Subtask } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';

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
    // For now, we simulate a response. Replace this with your actual API call.
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
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
            ]);
        }, 200);
    });
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
    // This would normally call an LLM API, but for now we'll simulate responses
    console.log(`Processing document: ${document.title}`);
    
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
        
        // Create a new task
        const subtasks: Subtask[] = [
            {
                id: uuidv4(),
                description: `Review ${document.title}`,
                expected_time: 1,
                current_percentage_completed: 0
            },
            {
                id: uuidv4(),
                description: 'Complete assignment',
                expected_time: 2,
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
        
        // Create a new task for the test
        const subtasks: Subtask[] = [
            {
                id: uuidv4(),
                description: `Study for ${document.title}`,
                expected_time: 3,
                current_percentage_completed: 0
            },
            {
                id: uuidv4(),
                description: 'Review class notes',
                expected_time: 2,
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
};
