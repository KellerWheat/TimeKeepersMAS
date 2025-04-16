import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, updatePreferences, resetAppData, updateData, updateMetrics } = useAppData();
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState(new Date().toLocaleDateString());

    const handleResetData = async () => {
        try {
            await resetAppData();
        } catch (error) {
            console.error('Error resetting data:', error);
        }
    };

    const toggleGenerationType = () => {
        const newType = data.metrics.generationType === 'A' ? 'B' : 'A';
        updateMetrics({ generationType: newType });
        Alert.alert("Generation Type Changed", `Switched to type ${newType}`);
    };

    const toggleSchedulingType = () => {
        const newType = data.metrics.schedulingType === 'A' ? 'B' : 'A';
        updateMetrics({ schedulingType: newType });
        Alert.alert("Scheduling Type Changed", `Switched to type ${newType}`);
    };

    const handleDateChange = (text: string) => {
        setDateString(text);
        try {
            const newDate = new Date(text);
            if (!isNaN(newDate.getTime())) {
                setDate(newDate);
                updateData({ current_date: newDate });
            }
        } catch (error) {
            console.error('Error parsing date:', error);
        }
    };

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>Settings</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Debug Options</Text>
                
                <TouchableOpacity
                    style={[sharedStyles.button, styles.debugButton]}
                    onPress={handleResetData}
                >
                    <Text style={sharedStyles.buttonText}>Reset All Data</Text>
                </TouchableOpacity>

                <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>Test Date:</Text>
                    <TextInput
                        style={styles.dateInput}
                        value={dateString}
                        onChangeText={handleDateChange}
                        placeholder="MM/DD/YYYY"
                    />
                </View>

                <TouchableOpacity
                    style={[sharedStyles.button, styles.debugButton]}
                    onPress={toggleGenerationType}
                >
                    <Text style={sharedStyles.buttonText}>
                        Switch Generation Type (Current: {data.metrics.generationType})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[sharedStyles.button, styles.debugButton]}
                    onPress={toggleSchedulingType}
                >
                    <Text style={sharedStyles.buttonText}>
                        Switch Scheduling Type (Current: {data.metrics.schedulingType})
                    </Text>
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity
                style={[sharedStyles.button, styles.backButton]}
                onPress={() => navigation.goBack()}
            >
                <Text style={sharedStyles.buttonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        width: '100%',
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    debugButton: {
        backgroundColor: '#607D8B',
        marginBottom: 10,
    },
    backButton: {
        backgroundColor: '#607D8B',
        marginTop: 10,
    },
    dateContainer: {
        marginBottom: 15,
    },
    dateLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        backgroundColor: '#fff',
    }
});

export default SettingsScreen; 