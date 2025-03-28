// screens/CoursesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { fetchEnrolledCourses } from '@/src/api/canvasApi';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';

const CoursesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { data, setCourses } = useAppData();
    const token = data.token;
    const [courses, setLocalCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadCourses = async () => {
            if (!token) return;
            // If courses already exist in the context, use them.
            if (data.courses && data.courses.length > 0) {
                setLocalCourses(data.courses);
                setLoading(false);
                return;
            }
            // Otherwise, fetch courses and store them in context.
            const fetchedCourses = await fetchEnrolledCourses(token);
            setLocalCourses(fetchedCourses);
            setCourses(fetchedCourses);
            setLoading(false);
        };
        loadCourses();
    }, [token, data.courses, setCourses]);

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>Your Enrolled Courses</Text>
            <FlatList
                data={courses}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={sharedStyles.card}>
                        <Text style={sharedStyles.text}>{item.name}</Text>
                    </View>
                )}
            />
            <TouchableOpacity
                style={sharedStyles.button}
                onPress={() => navigation.navigate('TaskGeneration')}
            >
                <Text style={sharedStyles.buttonText}>Accept</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
});

export default CoursesScreen;
