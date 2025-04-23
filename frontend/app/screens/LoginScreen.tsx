import React, { useState } from 'react';
import { useFonts, Inter_600SemiBold } from '@expo-google-fonts/inter';
import AppLoading from 'expo-app-loading';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { verifyCanvasToken } from '@/src/api/canvasApi';
import { useAppData } from '@/src/context/AppDataContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/navigation';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';

const CANVAS_SETTINGS_URL = 'https://gatech.instructure.com/profile/settings';

const LoginScreen = () => {
  const [tokenInputVisible, setTokenInputVisible] = useState(false);
  const [token, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openCanvasSettings = () => {
    Linking.openURL(CANVAS_SETTINGS_URL).catch(() => {
      Alert.alert('Error', 'Unable to open Canvas settings.');
    });
  };

  type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
const navigation = useNavigation<LoginScreenNavigationProp>();
const { setToken, updateData, updateMetrics } = useAppData();

const handleTokenSubmit = async () => {
  if (!token.trim()) {
    Alert.alert('Error', 'Please enter a valid Canvas token');
    return;
  }

  setIsLoading(true);

  try {
    const result = await verifyCanvasToken(token.trim());

    if (result.valid) {
      await AsyncStorage.setItem('canvas_access_token', token.trim());
      setToken(token.trim());
      updateData({ current_date: new Date() });

      if (result.userData) {
        updateMetrics({ userName: result.userData.name });
      }

      setTokenInputVisible(false);
      navigation.navigate('Courses');
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

  const [fontsLoaded] = useFonts({
    Inter_600SemiBold,
  });
  
  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.logoContainer}>
        <Feather name="clock" size={82} color="white" style={styles.logoIcon} />
        <Text style={styles.logo}>ChronoTask</Text>
      </View>



      <Text style={styles.subtitle}>Sign in to connect{'\n'}with Canvas</Text>
      <View style={styles.buttonSpacer} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setTokenInputVisible(true)}
      >
        <Text style={styles.primaryButtonText}>Sign in with Canvas</Text>
      </TouchableOpacity>

      <Modal visible={tokenInputVisible} transparent animationType="slide">
  <View style={styles.modalBackground}>
    <View style={styles.modalTitleBox}>
      <Text style={styles.modalTitleText}>Enter Canvas{'\n'}Access Token</Text>
    </View>
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionsBox}>
          <Text style={styles.instruction}>1. Tap Open Canvas Settings</Text>
          <Text style={styles.instruction}>2. Log in if prompted</Text>
          <Text style={styles.instruction}>3. Scroll to "Approved Integrations"</Text>
          <Text style={styles.instruction}>4. Tap "+ New Access Token"</Text>
          <Text style={styles.instruction}>5. Set purpose as "TimeKeepers"</Text>
          <Text style={styles.instruction}>6. Tap "Generate Token"</Text>
          <Text style={styles.instruction}>7. Paste your token below</Text>
        </View>

        <TouchableOpacity
  style={styles.openCanvasButton}
  onPress={openCanvasSettings}
  disabled={isLoading}
>
  <Text style={styles.openCanvasButtonText}>Open Canvas Settings</Text>
</TouchableOpacity>

<TextInput
  style={styles.tokenInput}
  placeholder="Access token"
  placeholderTextColor="#999"
  value={token}
  onChangeText={setTokenInput}
  editable={!isLoading}
/>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setTokenInputVisible(false)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleTokenSubmit}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 32,
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
  padding: 20,
  borderBottomLeftRadius: 16,
  borderBottomRightRadius: 16,
  width: '60%',
  maxWidth: 250,
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  },
  modalTitle: {
    color: '#070c15',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalTitleBox: {
    backgroundColor: '#070c15', 
  paddingTop: 20,
  paddingBottom: 12,
  paddingHorizontal: 24,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  width: '60%',
  maxWidth: 250,
  alignItems: 'center',
  zIndex: 2,
  },
  modalTitleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionsBox: {
    marginBottom: 16,
  },
  instruction: {
    color: '#1e293b',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  tokenInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  openCanvasButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  
  openCanvasButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  cancelButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonSpacer: {
    height: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -60,
  },
  logoIcon: {
    width: 80,
    height: 80,
    textAlign: 'center',
    marginBottom: 12,
  },
  clockIcon: {
    marginBottom: 8,
    transform: [{ scaleY: 1.2 }, { scaleX: 0.9 }],
  },
  
});

export default LoginScreen;
