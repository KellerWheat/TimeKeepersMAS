import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, updatePreferences } = useAppData();
    const [isSaved, setIsSaved] = useState<boolean>(false);

    const saveSettings = () => {
        updatePreferences({
            // Add any user-configurable settings here
            taskViewPeriodDays: data.preferences.taskViewPeriodDays
        });
        setIsSaved(true);
        Alert.alert('Settings Saved', 'Your settings have been updated successfully.');
    };

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>Settings</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Settings</Text>
                <Text style={styles.helpText}>
                    LLM Integration is enabled using a pre-configured API key.
                </Text>
            </View>
            
            <TouchableOpacity
                style={[sharedStyles.button, isSaved ? styles.savedButton : null]}
                onPress={saveSettings}
            >
                <Text style={sharedStyles.buttonText}>Save Settings</Text>
            </TouchableOpacity>
            
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
    helpText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    savedButton: {
        backgroundColor: '#4CAF50',
    },
    backButton: {
        backgroundColor: '#607D8B',
        marginTop: 10,
    }
});

export default SettingsScreen; 