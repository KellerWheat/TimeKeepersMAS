// screens/ApiTestScreen.tsx
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { callClaudeAPI } from '@/src/api/llmApi';

const ApiTestScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [testing, setTesting] = useState<boolean>(false);
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const testApi = async () => {
        setTesting(true);
        setResponse(null);
        setError(null);

        try {
            // Call the Claude API via proxy with just the prompt parameter
            const result = await callClaudeAPI('What is the capital of France? Please answer in one sentence.', 1000);
            
            setResponse(result);
            console.log('API test successful:', result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to call Claude API: ${errorMessage}`);
            console.error('API test failed:', err);
        } finally {
            setTesting(false);
        }
    };

    return (
        <View style={sharedStyles.container}>
            <Text style={sharedStyles.screenTitle}>API Test</Text>
            <Text style={sharedStyles.text}>Test the Claude API connection through our secure proxy server.</Text>
            
            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    Using a dedicated proxy server at:
                    <Text style={styles.codeText}>{"\n"}https://proxyserver-o32a.onrender.com/api/claude</Text>
                    {"\n\n"}This approach keeps the API key secure on the server side.
                </Text>
            </View>

            <TouchableOpacity 
                style={[sharedStyles.button, styles.testButton]} 
                onPress={testApi}
                disabled={testing}
            >
                <Text style={sharedStyles.buttonText}>
                    {testing ? 'Testing...' : 'Test Claude API'}
                </Text>
            </TouchableOpacity>

            {testing && (
                <ActivityIndicator size="large" color="#2980b9" style={{ marginVertical: 20 }} />
            )}

            {response && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>API Response:</Text>
                    <ScrollView style={styles.responseScroll}>
                        <Text style={styles.responseText}>{response}</Text>
                    </ScrollView>
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error:</Text>
                    <ScrollView style={styles.responseScroll}>
                        <Text style={styles.errorText}>{error}</Text>
                    </ScrollView>
                </View>
            )}

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
    infoBox: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        width: '100%',
    },
    infoText: {
        fontSize: 14,
        color: '#2e7d32',
        lineHeight: 20,
    },
    codeText: {
        fontFamily: 'monospace',
        fontWeight: 'bold',
    },
    testButton: {
        marginTop: 20,
        backgroundColor: '#2980b9',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#7f8c8d',
    },
    resultContainer: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#f0f8ff',
        width: '100%',
        maxHeight: 300,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2c3e50',
    },
    responseScroll: {
        maxHeight: 250,
    },
    responseText: {
        fontSize: 14,
        color: '#2c3e50',
    },
    errorContainer: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#ffebee',
        width: '100%',
        maxHeight: 300,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#c0392b',
    },
    errorText: {
        fontSize: 14,
        color: '#c0392b',
    },
});

export default ApiTestScreen; 