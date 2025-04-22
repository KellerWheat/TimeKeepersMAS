import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id: string;
  // Add other user fields as needed
  [key: string]: any;
}

export const getUserData = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}; 