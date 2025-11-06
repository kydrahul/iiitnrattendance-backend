// Reset user passwords using Firebase Admin
const admin = require('firebase-admin');

// Use the service account file directly
const serviceAccount = require('./backup/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function resetPasswords() {
  console.log('Resetting passwords for test users...\n');
  
  const users = [
    { email: 'student@iiitnr.edu.in', password: 'Student@123', role: 'student' },
    { email: 'faculty@iiitnr.edu.in', password: 'Faculty@123', role: 'faculty' }
  ];
  
  for (const userData of users) {
    try {
      // Get user by email
      const user = await admin.auth().getUserByEmail(userData.email);
      
      // Update password
      await admin.auth().updateUser(user.uid, {
        password: userData.password,
        emailVerified: true
      });
      
      // Set custom claims
      await admin.auth().setCustomUserClaims(user.uid, {
        role: userData.role
      });
      
      console.log(`✅ Updated ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${userData.role}\n`);
      
    } catch (error) {
      console.error(`❌ Error updating ${userData.email}:`, error.message);
    }
  }
  
  console.log('🎉 Password reset complete!\n');
  console.log('You can now login with:');
  console.log('  Student: student@iiitnr.edu.in / Student@123');
  console.log('  Faculty: faculty@iiitnr.edu.in / Faculty@123');
  
  process.exit(0);
}

resetPasswords().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
