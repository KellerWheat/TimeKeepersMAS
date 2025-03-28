/**
 * Formats minutes into a human-readable time string (e.g., 540 -> "9:00 AM")
 * @param minutes - Number of minutes since midnight
 * @returns Formatted time string
 */
export const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Converts a time string (HH:MM AM/PM) to minutes since midnight
 * @param timeString - Time string in format "HH:MM AM/PM"
 * @returns Number of minutes since midnight
 */
export const parseTimeToMinutes = (timeString: string): number => {
    const [timePart, ampm] = timeString.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    // Convert 12-hour format to 24-hour
    if (ampm.toUpperCase() === 'PM' && hour < 12) {
        hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
    }
    
    return hour * 60 + minute;
};

/**
 * Returns a date string in YYYY-MM-DD format
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateToString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Gets the week dates (Mon-Sun) for a given date
 * @param date - Reference date
 * @returns Array of dates for the week
 */
export const getWeekDates = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const nextDate = new Date(monday);
        nextDate.setDate(monday.getDate() + i);
        weekDates.push(nextDate);
    }
    return weekDates;
}; 