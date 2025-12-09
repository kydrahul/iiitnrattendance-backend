// Test Firebase Auth login
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyD1TQ3HK2jRy73WizJsK6AXScQshslHvss',
  authDomain: 'iiitnr-attendence-app-f604e.firebaseapp.com',
  projectId: 'iiitnr-attendence-app-f604e',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLogin() {
  console.log('First, let\'s try to create the users...\n');
  
  const { createUserWithEmailAndPassword } = require('firebase/auth');
  
  // Try to create student
  try {
    const student = await createUserWithEmailAndPassword(
      auth,
      'student@iiitnr.edu.in',
      'Student@123'
    );
    console.log('✅ Student user created:', student.user.email);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Student user already exists');
    } else {
      console.error('❌ Failed to create student:', error.code, error.message);
    }
  }
  
  // Try to create faculty
  try {
    const faculty = await createUserWithEmailAndPassword(
      auth,
      'faculty@iiitnr.edu.in',
      'Faculty@123'
    );
    console.log('✅ Faculty user created:', faculty.user.email);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Faculty user already exists');
    } else {
      console.error('❌ Failed to create faculty:', error.code, error.message);
    }
  }
  
  console.log('\nNow testing login with student@iiitnr.edu.in...\n');
  
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'student@iiitnr.edu.in',
      'Student@123'
    );
    
    console.log('✅ Login successful!');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    console.log('Email verified:', userCredential.user.emailVerified);
    
    // Get ID token
    const token = await userCredential.user.getIdToken();
    console.log('\nID Token (first 50 chars):', token.substring(0, 50) + '...');
    
    console.log('\n🎉 You can now login with these credentials!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Login still failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    process.exit(1);
  }
}

testLogin();
