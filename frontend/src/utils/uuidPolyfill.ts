// UUID polyfill for React Native
import 'react-native-get-random-values';

// This file simply needs to be imported before any uuid usage
// It adds the required crypto.getRandomValues() implementation
// through the react-native-get-random-values package 