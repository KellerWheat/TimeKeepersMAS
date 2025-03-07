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
                    course: "CS 4510",
                    subtasks: [
                        {
                            id: 1,
                            description: 'Study Godels incompleteness theorem',
                            expected_time: 2,
                            current_percentage_completed: 0,
                        },
                        {
                            id: 2,
                            description: 'Study Turing Machines',
                            expected_time: 2,
                            current_percentage_completed: 0,
                        },
                    ],
                    updated_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    type: 'assignment',
                    due_date: '2025-03-20',
                    task_description: 'Sprint 3',
                    course: 'Mobile Apps and Svs',
                    subtasks: [
                        {
                            id: 1,
                            description: 'Create interactive prototype',
                            expected_time: 2,
                            current_percentage_completed: 0,
                        },
                        {
                            id: 2,
                            description: 'Create video',
                            expected_time: 2,
                            current_percentage_completed: 0,
                        },
                    ],
                    updated_at: new Date().toISOString(),
                },
                {
                    id: '3',
                    type: 'course',
                    due_date: '2025-03-20',
                    task_description: 'Midterm 2',
                    course: 'CS 4510',
                    subtasks: [
                        {
                            description: 'Study Godels incompleteness theorem',
                            expected_time: 2,
                            current_percentage_completed: 0,
                        },
                        {
                            description: 'Study Turing Machines',
                            expected_time: 2,
                            current_percentage_completed: 0,
                        },
                    ],
                    updated_at: new Date().toISOString(),
                },
                // Additional tasks can be added here.
            ]);
        }, 200);
    });
};
