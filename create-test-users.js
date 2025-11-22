// Simple script to create test users via Firebase Auth
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyD1TQ3HK2jRy73WizJsK6AXScQshslHvss',
  authDomain: 'iiitnr-attendence-app-f604e.firebaseapp.com',
  projectId: 'iiitnr-attendence-app-f604e',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createUsers() {
  try {
    // Create student user
    console.log('Creating student user...');
    const student = await createUserWithEmailAndPassword(
      auth,
      'student@iiitnr.edu.in',
      'Student@123'
    );
    console.log('✅ Student user created:', student.user.email);
    
    // Create faculty user
    console.log('Creating faculty user...');
    const faculty = await createUserWithEmailAndPassword(
      auth,
      'faculty@iiitnr.edu.in',
      'Faculty@123'
    );
    console.log('✅ Faculty user created:', faculty.user.email);
    
    console.log('\n🎉 All test users created successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Users already exist. You can log in with:');
      console.log('   Student: student@iiitnr.edu.in / Student@123');
      console.log('   Faculty: faculty@iiitnr.edu.in / Faculty@123');
    } else {
      console.error('❌ Error creating users:', error.message);
    }
    process.exit(0);
  }
}

createUsers();