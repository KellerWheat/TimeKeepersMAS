// index.tsx
import '@/src/utils/uuidPolyfill'; // Import polyfill at the app's entry point
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
