// Create test faculty user in Firebase Auth
const admin = require('firebase-admin');
const serviceAccount = require('./iiitnr-attendence-app-f604e-firebase-adminsdk-fbsvc-e79f0f1be5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createFacultyUser() {
  try {
    // Create user in Firebase Auth
    const user = await admin.auth().createUser({
      email: 'faculty@iiitnr.edu.in',
      password: 'Faculty@123',
      displayName: 'Test Faculty',
      emailVerified: true
    });
    
    console.log('✅ Faculty user created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: Faculty@123');
    console.log('👤 UID:', user.uid);
    
    // Create faculty profile in Firestore
    const db = admin.firestore();
    await db.collection('faculty').doc(user.uid).set({
      userId: user.uid,
      email: user.email,
      name: 'Test Faculty',
      employeeId: 'FAC001',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Faculty profile created in Firestore');
    console.log('\n🎉 You can now login with:');
    console.log('   Email: faculty@iiitnr.edu.in');
    console.log('   Password: Faculty@123');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️  User already exists!');
      console.log('   Email: faculty@iiitnr.edu.in');
      console.log('   Password: Faculty@123');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createFacultyUser();
