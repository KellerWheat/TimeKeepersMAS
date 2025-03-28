import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData, TimeBlock, WeeklySchedule } from '@/src/context/AppDataContext';
import { v4 as uuidv4 } from 'uuid';
import { StackNavigationProps } from '../navigation';
import { formatMinutes } from '@/src/utils/timeUtils';

// Day names for display
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Available time blocks that can be toggled
const AVAILABLE_BLOCKS: { start: number; end: number; label: string }[] = [
    { start: 8 * 60, end: 10 * 60, label: '8:00 AM - 10:00 AM' },
    { start: 10 * 60, end: 12 * 60, label: '10:00 AM - 12:00 PM' },
    { start: 12 * 60, end: 14 * 60, label: '12:00 PM - 2:00 PM' },
    { start: 14 * 60, end: 16 * 60, label: '2:00 PM - 4:00 PM' },
    { start: 16 * 60, end: 18 * 60, label: '4:00 PM - 6:00 PM' },
    { start: 18 * 60, end: 20 * 60, label: '6:00 PM - 8:00 PM' },
    { start: 20 * 60, end: 22 * 60, label: '8:00 PM - 10:00 PM' },
];

type ScheduleScreenProps = {
    navigation: StackNavigationProps<'Schedule'>;
};

const ScheduleScreen = ({ navigation }: ScheduleScreenProps) => {
    const { data, updateWeeklySchedule, autoScheduleTasks } = useAppData();
    const [schedule, setSchedule] = useState<WeeklySchedule>(data.weeklySchedule);

    // Check if a time block is enabled for a day
    const isBlockEnabled = (dayOfWeek: number, start: number, end: number): boolean => {
        const daySchedule = schedule[dayOfWeek];
        if (!daySchedule || !daySchedule.available_blocks) return false;
        
        return daySchedule.available_blocks.some(
            block => block.start_time === start && block.end_time === end
        );
    };

    // Toggle a time block for a specific day
    const toggleTimeBlock = (dayOfWeek: number, start: number, end: number) => {
        const newSchedule = { ...schedule };
        
        // Ensure the day exists in the schedule
        if (!newSchedule[dayOfWeek]) {
            newSchedule[dayOfWeek] = { available_blocks: [] };
        }
        
        const dayBlocks = newSchedule[dayOfWeek].available_blocks;
        
        // Check if this block already exists
        const existingBlockIndex = dayBlocks.findIndex(
            block => block.start_time === start && block.end_time === end
        );
        
        if (existingBlockIndex >= 0) {
            // Remove the block if it exists
            dayBlocks.splice(existingBlockIndex, 1);
        } else {
            // Add the block if it doesn't exist
            dayBlocks.push({
                id: uuidv4(),
                start_time: start,
                end_time: end
            });
        }
        
        setSchedule(newSchedule);
    };

    // Save the schedule and navigate back
    const saveSchedule = () => {
        updateWeeklySchedule(schedule);
        // Re-run auto-scheduling with new availability
        autoScheduleTasks();
        navigation.goBack();
    };

    // Render each day with time blocks
    const renderDay = (dayOfWeek: number) => {
        return (
            <View key={dayOfWeek} style={styles.dayContainer}>
                <Text style={styles.dayLabel}>{DAYS[dayOfWeek]}</Text>
                <View style={styles.blocksContainer}>
                    {AVAILABLE_BLOCKS.map((block, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.timeBlock,
                                isBlockEnabled(dayOfWeek, block.start, block.end) && styles.timeBlockEnabled
                            ]}
                            onPress={() => toggleTimeBlock(dayOfWeek, block.start, block.end)}
                        >
                            <Text style={styles.timeBlockText}>{block.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>Weekly Availability</Text>
            <Text style={styles.subtitle}>
                Tap on time blocks to mark when you're available to work on tasks
            </Text>
            <ScrollView>
                {DAYS.map((_, index) => renderDay(index))}
            </ScrollView>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[sharedStyles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
                    <Text style={sharedStyles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={sharedStyles.button} onPress={saveSchedule}>
                    <Text style={sharedStyles.buttonText}>Save Schedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    dayContainer: {
        marginBottom: 20,
    },
    dayLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2c3e50',
    },
    blocksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    timeBlock: {
        width: '48%',
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    timeBlockEnabled: {
        backgroundColor: '#2980b9',
    },
    timeBlockText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        marginBottom: 20,
    },
    cancelButton: {
        backgroundColor: '#95a5a6',
    },
});

export default ScheduleScreen; 