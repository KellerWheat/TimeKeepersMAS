// src/sharedStyles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface SharedStyles {
    container: ViewStyle;
    screenTitle: TextStyle;
    text: TextStyle;
    card: ViewStyle;
    taskBox: ViewStyle;
    taskHeader: ViewStyle;
    taskTitle: TextStyle;
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
        backgroundColor: '#f0f4f8',
        padding: 16,
    },
    // Screen title styling
    screenTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    // General text styling
    text: {
        fontSize: 16,
        color: '#4a5568',
        lineHeight: 22,
        textAlign: 'center',
    },
    // Standard card style for grouping content
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    // Task box style (smaller than card)
    taskBox: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 8,
        marginVertical: 4,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    // Task header styling for row layout
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    // Task title style within the header
    taskTitle: {
        fontSize: 18,
        marginBottom: 4,
        flex: 1,
    },
    // Pencil icon style for edit buttons
    pencil: {
        fontSize: 18,
        marginLeft: 8,
        color: '#2980b9',
    },
    // Pencil icon style for inline editing (smaller)
    pencilSmall: {
        fontSize: 14,
        marginLeft: 4,
        color: '#2980b9',
    },
    // Input style for inline editing
    editInput: {
        borderBottomWidth: 1,
        borderColor: '#ccc',
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
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 8,
        marginVertical: 4,
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
        backgroundColor: '#2980b9',
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
        color: '#4a5568',
    },
    // Plus button style for adding a subtask
    subtaskPlusButton: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    // Standard button style
    button: {
        backgroundColor: '#2980b9',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
    },
    // Standard button text style
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
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
    },
    courseItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    courseItemText: {
        fontSize: 16,
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#666',
        fontSize: 16,
    },
});

// Export the nav header configuration separately
export const navHeader = {
    headerStyle: {
        backgroundColor: '#2980b9',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontFamily: 'Avenir',
        fontWeight: 'bold',
    },
    headerTitleAlign: 'center' as 'center',
};
