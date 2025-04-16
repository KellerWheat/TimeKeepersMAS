import React, { useState, useEffect } from 'react';
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
    const [selectedBlocks, setSelectedBlocks] = useState<{ [day: number]: Set<number> }>({});

    // Initialize selected blocks from existing schedule
    useEffect(() => {
        const initialSelectedBlocks: { [day: number]: Set<number> } = {};
        
        // For each day, check which blocks are part of any time block
        for (let day = 0; day < 7; day++) {
            const daySchedule = data.weeklySchedule[day];
            const selected = new Set<number>();
            
            if (daySchedule && daySchedule.available_blocks) {
                // For each available block, mark all UI blocks that overlap with it
                daySchedule.available_blocks.forEach(block => {
                    AVAILABLE_BLOCKS.forEach((uiBlock, index) => {
                        if (uiBlock.start >= block.start_time && uiBlock.end <= block.end_time) {
                            selected.add(index);
                        }
                    });
                });
            }
            
            initialSelectedBlocks[day] = selected;
        }
        
        setSelectedBlocks(initialSelectedBlocks);
    }, [data.weeklySchedule]);

    // Toggle a time block for a specific day
    const toggleTimeBlock = (dayOfWeek: number, blockIndex: number) => {
        setSelectedBlocks(prev => {
            const newSelected = { ...prev };
            if (!newSelected[dayOfWeek]) {
                newSelected[dayOfWeek] = new Set();
            }
            
            if (newSelected[dayOfWeek].has(blockIndex)) {
                newSelected[dayOfWeek].delete(blockIndex);
            } else {
                newSelected[dayOfWeek].add(blockIndex);
            }
            
            return newSelected;
        });
    };

    // Consolidate adjacent blocks into continuous time ranges
    const consolidateBlocks = (dayOfWeek: number): TimeBlock[] => {
        const selected = selectedBlocks[dayOfWeek];
        if (!selected || selected.size === 0) return [];

        // Get all selected block times
        const blockTimes = Array.from(selected)
            .map(index => AVAILABLE_BLOCKS[index])
            .sort((a, b) => a.start - b.start);

        // Consolidate adjacent blocks
        const consolidated: TimeBlock[] = [];
        let currentBlock = { ...blockTimes[0] };

        for (let i = 1; i < blockTimes.length; i++) {
            const nextBlock = blockTimes[i];
            
            // If blocks are adjacent (end of current block equals start of next block)
            if (currentBlock.end === nextBlock.start) {
                currentBlock.end = nextBlock.end;
            } else {
                // Add the current block and start a new one
                consolidated.push({
                    id: uuidv4(),
                    start_time: currentBlock.start,
                    end_time: currentBlock.end
                });
                currentBlock = { ...nextBlock };
            }
        }

        // Add the last block
        consolidated.push({
            id: uuidv4(),
            start_time: currentBlock.start,
            end_time: currentBlock.end
        });

        return consolidated;
    };

    // Save the schedule and navigate back
    const saveSchedule = () => {
        const newSchedule: WeeklySchedule = {};
        
        // For each day, consolidate blocks and update schedule
        for (let day = 0; day < 7; day++) {
            const consolidatedBlocks = consolidateBlocks(day);
            if (consolidatedBlocks.length > 0) {
                newSchedule[day] = {
                    available_blocks: consolidatedBlocks
                };
            }
        }
        
        updateWeeklySchedule(newSchedule);
        autoScheduleTasks(true); // Force reschedule all tasks
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
                                selectedBlocks[dayOfWeek]?.has(index) && styles.timeBlockEnabled
                            ]}
                            onPress={() => toggleTimeBlock(dayOfWeek, index)}
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