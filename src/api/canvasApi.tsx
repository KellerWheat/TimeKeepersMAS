// api/canvasApi.ts

// Toggle this variable to use mock data or the real API.
const USE_MOCK_DATA = true;

export const fetchEnrolledCourses = async (token: string): Promise<any[]> => {
    if (USE_MOCK_DATA) {
        // Return mock course data with minimal keys.
        const mockCourses = [
            {
                id: 370663,
                name: "Tech Communication",
            },
            {
                id: 370664,
                name: "Automata and Complexity",
            },
            {
                id: 370665,
                name: "Mobile Apps and Svs"
            }
        ];
        console.log('Returning mock courses:', mockCourses);
        return mockCourses;
    } else {
        try {
            const response = await fetch('https://gatech.instructure.com/api/v1/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            console.log('Fetched courses:', data);
            // Assuming the API returns an array of courses
            return data;
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    }
};

export const fetchCourseCalendar = async (
    token: string,
    courseId: number | string
): Promise<any> => {
    if (USE_MOCK_DATA) {
        // Return mock calendar events with only the keys you need.
        const mockCalendarEvents = [
            {
                id: 101,
                title: "Midterm Exam",
                due_at: "2025-03-20T00:00:00-06:00",
            },
            {
                id: 102,
                title: "Project Deadline",
                due_at: "2025-03-25T23:59:59-06:00",
            },
        ];
        console.log(`Returning mock calendar for course ${courseId}:`, mockCalendarEvents);
        return mockCalendarEvents;
    } else {
        try {
            const response = await fetch(
                `https://canvas.instructure.com/api/v1/courses/${courseId}/calendar_events`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching calendar for course ${courseId}:`, error);
            return [];
        }
    }
};
