// api/canvasApi.ts
import { Course, Document } from '@/src/context/AppDataContext';

const CURRENT_ENROLLMENT_TERM = 229;

interface RawCourse {
    id: number;
    name: string;
    enrollment_term_id: number;
}

interface RawAssignment {
    id: number;
    name: string;
    description: string;
    due_at: string | null;
    created_at: string;
    updated_at: string;
    html_url: string;
}

interface RawAnnouncement {
    id: number;
    title: string;
    message: string;
    posted_at: string | null;
    html_url: string;
    last_reply_at: string | null;
}

// Convert raw course data to our app's Course type
const convertToCourse = (rawCourse: RawCourse): Course => ({
    id: rawCourse.id.toString(),
    name: rawCourse.name.split('-')[0].trim(),
    tasks: [],
    documents: {},
});

// Convert raw assignment data to our app's Document type
const convertAssignmentToDocument = (assignment: RawAssignment): Document => ({
    id: assignment.id.toString(),
    title: assignment.name,
    content: assignment.description || '',
    last_updated: new Date(assignment.updated_at),
    due_date: assignment.due_at ? new Date(assignment.due_at) : new Date(),
    type: 'assignment',
});

// Convert raw announcement data to our app's Document type
const convertAnnouncementToDocument = (announcement: RawAnnouncement): Document => ({
    id: announcement.id.toString(),
    title: announcement.title,
    content: announcement.message || '',
    last_updated: announcement.posted_at ? new Date(announcement.posted_at) : new Date(),
    due_date: new Date(), // Announcements don't have due dates
    type: 'announcement',
});

export const fetchEnrolledCourses = async (token: string): Promise<Course[]> => {
    try {
        const response = await fetch(`https://gatech.instructure.com/api/v1/users/self/favorites/courses?access_token=${token}`)
        if (response.status === 403) {
            console.error('Access forbidden (403)');
            return [];
        }
        const data: RawCourse[] = await response.json();
        console.log('Fetched courses:', data);
        
        // Filter current term courses and convert to our app's format
        return data
            .filter(course => course.enrollment_term_id === CURRENT_ENROLLMENT_TERM)
            .map(convertToCourse);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
};

export const fetchCourseCalendar = async (
    token: string,
    courseId: number | string
): Promise<any[]> => {
    try {
        const response = await fetch(
            `https://gatech.instructure.com/api/v1/courses/${courseId}/calendar_events?access_token=${token}`
        );
        if (response.status === 403) {
            console.error(`Access forbidden (403) for course ${courseId}`);
            return [];
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching calendar for course ${courseId}:`, error);
        return [];
    }
};

export const fetchCourseDocuments = async (
    token: string,
    courseId: string
): Promise<Document[]> => {
    try {
        // Fetch assignments
        const assignmentsResponse = await fetch(
            `https://gatech.instructure.com/api/v1/courses/${courseId}/assignments?access_token=${token}`
        );
        
        // Fetch announcements using the correct endpoint
        const announcementsResponse = await fetch(
            `https://gatech.instructure.com/api/v1/announcements?context_codes[]=course_${courseId}&access_token=${token}`
        );
        
        // Check for errors
        if (assignmentsResponse.status === 403 || announcementsResponse.status === 403) {
            console.error(`Access forbidden (403) for course ${courseId}`);
            return [];
        }
        
        // Process the responses
        const assignments: RawAssignment[] = await assignmentsResponse.json();
        const announcements: RawAnnouncement[] = await announcementsResponse.json();
        
        // Convert to our app's Document format
        const assignmentDocs = assignments.map(convertAssignmentToDocument);
        const announcementDocs = announcements.map(convertAnnouncementToDocument);
        
        // Combine all document types
        const allDocuments = [...assignmentDocs, ...announcementDocs];
        
        console.log(`Fetched ${allDocuments.length} documents for course ${courseId}`);
        return allDocuments;
    } catch (error) {
        console.error(`Error fetching documents for course ${courseId}:`, error);
        return [];
    }
};
