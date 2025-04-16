import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKx_O0Ql-ru5MpUI8HWlU9COsD_xGD4Vg",
  authDomain: "timekeepers-ec497.firebaseapp.com",
  projectId: "timekeepers-ec497",
  storageBucket: "timekeepers-ec497.firebasestorage.app",
  messagingSenderId: "521295009545",
  appId: "1:521295009545:web:b7c05b13948bb0cd3425d8",
  measurementId: "G-FKBZMS0XT1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 