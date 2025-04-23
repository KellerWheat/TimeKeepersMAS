// src/sharedStyles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';

interface SharedStyles {
    container: ViewStyle;
    screenTitle: TextStyle;
    text: TextStyle;
    card: ViewStyle;
    taskBox: ViewStyle;
    taskHeader: ViewStyle;
    taskTitle: TextStyle;
    taskDate: TextStyle;
    taskTime: TextStyle;
    pencil: TextStyle;
    pencilSmall: TextStyle;
    editInput: TextStyle;
    subtaskContainer: ViewStyle;
    subtaskBox: ViewStyle;
    timeContainer: ViewStyle;
    timeButton: ViewStyle;
    timeButtonText: TextStyle;
    timeValue: TextStyle;
    subtaskPlusButton: ViewStyle;
    button: ViewStyle;
    buttonText: TextStyle;
    // Task approval styles
    approvedTask: ViewStyle;
    approvedIcon: TextStyle;
    unapprovedIcon: TextStyle;
    buttonContainer: ViewStyle;
    // Modal styles
    modalOverlay: ViewStyle;
    modalContent: ViewStyle;
    modalTitle: TextStyle;
    courseItem: ViewStyle;
    courseItemText: TextStyle;
    modalCloseButton: ViewStyle;
    modalCloseButtonText: TextStyle;
}

export const sharedStyles = StyleSheet.create<SharedStyles>({
    // Base container for screens
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 16,
    },
    // Screen title styling
    screenTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
        textAlign: 'center',
    },
    // General text styling
    text: {
        fontSize: 16,
        color: '#e2e8f0',
        lineHeight: 22,
        textAlign: 'center',
    },
    // Standard card style for grouping content
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    // Task box style (smaller than card)
    taskBox: {
        backgroundColor: '#dbeafe',
        borderRadius: 10,
        padding: 8,
        marginVertical: 4,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        borderLeftColor: '#3b82f6',
    },
    // Task header styling for row layout
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    // Task title style within the header
    taskTitle: {
        fontSize: 14,
        marginBottom: 4,
        color: '#000000',
        flex: 1,
    },
    taskDate: {
        fontSize: 10,
        color: '#000000', 
        textAlign: 'center',
        marginBottom: 4,
    },
    taskTime: {
        fontSize: 10,
        color: '#000000',
        marginTop: 2,
      },
    // Pencil icon style for edit buttons
    pencil: {
        fontSize: 10,
        marginLeft: 8,
        color: '#3b82f6',
    },
    // Pencil icon style for inline editing (smaller)
    pencilSmall: {
        fontSize: 10,
        marginLeft: 4,
        color: '#3b82f6',
    },
    // Input style for inline editing
    editInput: {
        borderBottomWidth: 1,
        borderColor: '#64748b',
        color: '#f8fafc',
        flex: 1,
        marginRight: 8,
    },
    // Container for subtasks within a task
    subtaskContainer: {
        marginLeft: 16,
        marginTop: 8,
    },
    // Subtask box style
    subtaskBox: {
        backgroundColor: '#5e81ac',
        borderRadius: 10,
        padding: 8,
        marginVertical: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    // Container for time controls (plus/minus buttons)
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    // Style for the time control buttons
    timeButton: {
        padding: 4,
        backgroundColor: '#fb923c',
        borderRadius: 4,
    },
    // Text style for the time control buttons
    timeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    // Display for the current expected time value
    timeValue: {
        marginHorizontal: 8,
        fontSize: 16,
        color: '#e2e8f0',
    },
    // Plus button style for adding a subtask
    subtaskPlusButton: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    // Standard button style
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
    },
    // Standard button text style
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    // Task approval styles
    approvedTask: {
        backgroundColor: '#dbeafe', 
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    approvedIcon: {
        color: '#22c55e', 
        fontSize: 20,
        fontWeight: 'bold',
    },
    unapprovedIcon: {
        color: '#94a3b8', 
        fontSize: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#f1f5f9',
    },
    courseItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    courseItemText: {
        fontSize: 16,
        color: '#e2e8f0'
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#334155',
        borderRadius: 5,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#cbd5e16',
        fontSize: 16,
    },
});

// Export the nav header configuration separately
export const navHeader: StackNavigationOptions = {
    headerStyle: {
        backgroundColor: '#1e293b',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: 'bold',
    },
    headerTitleAlign: 'center' as 'center',
};
