require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;

// Initialize Firebase Admin using a service account JSON path or JSON blob
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    console.log('✅ Firebase Admin initialized with JSON from environment');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const path = require('path');
    const absolutePath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) 
      ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      : path.join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    console.log('Loading service account from:', absolutePath);
    const serviceAccount = require(absolutePath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✅ Firebase Admin initialized from file');
  } else {
    console.warn('⚠️  No Firebase service account configured. Admin SDK may fail.');
    admin.initializeApp();
  }
} catch (err) {
  console.error('❌ Failed to initialize firebase-admin:', err.message);
  // allow server to start but admin actions will fail
}

const QR_KEY = process.env.QR_SIGNING_KEY || 'dev-placeholder-key';
const ATTENDANCE_COLLECTION = process.env.ATTENDANCE_COLLECTION || 'attendance';

// Middleware: verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Bearer token' });
  const idToken = auth.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verify failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Root route (was previously 404). Provides basic service metadata instead of "Cannot GET /".
app.get('/', (req, res) => {
  res.json({
    name: 'GeoFence QR Backend',
    version: process.env.npm_package_version || '0.1.0',
    status: 'ok',
    time: new Date().toISOString(),
    endpoints: ['/','/health','/generate-qr','/verify-scan','/attendance/:sessionId'],
    docs: 'Add API docs route or README link here later'
  });
});

// Generate QR token (faculty only)
app.post('/generate-qr', verifyFirebaseToken, (req, res) => {
  const user = req.user;
  // enforce role claim (set custom claims in Firebase admin console or via server)
  if (!user || (user.role && user.role !== 'faculty' && !(user.firebase && user.firebase.sign_in_provider))) {
    // If role claim not present, reject. You should set custom claims for faculty users.
    if (user.role !== 'faculty') return res.status(403).json({ error: 'Forbidden: faculty only' });
  }

  const { sessionId, courseId, ttlSeconds = 120 } = req.body || {};
  if (!sessionId || !courseId) return res.status(400).json({ error: 'sessionId and courseId required' });

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sessionId,
    courseId,
    iat: now,
    exp: now + Number(ttlSeconds),
    issuer: 'geofence-qr-backend'
  };

  const token = jwt.sign(payload, QR_KEY, { algorithm: 'HS256' });
  return res.json({ qrToken: token });
});

// Verify scan
app.post('/verify-scan', verifyFirebaseToken, async (req, res) => {
  const { qrToken, lat, lng, timestamp, studentId } = req.body || {};
  
  console.log('Verify scan request:', { studentId, lat, lng, hasToken: !!qrToken });
  
  if (!qrToken || !studentId) {
    console.error('Missing required fields:', { qrToken: !!qrToken, studentId: !!studentId });
    return res.status(400).json({ error: 'qrToken and studentId required' });
  }

  try {
    // Verify and decode the QR token
    const decoded = jwt.verify(qrToken, QR_KEY);
    console.log('QR token decoded:', decoded);
    
    // Get class location from Firestore or use default campus location
    const db = admin.firestore();
    let classLat = 23.1765; // Default IIIT-NR campus latitude
    let classLng = 79.9855; // Default IIIT-NR campus longitude
    let radiusMeters = 100; // Default 100m radius
    
    // Try to get session data from Firestore
    try {
      const sessionDoc = await db.collection('sessions').doc(decoded.sessionId).get();
      if (sessionDoc.exists) {
        const session = sessionDoc.data();
        classLat = session.classLat || classLat;
        classLng = session.classLng || classLng;
        radiusMeters = session.radiusMeters || radiusMeters;
        console.log('Session found:', { classLat, classLng, radiusMeters });
      } else {
        console.log('Session not found, creating default session');
        // Create the session document if it doesn't exist
        await db.collection('sessions').doc(decoded.sessionId).set({
          sessionId: decoded.sessionId,
          courseId: decoded.courseId,
          classLat,
          classLng,
          radiusMeters,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error('Error fetching session:', err.message);
      // Continue with default location
    }

    // Validate geofence if location provided
    if (lat && lng) {
      const { isLocationValid } = require('./utils/geofence');
      const isInGeofence = isLocationValid(lat, lng, classLat, classLng, radiusMeters);
      
      console.log('Geofence check:', { 
        userLat: lat, 
        userLng: lng, 
        classLat, 
        classLng, 
        radiusMeters, 
        isInGeofence 
      });

      if (!isInGeofence) {
        return res.status(403).json({ 
          error: 'Location outside class area',
          details: 'You must be within the class location to mark attendance'
        });
      }
    } else {
      console.log('No location provided, skipping geofence check');
    }

    // Get student info from Firebase Auth
    let studentName = 'Unknown Student';
    let studentEmail = '';
    try {
      const userRecord = await admin.auth().getUser(studentId);
      studentName = userRecord.displayName || studentEmail || 'Student';
      studentEmail = userRecord.email || '';
      console.log('Student info:', { studentId, studentName, studentEmail });
    } catch (err) {
      console.error('Error fetching user info:', err.message);
    }

    // Record attendance to Firestore
    const attendanceDoc = {
      sessionId: decoded.sessionId,
      courseId: decoded.courseId,
      studentId,
      studentName,
      studentEmail,
      lat: lat || null,
      lng: lng || null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      recordedAt: new Date(),
    };

    try {
      const docRef = await db.collection(ATTENDANCE_COLLECTION).add(attendanceDoc);
      console.log('Attendance recorded:', docRef.id);
    } catch (err) {
      console.error('Failed to write attendance:', err.message);
      return res.status(500).json({ error: 'Failed to persist attendance' });
    }

    console.log('Attendance verification successful for:', studentName);
    return res.json({ 
      success: true, 
      session: decoded,
      message: 'Attendance recorded successfully'
    });
  } catch (err) {
    console.error('QR verify failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'QR code has expired. Please ask faculty to refresh.' });
    }
    return res.status(400).json({ error: 'Invalid or expired qrToken' });
  }
});

// Get attendance for a session (faculty only)
app.get('/attendance/:sessionId', verifyFirebaseToken, async (req, res) => {
  const { sessionId } = req.params;
  const user = req.user;
  
  // Check if user is faculty
  if (user.role !== 'faculty') {
    return res.status(403).json({ error: 'Forbidden: faculty only' });
  }
  
  try {
    const db = admin.firestore();
    const snapshot = await db.collection(ATTENDANCE_COLLECTION)
      .where('sessionId', '==', sessionId)
      .orderBy('recordedAt', 'desc')
      .get();
    
    const attendanceRecords = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      attendanceRecords.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        recordedAt: data.recordedAt?.toDate?.() || data.recordedAt,
      });
    });
    
    console.log(`Fetched ${attendanceRecords.length} attendance records for session ${sessionId}`);
    return res.json({ success: true, attendance: attendanceRecords });
  } catch (err) {
    console.error('Error fetching attendance:', err.message);
    return res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.listen(PORT, () => {
  console.log(`GeoFence QR backend listening on http://localhost:${PORT}`);
});
