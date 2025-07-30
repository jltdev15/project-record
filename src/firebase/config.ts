import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfT2B7Ai1qZh_Fi8ChWBMYtZG2aZVAFl0",
  authDomain: "project-rms-aa1fc.firebaseapp.com",
  databaseURL: "https://project-rms-aa1fc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-rms-aa1fc",
  storageBucket: "project-rms-aa1fc.firebasestorage.app",
  messagingSenderId: "256173777953",
  appId: "1:256173777953:web:1960ba5f2dd7e000892f60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app; 