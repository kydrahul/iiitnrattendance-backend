require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin using base64 encoded service account from env
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_JSON not found in .env file');
    process.exit(1);
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

// Create faculty and student roles
const setupRoles = async () => {
  try {
    // Create a faculty user (replace with actual faculty email)
    const facultyEmail = 'faculty@iiitnr.edu.in';
    const facultyPassword = 'Faculty@123'; // Change this immediately after first login
    
    let facultyUser;
    try {
      facultyUser = await admin.auth().getUserByEmail(facultyEmail);
    } catch {
      facultyUser = await admin.auth().createUser({
        email: facultyEmail,
        password: facultyPassword,
        displayName: 'Faculty Admin',
        emailVerified: true,
      });
    }

    // Set custom claims for faculty role
    await admin.auth().setCustomUserClaims(facultyUser.uid, {
      role: 'faculty'
    });

    console.log('Faculty user created/updated:', facultyEmail);
    console.log('Initial password (change this!):', facultyPassword);

    // Example student (you'll implement actual student registration in the app)
    const studentEmail = 'student@iiitnr.edu.in';
    const studentPassword = 'Student@123'; // Students will set their own passwords
    
    let studentUser;
    try {
      studentUser = await admin.auth().getUserByEmail(studentEmail);
    } catch {
      studentUser = await admin.auth().createUser({
        email: studentEmail,
        password: studentPassword,
        displayName: 'Test Student',
        emailVerified: true,
      });
    }

    await admin.auth().setCustomUserClaims(studentUser.uid, {
      role: 'student'
    });

    console.log('Test student created/updated:', studentEmail);
    console.log('Initial password (change this!):', studentPassword);

  } catch (error) {
    console.error('Error setting up authentication:', error);
  }
};

setupRoles().then(() => {
  console.log('Authentication setup complete');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});