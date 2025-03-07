// screens/LoginScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';

const PRECONFIGURED_TOKEN = '2096~2ctR72C9MMkFr9EAyPAwnUYaDGGLWnauB2W8TNe83Y9cnfvZVv7wYw8r9HwCzcZG';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { setToken } = useAppData();

    const handleLogin = () => {
        // Update global token and navigate without passing it as a param.
        setToken(PRECONFIGURED_TOKEN);
        navigation.navigate('Courses');
    };

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>Canvas Login</Text>
            <Text style={sharedStyles.text}>Welcome to Canvas. Please log in to continue.</Text>
            <TouchableOpacity style={sharedStyles.button} onPress={handleLogin}>
                <Text style={sharedStyles.buttonText}>Login with Canvas</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;
