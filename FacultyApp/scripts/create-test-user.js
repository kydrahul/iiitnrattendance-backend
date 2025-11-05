const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyD1TQ3HK2jRy73WizJsK6AXScQshslHvss",
  authDomain: "iiitnr-attendence-app-f604e.firebaseapp.com",
  projectId: "iiitnr-attendence-app-f604e",
  storageBucket: "iiitnr-attendence-app-f604e.firebasestorage.app",
  messagingSenderId: "790561423093",
  appId: "1:790561423093:web:a3ee80a45ebe8419970fbc",
  measurementId: "G-F9MFKQYB8R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  try {
    const email = 'test.faculty@iiitnr.edu.in';
    const password = 'Test@123';

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user data to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: 'Test Faculty',
      email: email,
      role: 'faculty',
      department: 'Computer Science'
    });

    console.log('Test faculty account created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Test account already exists. You can use:');
      console.log('Email: test.faculty@iiitnr.edu.in');
      console.log('Password: Test@123');
    } else {
      console.error('Error creating test account:', error);
    }
  }
}

createTestUser();