import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1TQ3HK2jRy73WizJsK6AXScQshslHvss",
  authDomain: "iiitnr-attendence-app-f604e.firebaseapp.com",
  projectId: "iiitnr-attendence-app-f604e",
  storageBucket: "iiitnr-attendence-app-f604e.firebasestorage.app",
  messagingSenderId: "790561423093",
  appId: "1:790561423093:web:a3ee80a45ebe8419970fbc",
  measurementId: "G-F9MFKQYB8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;