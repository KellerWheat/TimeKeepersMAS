// api/canvasApi.ts
import { Course, Document } from '@/src/context/AppDataContext';

const CURRENT_ENROLLMENT_TERM = 229;

// Set to false to process all courses and documents
const TESTING_MODE = false;

// Canvas API base URL
const CANVAS_BASE_URL = 'https://proxyserver-o32a.onrender.com/api/canvas';

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
const convertRawCourseToCourse = (rawCourse: RawCourse): Course => ({
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
    summary: '',
    last_updated: new Date(assignment.updated_at),
    due_date: assignment.due_at ? new Date(assignment.due_at) : new Date(),
    type: 'assignment',
});

// Convert raw announcement data to our app's Document type
const convertAnnouncementToDocument = (announcement: RawAnnouncement): Document => ({
    id: announcement.id.toString(),
    title: announcement.title,
    content: announcement.message || '',
    summary: '',
    last_updated: announcement.posted_at ? new Date(announcement.posted_at) : new Date(),
    due_date: new Date(), // Announcements don't have due dates
    type: 'announcement',
});

/**
 * Select a single random course from an array of courses for testing purposes
 */
const getRandomCourse = (courses: Course[]): Course[] => {
    if (courses.length === 0) return [];
    const randomIndex = Math.floor(Math.random() * courses.length);
    const selectedCourse = courses[randomIndex];
    console.log(`TESTING MODE: Selected random course: ${selectedCourse.name}`);
    return [selectedCourse];
};

export const fetchEnrolledCourses = async (token: string): Promise<Course[]> => {
    try {
        // Use the favorites API which returns the user's favorite/enrolled courses - no pagination needed
        const url = `${CANVAS_BASE_URL}/users/self/favorites/courses?access_token=${token}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Error fetching courses: ${response.status} ${response.statusText}`);
            return [];
        }
        
        const allCourses: RawCourse[] = await response.json();
        console.log(`Fetched a total of ${allCourses.length} courses`);
        
        // Filter by current enrollment_term and convert to our Course format
        const currentTermCourses = allCourses.filter(course => {
            // If enrollment_term_id is present, check if it matches the current term
            if (course.enrollment_term_id) {
                return course.enrollment_term_id === CURRENT_ENROLLMENT_TERM;
            }
            // Otherwise, include the course (it's likely current)
            return true;
        });
        
        console.log(`Filtered to ${currentTermCourses.length} courses in current term (${CURRENT_ENROLLMENT_TERM})`);
        
        let convertedCourses = currentTermCourses.map(convertRawCourseToCourse);
        
        // If in testing mode, select just one random course
        if (TESTING_MODE && convertedCourses.length > 1) {
            convertedCourses = getRandomCourse(convertedCourses);
        }
        
        return convertedCourses;
    } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        return [];
    }
};

export const fetchCourseCalendar = async (
    token: string,
    courseId: number | string
): Promise<any[]> => {
    try {
        let allEvents: any[] = [];
        let page = 1;
        let hasMoreEvents = true;
        
        // Continue fetching until we get an empty response
        while (hasMoreEvents) {
            const url = `${CANVAS_BASE_URL}/courses/${courseId}/calendar_events?page=${page}&per_page=10&access_token=${token}`;
            try {
                const response = await fetch(url);
                
                const events = await response.json();
                
                // If we get no events back, we've reached the end of pagination
                if (events.length === 0) {
                    hasMoreEvents = false;
                } else {
                    allEvents = [...allEvents, ...events];
                    console.log(`Fetched ${events.length} calendar events for course ${courseId} (page ${page})`);
                    page++;
                }
            } catch (error) {
                console.error(`Error fetching calendar events page ${page} for course ${courseId}:`, error);
                hasMoreEvents = false; // Stop on error
            }
        }
        
        console.log(`Fetched a total of ${allEvents.length} calendar events for course ${courseId}`);
        return allEvents;
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
        // Fetch assignments with pagination
        let allAssignments: RawAssignment[] = [];
        let page = 1;
        let hasMoreAssignments = true;
        
        // Continue fetching until we get an empty response
        while (hasMoreAssignments) {
            const assignmentsUrl = `${CANVAS_BASE_URL}/courses/${courseId}/assignments?page=${page}&per_page=10&access_token=${token}`;
            try {
                const assignmentsResponse = await fetch(assignmentsUrl);
                
                const assignments: RawAssignment[] = await assignmentsResponse.json();
                
                // If we get no assignments back, we've reached the end of pagination
                if (assignments.length === 0) {
                    hasMoreAssignments = false;
                } else {
                    allAssignments = [...allAssignments, ...assignments];
                    console.log(`Fetched ${assignments.length} assignments for course ${courseId} (page ${page})`);
                    page++;
                }
            } catch (error) {
                console.error(`Error fetching assignments page ${page} for course ${courseId}:`, error);
                hasMoreAssignments = false; // Stop on error
            }
        }
        
        console.log(`Fetched a total of ${allAssignments.length} assignments for course ${courseId}`);
        
        // Fetch announcements with pagination
        let allAnnouncements: RawAnnouncement[] = [];
        page = 1;
        let hasMoreAnnouncements = true;
        
        // Continue fetching until we get an empty response
        while (hasMoreAnnouncements) {
            const announcementsUrl = `${CANVAS_BASE_URL}/announcements?context_codes[]=course_${courseId}&page=${page}&per_page=10&access_token=${token}`;
            try {
                const announcementsResponse = await fetch(announcementsUrl);
                
                const announcements: RawAnnouncement[] = await announcementsResponse.json();
                
                // If we get no announcements back, we've reached the end of pagination
                if (announcements.length === 0) {
                    hasMoreAnnouncements = false;
                } else {
                    allAnnouncements = [...allAnnouncements, ...announcements];
                    console.log(`Fetched ${announcements.length} announcements for course ${courseId} (page ${page})`);
                    page++;
                }
            } catch (error) {
                console.error(`Error fetching announcements page ${page} for course ${courseId}:`, error);
                hasMoreAnnouncements = false; // Stop on error
            }
        }
        
        console.log(`Fetched a total of ${allAnnouncements.length} announcements for course ${courseId}`);
        
        // Convert to our app's Document format
        const assignmentDocs = allAssignments.map(convertAssignmentToDocument);
        const announcementDocs = allAnnouncements.map(convertAnnouncementToDocument);
        
        // Combine all document types
        const allDocuments = [...assignmentDocs, ...announcementDocs];
        
        console.log(`Fetched ${allDocuments.length} total documents for course ${courseId} (${assignmentDocs.length} assignments, ${announcementDocs.length} announcements)`);
        return allDocuments;
    } catch (error) {
        console.error(`Error fetching documents for course ${courseId}:`, error);
        return [];
    }
};

/**
 * Verify if a Canvas token is valid by making a test API call
 * @param token The Canvas access token to verify
 * @returns Whether the token is valid and any user info
 */
export const verifyCanvasToken = async (token: string): Promise<{valid: boolean, userData?: any}> => {
    try {
        const url = `${CANVAS_BASE_URL}/users/self?access_token=${token}`;
        const response = await fetch(url);
        
        const userData = await response.json();
        console.log('Token verified successfully. User data:', userData);
        return { valid: true, userData };
    } catch (error) {
        console.error('Error verifying Canvas token:', error);
        return { valid: false };
    }
};
