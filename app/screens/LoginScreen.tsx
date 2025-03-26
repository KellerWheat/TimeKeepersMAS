// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    Modal,
    StyleSheet,
    ScrollView,
    Platform,
    Linking,
    Alert
} from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Canvas settings
const CANVAS_CONFIG = {
    settingsUrl: 'https://gatech.instructure.com/profile/settings',
    tokenStorageKey: 'canvas_access_token'
};

// Date picker options
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 1; i <= currentYear + 3; i++) {
        years.push(i);
    }
    return years;
};

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { setToken, updateData } = useAppData();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState(new Date().toLocaleDateString());
    
    // Token input state
    const [tokenInputVisible, setTokenInputVisible] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Date picker state
    const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
    const [selectedDay, setSelectedDay] = useState(date.getDate());
    const [selectedYear, setSelectedYear] = useState(date.getFullYear());
    const [daysInMonth, setDaysInMonth] = useState(getDaysInMonth(selectedMonth, selectedYear));
    const years = generateYears();

    useEffect(() => {
        // Check for existing token on mount
        checkExistingToken();
    }, []);

    const checkExistingToken = async () => {
        try {
            const token = await AsyncStorage.getItem(CANVAS_CONFIG.tokenStorageKey);
            if (token) {
                // If we have a token, use it
                setToken(token);
                updateData({ current_date: date });
                navigation.navigate('Courses');
            }
        } catch (error) {
            console.error('Error checking token:', error);
        }
    };

    const saveAndUseToken = async (token: string) => {
        try {
            await AsyncStorage.setItem(CANVAS_CONFIG.tokenStorageKey, token);
            setToken(token);
            updateData({ current_date: date });
            navigation.navigate('Courses');
        } catch (error) {
            console.error('Error saving token:', error);
            Alert.alert('Error', 'Failed to save your token. Please try again.');
        }
    };

    const handleTokenSubmit = () => {
        if (!tokenInput.trim()) {
            Alert.alert('Error', 'Please enter a valid Canvas token');
            return;
        }
        
        saveAndUseToken(tokenInput.trim());
    };

    const openCanvasSettings = () => {
        Linking.openURL(CANVAS_CONFIG.settingsUrl).catch((err) => {
            console.error('Error opening Canvas settings:', err);
            Alert.alert('Error', 'Could not open Canvas settings. Please navigate to Canvas settings manually.');
        });
    };

    const handleLogin = () => {
        // Use the test token for development
        setToken('2096~X8T4uXZ8VxQDUekYW4FUuyVFeFzPLWE3BxzkRxDuDmGTKutyDHKeJ4wRtB7NC44k');
        
        // Update the current_date in the app data context for testing
        updateData({ current_date: date });
        
        navigation.navigate('Courses');
    };

    const showDatePickerModal = () => {
        // Update selector values to match current date
        setSelectedMonth(date.getMonth());
        setSelectedDay(date.getDate());
        setSelectedYear(date.getFullYear());
        setDaysInMonth(getDaysInMonth(date.getMonth(), date.getFullYear()));
        setShowDatePicker(true);
    };

    const handleMonthChange = (index: number) => {
        setSelectedMonth(index);
        const newDaysInMonth = getDaysInMonth(index, selectedYear);
        setDaysInMonth(newDaysInMonth);
        
        // Adjust selected day if it exceeds the new month's days
        if (selectedDay > newDaysInMonth) {
            setSelectedDay(newDaysInMonth);
        }
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        const newDaysInMonth = getDaysInMonth(selectedMonth, year);
        setDaysInMonth(newDaysInMonth);
        
        // Adjust selected day if it exceeds the new month's days
        if (selectedDay > newDaysInMonth) {
            setSelectedDay(newDaysInMonth);
        }
    };

    const handleDateConfirm = () => {
        const newDate = new Date(selectedYear, selectedMonth, selectedDay);
        setDate(newDate);
        setDateString(newDate.toLocaleDateString());
        setShowDatePicker(false);
    };

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>Canvas Login</Text>
            <Text style={sharedStyles.text}>Welcome to Canvas. Please log in to continue.</Text>
            
            {/* Test Date Input */}
            <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Test Date (for testing):</Text>
                <TouchableOpacity 
                    style={styles.dateInputContainer}
                    onPress={showDatePickerModal}
                >
                    <TextInput
                        style={styles.dateInput}
                        value={dateString}
                        editable={false}
                        placeholder="Select a date"
                    />
                    <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
                <Text style={styles.dateHelp}>
                    Use this to simulate different dates for testing assignment due dates
                </Text>
            </View>
            
            {/* Custom Date Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        
                        <View style={styles.pickerContainer}>
                            {/* Month Selector */}
                            <View style={styles.selectorColumn}>
                                <Text style={styles.selectorLabel}>Month</Text>
                                <ScrollView style={styles.selector}>
                                    {MONTHS.map((month, index) => (
                                        <TouchableOpacity
                                            key={month}
                                            style={[
                                                styles.selectorItem,
                                                index === selectedMonth ? styles.selectedItem : null
                                            ]}
                                            onPress={() => handleMonthChange(index)}
                                        >
                                            <Text style={index === selectedMonth ? styles.selectedItemText : styles.selectorItemText}>
                                                {month}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            
                            {/* Day Selector */}
                            <View style={styles.selectorColumn}>
                                <Text style={styles.selectorLabel}>Day</Text>
                                <ScrollView style={styles.selector}>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.selectorItem,
                                                day === selectedDay ? styles.selectedItem : null
                                            ]}
                                            onPress={() => setSelectedDay(day)}
                                        >
                                            <Text style={day === selectedDay ? styles.selectedItemText : styles.selectorItemText}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            
                            {/* Year Selector */}
                            <View style={styles.selectorColumn}>
                                <Text style={styles.selectorLabel}>Year</Text>
                                <ScrollView style={styles.selector}>
                                    {years.map(year => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[
                                                styles.selectorItem,
                                                year === selectedYear ? styles.selectedItem : null
                                            ]}
                                            onPress={() => handleYearChange(year)}
                                        >
                                            <Text style={year === selectedYear ? styles.selectedItemText : styles.selectorItemText}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                        
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]} 
                                onPress={handleDateConfirm}
                            >
                                <Text style={styles.modalButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Token Input Modal */}
            <Modal
                visible={tokenInputVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTokenInputVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter Canvas Access Token</Text>
                        
                        <Text style={styles.tokenInstructions}>
                            To get your Canvas access token:
                        </Text>
                        
                        <View style={styles.instructionsContainer}>
                            <Text style={styles.tokenInstructions}>
                                1. Click the button below to open Canvas Settings
                            </Text>
                            <Text style={styles.tokenInstructions}>
                                2. Login to Georgia Tech Canvas if needed
                            </Text>
                            <Text style={styles.tokenInstructions}>
                                3. Scroll down to "Approved Integrations"
                            </Text>
                            <Text style={styles.tokenInstructions}>
                                4. Click "+ New Access Token"
                            </Text>
                            <Text style={styles.tokenInstructions}>
                                5. Enter "TimeKeepers" as the purpose
                            </Text>
                            <Text style={styles.tokenInstructions}>
                                6. Click "Generate Token"
                            </Text>
                            <Text style={styles.tokenInstructions}>
                                7. Copy your token and paste it below
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.settingsButton}
                            onPress={openCanvasSettings}
                        >
                            <Text style={styles.settingsButtonText}>Open Canvas Settings</Text>
                        </TouchableOpacity>
                        
                        <TextInput
                            style={styles.tokenInput}
                            value={tokenInput}
                            onChangeText={setTokenInput}
                            placeholder="Paste your Canvas token here"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={() => setTokenInputVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]} 
                                onPress={handleTokenSubmit}
                            >
                                <Text style={styles.modalButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            <TouchableOpacity 
                style={[sharedStyles.button, styles.tokenButton]} 
                onPress={() => setTokenInputVisible(true)}
            >
                <Text style={sharedStyles.buttonText}>
                    Login with Canvas Token
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[sharedStyles.button, styles.loginButton]} 
                onPress={handleLogin}
            >
                <Text style={sharedStyles.buttonText}>Use Test Token (Development)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    dateContainer: {
        marginVertical: 12,
        width: '100%',
        paddingHorizontal: 16,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#2c3e50',
    },
    dateInputContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        height: 48,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    dateInput: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    calendarIcon: {
        paddingHorizontal: 12,
        fontSize: 20,
    },
    dateHelp: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 4,
        fontStyle: 'italic',
    },
    loginButton: {
        marginTop: 12,
        backgroundColor: '#95a5a6',
    },
    tokenButton: {
        marginTop: 20,
        backgroundColor: '#3498db',
    },
    // Token Input styles
    tokenInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginVertical: 16,
        fontSize: 16,
    },
    instructionsContainer: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    tokenInstructions: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
    },
    settingsButton: {
        backgroundColor: '#2980b9',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        width: '100%',
        alignItems: 'center',
    },
    settingsButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#2c3e50',
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    selectorColumn: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    selectorLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#2c3e50',
    },
    selector: {
        height: 150,
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    selectorItem: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectorItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedItem: {
        backgroundColor: '#e3f2fd',
    },
    selectedItemText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2980b9',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e74c3c',
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: '#2ecc71',
        marginLeft: 10,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default LoginScreen;
