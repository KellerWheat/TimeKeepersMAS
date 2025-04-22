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
    Alert,
    ActivityIndicator
} from 'react-native';
import { sharedStyles } from '@/src/sharedStyles';
import { useAppData } from '@/src/context/AppDataContext';
import { verifyCanvasToken } from '@/src/api/canvasApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Canvas settings
const CANVAS_CONFIG = {
    settingsUrl: 'https://gatech.instructure.com/profile/settings',
    tokenStorageKey: 'canvas_access_token'
};

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { setToken, updateData, updateMetrics } = useAppData();
    const [tokenInputVisible, setTokenInputVisible] = useState(false);
    const [tokenInput, setTokenInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasSavedToken, setHasSavedToken] = useState(false);
    const [savedToken, setSavedToken] = useState('');

    useEffect(() => {
        // Check for existing token on mount
        checkExistingToken();
    }, []);

    const checkExistingToken = async () => {
        try {
            const token = await AsyncStorage.getItem(CANVAS_CONFIG.tokenStorageKey);
            if (token) {
                setIsLoading(true);
                try {
                    // Verify the stored token is still valid
                    const result = await verifyCanvasToken(token);
                    
                    if (result.valid) {
                        // If we have a valid token, store it but don't navigate automatically
                        setSavedToken(token);
                        setHasSavedToken(true);
                    } else {
                        // Token is invalid, show instructions to get a new one
                        console.log('Stored token is invalid, requesting new token');
                        setTokenInputVisible(true);
                    }
                } catch (error) {
                    console.error('Error verifying stored token:', error);
                    // On verification error, let the user enter a token manually
                    setTokenInputVisible(true);
                } finally {
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error('Error checking token:', error);
        }
    };

    const continueWithSavedToken = () => {
        setToken(savedToken);
        updateData({ current_date: new Date() });
        navigation.navigate('Courses');
    };

    const saveAndUseToken = async (token: string) => {
        try {
            await AsyncStorage.setItem(CANVAS_CONFIG.tokenStorageKey, token);
            setToken(token);
            updateData({ current_date: new Date() });
            // Get user data from the token verification response
            const result = await verifyCanvasToken(token);
            if (result.valid && result.userData) {
                updateMetrics({ userName: result.userData.name });
            }
            setTokenInputVisible(false); // Close the modal
            navigation.navigate('Courses');
        } catch (error) {
            console.error('Error saving token:', error);
            Alert.alert('Error', 'Failed to save your token. Please try again.');
        }
    };

    const handleTokenSubmit = async () => {
        if (!tokenInput.trim()) {
            Alert.alert('Error', 'Please enter a valid Canvas token');
            return;
        }
        
        setIsLoading(true);
        try {
            // Verify the token using our proxy-enabled function
            const result = await verifyCanvasToken(tokenInput.trim());
            
            if (result.valid) {
                saveAndUseToken(tokenInput.trim());
            } else {
                Alert.alert('Error', 'The Canvas token appears to be invalid. Please check and try again.');
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            Alert.alert('Error', 'Could not verify token. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const openCanvasSettings = () => {
        Linking.openURL(CANVAS_CONFIG.settingsUrl).catch((err) => {
            console.error('Error opening Canvas settings:', err);
            Alert.alert('Error', 'Could not open Canvas settings. Please navigate to Canvas settings manually.');
        });
    };

    return (
        <View style={sharedStyles.container}>
            <View style={styles.headerContainer}>
                <Text style={sharedStyles.screenTitle}>Canvas Login</Text>
                <TouchableOpacity 
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>
            <Text style={sharedStyles.text}>Welcome to Canvas. Please log in to continue.</Text>
            
            {/* Continue with Saved Token button */}
            {hasSavedToken && (
                <TouchableOpacity 
                    style={[sharedStyles.button, styles.continueButton]} 
                    onPress={continueWithSavedToken}
                    disabled={isLoading}
                >
                    <Text style={sharedStyles.buttonText}>
                        Continue with Saved Token
                    </Text>
                </TouchableOpacity>
            )}
            
            <TouchableOpacity 
                style={[sharedStyles.button, styles.tokenButton]} 
                onPress={() => setTokenInputVisible(true)}
                disabled={isLoading}
            >
                <Text style={sharedStyles.buttonText}>
                    Login with Canvas Token
                </Text>
            </TouchableOpacity>

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
                            style={styles.openSettingsButton}
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
                            editable={!isLoading}
                        />
                        
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={() => setTokenInputVisible(false)}
                                disabled={isLoading}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            {isLoading ? (
                                <View style={[styles.modalButton, styles.loadingButton]}>
                                    <ActivityIndicator color="#fff" size="small" />
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.confirmButton]} 
                                    onPress={handleTokenSubmit}
                                >
                                    <Text style={styles.modalButtonText}>Submit</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    settingsButton: {
        position: 'absolute',
        right: 0,
        padding: 8,
    },
    settingsIcon: {
        fontSize: 16,
    },
    tokenButton: {
        marginTop: 20,
        backgroundColor: '#3498db',
    },
    continueButton: {
        marginTop: 20,
        backgroundColor: '#27ae60',
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
    openSettingsButton: {
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
    loadingButton: {
        backgroundColor: '#7f8c8d',
        marginLeft: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        minWidth: 100,
        alignItems: 'center',
    }
});

export default LoginScreen;
