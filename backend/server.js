// ============================================
// IIIT NR Attendance System - Backend Server
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Initialize Firebase Admin
const admin = require('firebase-admin');

// Use environment variable for Firebase credentials (for Render/production)
// or fall back to local service account file (for local development)
let serviceAccount;

console.log('🔍 Checking Firebase credentials...');
console.log('Environment variable FIREBASE_SERVICE_ACCOUNT_JSON exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
console.log('Environment variable length:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0);

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Production: Use service account from environment variable
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Using Firebase service account from environment variable');
    console.log('Project ID:', serviceAccount.project_id);
  } catch (error) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    console.error('First 100 chars:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.substring(0, 100));
    process.exit(1);
  }
} else {
  // Development: Use local service account file
  try {
    serviceAccount = require('./iiitnr-attendence-app-f604e-firebase-adminsdk-fbsvc-e79f0f1be5.json');
    console.log('✅ Using Firebase service account from local file');
  } catch (error) {
    console.error('❌ Firebase service account not found.');
    console.error('Please set FIREBASE_SERVICE_ACCOUNT_JSON environment variable in Render dashboard.');
    console.error('Or add the iiitnr-attendence-app-f604e-firebase-adminsdk-fbsvc-e79f0f1be5.json file locally.');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();
const auth = admin.auth();

// Safer Firestore writes: ignore undefined values globally as a fallback
db.settings({ ignoreUndefinedProperties: true });

// ============================================
// GEOFENCE CONFIGURATION
// ============================================

// College campus coordinates (IIITNR Academic Building)
const GEOFENCE_CONFIG = {
  latitude: parseFloat(process.env.COLLEGE_LATITUDE || '21.128471766438903'),
  longitude: parseFloat(process.env.COLLEGE_LONGITUDE || '81.76613230185365'),
  defaultRadius: parseInt(process.env.COLLEGE_GEOFENCE_RADIUS || '1200'), // meters
  minRadius: 15, // minimum allowed by faculty
  maxRadius: 1200 // maximum allowed by faculty
};

console.log('✅ Geofence configured:', {
  lat: GEOFENCE_CONFIG.latitude,
  lng: GEOFENCE_CONFIG.longitude,
  radius: GEOFENCE_CONFIG.defaultRadius
});

// Initialize Express
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
// CORS: Allow all origins for mobile app support
// Mobile apps don't send Origin header, so we need to allow all
app.use(cors({
  origin: true, // Allow all origins (needed for mobile apps)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id']
}));
app.use(compression());
app.use(express.json({ limit: '1mb' })); // Add size limit
app.use(morgan('dev'));

// ============================================
// IN-MEMORY CACHE IMPLEMENTATION
// ============================================

// Simple LRU cache (no external dependencies needed)
class SimpleCache {
  constructor(maxSize = 1000, ttl = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // 1 hour default
  }

  set(key, value) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: `${((this.cache.size / this.maxSize) * 100).toFixed(1)}%`
    };
  }
}

// Initialize caches
const studentCache = new SimpleCache(500, 3600000); // 500 students, 1 hour TTL
const courseCache = new SimpleCache(200, 3600000); // 200 courses, 1 hour TTL
const facultyCache = new SimpleCache(100, 3600000); // 100 faculty, 1 hour TTL

console.log('✅ In-memory cache initialized');

// Cache invalidation helpers
function invalidateStudentCache(studentId) {
  studentCache.invalidate(`student:${studentId}`);
  studentCache.invalidate(`dashboard:${studentId}`);
  studentCache.invalidate(`timetable:${studentId}`);
}

function invalidateCourseCache(courseId) {
  courseCache.invalidate(`course:${courseId}`);
  // Invalidate all student dashboards (they might have this course)
  studentCache.invalidate('dashboard:');
  studentCache.invalidate('timetable:');
}

// ============================================
// RATE LIMITING (In-Memory)
// ============================================

const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const record = requestCounts.get(ip);

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
}

// Apply rate limiting to API routes
app.use('/api/', rateLimiter);

// Clean up old rate limit records every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

console.log('✅ Rate limiting enabled (100 req/15min per IP)');


// ============================================
// UTILITY FUNCTIONS
// ============================================

// Calculate distance between two coordinates using Haversine formula (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Remove keys with undefined values (Firestore doesn't allow undefined)
function cleanObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// Generate secure QR payload with signature
function generateQRPayload(sessionId, courseId, facultyId, location, expiresIn = 300000) {
  const timestamp = Date.now();
  const expiresAt = timestamp + expiresIn; // Default 5 minutes

  return {
    sessionId,
    courseId,
    facultyId,
    timestamp,
    expiresAt,
    location,
    signature: Buffer.from(`${sessionId}-${timestamp}-${process.env.QR_SECRET || 'fallback-secret'}`).toString('base64')
  };
}

// Verify QR signature
function verifyQRSignature(payload) {
  const expectedSignature = Buffer.from(`${payload.sessionId}-${payload.timestamp}-${process.env.QR_SECRET || 'fallback-secret'}`).toString('base64');
  return payload.signature === expectedSignature;
}

// Middleware to verify Firebase Auth token
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    // Provide clearer error reasons for common cases
    if (error?.errorInfo?.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again to get a fresh token.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to verify device binding
async function verifyDeviceBinding(req, res, next) {
  const deviceId = req.headers['x-device-id'];
  const userId = req.user.uid;

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID required' });
  }

  try {
    // Check cache first
    const cacheKey = `student:${userId}`;
    let student = studentCache.get(cacheKey);

    if (!student) {
      const studentDoc = await db.collection('students').doc(userId).get();

      if (!studentDoc.exists) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      student = studentDoc.data();
      studentCache.set(cacheKey, student);
    }

    // Check if device is bound and matches
    if (student.deviceId && student.deviceId !== deviceId) {
      console.log(`❌ Device mismatch for ${userId}: expected ${student.deviceId}, got ${deviceId}`);
      return res.status(403).json({
        error: 'Device not authorized',
        message: 'This account is bound to a different device. Please contact your administrator.',
        boundDevice: student.deviceId,
        currentDevice: deviceId
      });
    }

    next();
  } catch (error) {
    console.error('Device verification error:', error);
    res.status(500).json({ error: 'Device verification failed' });
  }
}


// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cache statistics endpoint (for monitoring)
app.get('/api/cache/stats', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      caches: {
        students: studentCache.getStats(),
        courses: courseCache.getStats(),
        faculty: facultyCache.getStats()
      },
      rateLimiting: {
        activeIPs: requestCounts.size
      }
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});

// ============================================
// STUDENT ROUTES
// ============================================

// Create/Update Student Profile
app.post('/api/student/profile', verifyToken, async (req, res) => {
  try {
    // Support both our original keys and the ones used in the guide
    const {
      name,
      rollNo,
      rollNumber,
      programId,
      year,
      batch,
      semester,
      department,
      email: emailFromBody,
      mobile,
      mobileNumber,
      passingYear,
      passingOutYear,
      branch,
      deviceId
    } = req.body;
    const userId = req.user.uid;

    // Validate device ID
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    // Get existing student data
    const studentDoc = await db.collection('students').doc(userId).get();

    if (studentDoc.exists) {
      const existingData = studentDoc.data();

      // Check if device is already bound to a different device
      if (existingData.deviceId && existingData.deviceId !== deviceId) {
        console.log(`❌ Device binding conflict for ${userId}: existing ${existingData.deviceId}, new ${deviceId}`);
        return res.status(403).json({
          error: 'Device mismatch',
          message: 'This account is already bound to another device. Please contact your administrator to unbind your previous device.',
          boundDevice: existingData.deviceId,
          currentDevice: deviceId
        });
      }
    }

    const studentData = cleanObject({
      userId,
      email: req.user.email || emailFromBody,
      name,
      rollNo: rollNo || rollNumber,
      programId,
      year,
      batch,
      semester,
      department: department || branch,
      mobile: mobile || mobileNumber,
      passingYear: passingYear || passingOutYear,
      deviceId, // Store device ID
      deviceBoundAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('students').doc(userId).set(studentData, { merge: true });

    // Invalidate cache when profile is updated
    invalidateStudentCache(userId);

    console.log(`✅ Device bound for ${userId}: ${deviceId}`);

    res.json({ success: true, student: studentData });
  } catch (error) {
    console.error('Error creating student profile:', error);
    res.status(500).json({ error: 'Failed to create student profile' });
  }
});

// Get Student Profile
app.get('/api/student/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Check cache first (unless nocache is requested)
    const { nocache } = req.query;

    if (nocache !== 'true') {
      const cacheKey = `student:${userId}`;
      const cached = studentCache.get(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit: profile for ${userId}`);
        return res.json({ success: true, student: cached });
      }
    }

    console.log(`👤 Fetching profile for ${userId} (Cache skipped: ${nocache === 'true'})`);

    // Get student data from Firestore
    const studentDoc = await db.collection('students').doc(userId).get();

    if (!studentDoc.exists) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please complete your profile setup'
      });
    }

    const student = studentDoc.data();

    // Cache the result
    studentCache.set(cacheKey, student);

    res.json({ success: true, student });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      error: 'Failed to fetch student profile',
      details: error.message // Expose error details for debugging
    });
  }
});

// Get Student Dashboard (today's classes & attendance stats) - OPTIMIZED
app.get('/api/student/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Check cache first
    const cacheKey = `dashboard:${userId}`;
    const cached = studentCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: dashboard for ${userId}`);
      return res.json(cached);
    }

    console.log(`📊 Cache miss: fetching dashboard for ${userId}`);

    // Get student data
    const studentDoc = await db.collection('students').doc(userId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student = studentDoc.data();

    // Get enrolled courses (single query)
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().courseId);

    // OPTIMIZED: Batch read courses instead of loop
    const courses = [];
    if (courseIds.length > 0) {
      const courseRefs = courseIds.map(id => db.collection('courses').doc(id));
      const courseDocs = await db.getAll(...courseRefs);

      for (const courseDoc of courseDocs) {
        if (courseDoc.exists) {
          courses.push({ id: courseDoc.id, ...courseDoc.data() });
        }
      }
    }

    // Get today's sessions (optimized with single query)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let sessions = [];
    if (courseIds.length > 0) {
      // Firestore 'in' query supports max 10 items
      const courseIdBatches = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        courseIdBatches.push(courseIds.slice(i, i + 10));
      }

      for (const batch of courseIdBatches) {
        const sessionsSnapshot = await db.collection('sessions')
          .where('courseId', 'in', batch)
          .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
          .where('date', '<', admin.firestore.Timestamp.fromDate(tomorrow))
          .get();

        sessions.push(...sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }

    // Get attendance stats (single query)
    const attendanceSnapshot = await db.collection('attendance')
      .where('studentId', '==', userId)
      .get();

    const totalClasses = attendanceSnapshot.size;
    const presentCount = attendanceSnapshot.docs.filter(doc => doc.data().status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    const result = {
      student,
      courses,
      todaySessions: sessions,
      stats: {
        totalClasses,
        presentCount,
        absentCount: totalClasses - presentCount,
        attendancePercentage: attendancePercentage.toFixed(1)
      }
    };

    // Cache for 5 minutes (shorter TTL for dashboard)
    const dashboardCache = new SimpleCache(500, 300000); // 5 minutes
    dashboardCache.set(cacheKey, result);
    studentCache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Scan QR and Mark Attendance - OPTIMIZED with Denormalization
// Scan QR and Mark Attendance - OPTIMIZED with Denormalization
app.post('/api/student/scan-qr', verifyToken, async (req, res) => {
  try {
    const { qrData, latitude, longitude, accuracy } = req.body;
    const userId = req.user.uid;

    // Parse QR data
    let payload;
    try {
      payload = JSON.parse(qrData);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    // Verify QR signature
    if (!verifyQRSignature(payload)) {
      return res.status(400).json({ error: 'Invalid QR signature' });
    }

    // Check if QR is expired (with 30s grace period for network/processing latency)
    const GRACE_PERIOD_MS = 30 * 1000;
    if (Date.now() > (payload.expiresAt + GRACE_PERIOD_MS)) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // NEW: Check if QR is the LATEST version (if versioning is used)
    // Relaxed version check: Allow previous version if within grace period overlap
    if (payload.qrVersion) {
      const activeQRDoc = await db.collection('activeQRs').doc(payload.sessionId).get();
      if (activeQRDoc.exists) {
        const activeQR = activeQRDoc.data();
        // Only enforce strict version mismatch if significantly past the expected expiration
        // This allows a "just expired" QR to still work if the student scanned it right as it changed
        if (activeQR.qrVersion && payload.qrVersion !== activeQR.qrVersion && Date.now() > (payload.expiresAt + GRACE_PERIOD_MS)) {
          return res.status(400).json({ error: 'QR code has expired (new QR available)' });
        }
      }
    }

    // Get session details
    const sessionDoc = await db.collection('sessions').doc(payload.sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionDoc.data();

    // Verify student is enrolled in this course
    const enrollmentSnapshot = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .where('courseId', '==', payload.courseId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (enrollmentSnapshot.empty) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check existing attendance
    const attendanceSnapshot = await db.collection('attendance')
      .where('sessionId', '==', payload.sessionId)
      .where('studentId', '==', userId)
      .limit(1)
      .get();

    let attendanceRef;
    let isNew = false;

    if (!attendanceSnapshot.empty) {
      // HANDLE DUPLICATES: If multiple records exist, keep one and delete others
      if (attendanceSnapshot.size > 1) {
        console.warn(`[DUPLICATE FIX] Found ${attendanceSnapshot.size} records for session ${payload.sessionId} student ${userId}. Cleaning up.`);
        const docs = attendanceSnapshot.docs;
        // Sort by 'present' status first, then last modified? 
        // Simple heuristic: Keep the one that is 'present' if any, otherwise the first one.

        let targetDoc = docs.find(d => d.data().status === 'present') || docs[0];
        attendanceRef = targetDoc.ref;

        // Delete others
        const batch = db.batch();
        docs.forEach(d => {
          if (d.id !== targetDoc.id) {
            batch.delete(d.ref);
          }
        });
        await batch.commit();
      } else {
        const attendanceDoc = attendanceSnapshot.docs[0];
        attendanceRef = attendanceDoc.ref;
      }

      const currentData = (await attendanceRef.get()).data();
      if (currentData.status === 'present') {
        return res.status(400).json({ error: 'Attendance already marked for this session' });
      }

    } else {
      // Fallback: Create new with DETERMINISTIC ID to prevent race conditions
      // ID format: sessionId_studentId
      attendanceRef = db.collection('attendance').doc(`${payload.sessionId}_${userId}`);
      isNew = true;
    }

    // Verify geolocation if required
    let locationVerified = true;
    let distanceFromClass = 0;

    if (payload.location && latitude && longitude) {
      distanceFromClass = calculateDistance(
        latitude,
        longitude,
        payload.location.latitude,
        payload.location.longitude
      );

      const maxDistance = payload.location.radius || 1100; // Default 1100 meters
      locationVerified = distanceFromClass <= maxDistance;

      if (!locationVerified) {
        return res.status(400).json({
          error: `You are too far from class location (${Math.round(distanceFromClass)}m away, max ${maxDistance}m allowed)`,
          distance: Math.round(distanceFromClass),
          maxDistance
        });
      }
    }

    // OPTIMIZED: Get student name with cache
    let studentName = 'Unknown';
    let studentRollNo = 'N/A';
    const cachedStudent = studentCache.get(`student:${userId}`);

    if (cachedStudent) {
      studentName = cachedStudent.name || 'Unknown';
      studentRollNo = cachedStudent.rollNo || 'N/A';
    } else {
      const studentDoc = await db.collection('students').doc(userId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        studentName = studentData.name || 'Unknown';
        studentRollNo = studentData.rollNo || 'N/A';
        studentCache.set(`student:${userId}`, studentData);
      }
    }

    // Update Data
    const updateData = {
      status: 'present',
      markedAt: admin.firestore.FieldValue.serverTimestamp(),
      markedBy: 'student',
      locationVerified,
      studentLatitude: latitude || null,
      studentLongitude: longitude || null,
      distanceFromClass: Math.round(distanceFromClass),
      accuracy: accuracy || null,
      qrTimestamp: payload.timestamp,
      deviceId: req.headers['x-device-id'] || 'unknown',
      qrVersion: payload.qrVersion || null
    };

    if (isNew) {
      // Denormalize student and course info in attendance record
      const attendanceData = {
        sessionId: payload.sessionId,
        courseId: payload.courseId,
        studentId: userId,
        studentName,
        studentRollNo,
        courseName: session.courseName || 'Unknown',
        courseCode: session.courseCode || 'N/A',
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await attendanceRef.set(attendanceData);
    } else {
      await attendanceRef.update(updateData);
    }

    // Update session present count
    await db.collection('sessions').doc(payload.sessionId).update({
      presentCount: admin.firestore.FieldValue.increment(1)
    });

    // Invalidate dashboard cache
    invalidateStudentCache(userId);

    res.json({
      success: true,
      message: 'Attendance marked successfully!',
      attendance: {
        id: attendanceRef.id,
        status: 'present',
        distance: Math.round(distanceFromClass)
      }
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get Student Attendance History - OPTIMIZED with Pagination
app.get('/api/student/attendance-history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { courseId, limit = 50, offset = 0 } = req.query;

    let query = db.collection('attendance').where('studentId', '==', userId);

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    // OPTIMIZED: Add pagination
    const snapshot = await query
      .orderBy('markedAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    // OPTIMIZED: Use denormalized data (no additional reads needed!)
    const attendanceRecords = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // These are now denormalized in the document
        sessionDate: data.markedAt,
        sessionTime: data.markedAt,
        courseName: data.courseName || 'Unknown',
        courseCode: data.courseCode || 'N/A',
        studentName: data.studentName || 'Unknown',
        studentRollNo: data.studentRollNo || 'N/A'
      };
    });

    res.json({
      attendanceRecords,
      hasMore: snapshot.size === parseInt(limit),
      total: snapshot.size
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// Verify Location (Pre-check before QR scanning)
app.post('/api/student/verify-location', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user.uid;

    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Calculate distance from campus
    const distanceFromCampus = calculateDistance(
      latitude,
      longitude,
      GEOFENCE_CONFIG.latitude,
      GEOFENCE_CONFIG.longitude
    );

    const maxDistance = GEOFENCE_CONFIG.defaultRadius;
    const isValid = distanceFromCampus <= maxDistance;

    // Create expiry time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (!isValid) {
      return res.status(403).json({
        success: false,
        valid: false,
        error: `You are too far from campus (${Math.round(distanceFromCampus)}m away, max ${maxDistance}m allowed)`,
        distance: Math.round(distanceFromCampus),
        maxDistance,
        accuracy: accuracy || null
      });
    }

    // Log successful verification
    console.log(`✅ Location verified for ${userId}: ${Math.round(distanceFromCampus)}m from campus`);

    res.json({
      success: true,
      valid: true,
      message: 'Location verified successfully',
      distance: Math.round(distanceFromCampus),
      maxDistance,
      accuracy: accuracy || null,
      expiresAt: expiresAt.toISOString(),
      validFor: '1 hour'
    });
  } catch (error) {
    console.error('Error verifying location:', error);
    res.status(500).json({ error: 'Failed to verify location' });
  }
});

// Join Course via Join Code
app.post('/api/student/join-course', verifyToken, async (req, res) => {
  try {
    const { joinCode } = req.body;
    const userId = req.user.uid;

    if (!joinCode) {
      return res.status(400).json({ error: 'Join code is required' });
    }

    // Find course by join code
    const coursesSnapshot = await db.collection('courses')
      .where('joinCode', '==', joinCode.toUpperCase())
      .limit(1)
      .get();

    if (coursesSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid join code' });
    }

    const courseDoc = coursesSnapshot.docs[0];
    const courseId = courseDoc.id;
    const course = courseDoc.data();

    // Check if already enrolled
    const existingEnrollment = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollmentData = {
      studentId: userId,
      courseId,
      isActive: true,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('enrollments').add(enrollmentData);

    // Update enrolled count
    await db.collection('courses').doc(courseId).update({
      enrolledCount: admin.firestore.FieldValue.increment(1)
    });

    // Invalidate cache
    invalidateStudentCache(userId);

    res.json({
      success: true,
      message: 'Successfully joined course',
      course: { id: courseId, ...course }
    });
  } catch (error) {
    console.error('Error joining course:', error);
    res.status(500).json({ error: 'Failed to join course' });
  }
});

// Get Student's Enrolled Courses - OPTIMIZED with Batch Reads
app.get('/api/student/courses', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get enrollments
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const courses = [];
    const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().courseId);

    // OPTIMIZED: Batch read courses
    if (courseIds.length > 0) {
      const courseRefs = courseIds.map(id => db.collection('courses').doc(id));
      const courseDocs = await db.getAll(...courseRefs);

      // Collect unique faculty IDs
      const facultyIds = [...new Set(
        courseDocs
          .filter(doc => doc.exists && doc.data().facultyId)
          .map(doc => doc.data().facultyId)
      )];

      // OPTIMIZED: Batch read faculty
      const facultyMap = new Map();
      if (facultyIds.length > 0) {
        const facultyRefs = facultyIds.map(id => db.collection('faculty').doc(id));
        const facultyDocs = await db.getAll(...facultyRefs);

        facultyDocs.forEach(doc => {
          if (doc.exists) {
            facultyMap.set(doc.id, doc.data());
            // Cache faculty data
            facultyCache.set(`faculty:${doc.id}`, doc.data());
          }
        });
      }

      // Get attendance stats for all courses
      const attendanceSnapshot = await db.collection('attendance')
        .where('studentId', '==', userId)
        .where('courseId', 'in', courseIds.slice(0, 10)) // Firestore 'in' limit is 10
        .get();

      // Build attendance map by courseId
      const attendanceMap = new Map();
      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const courseId = data.courseId;

        if (!attendanceMap.has(courseId)) {
          attendanceMap.set(courseId, { total: 0, present: 0, absent: 0 });
        }
        const stats = attendanceMap.get(courseId);
        stats.total++;
        if (data.status === 'present') {
          stats.present++;
        } else {
          stats.absent++;
        }
      });

      // If more than 10 courses, fetch remaining attendance in batches
      if (courseIds.length > 10) {
        for (let i = 10; i < courseIds.length; i += 10) {
          const batch = courseIds.slice(i, i + 10);
          const batchSnapshot = await db.collection('attendance')
            .where('studentId', '==', userId)
            .where('courseId', 'in', batch)
            .get();

          batchSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const courseId = data.courseId;
            if (!attendanceMap.has(courseId)) {
              attendanceMap.set(courseId, { total: 0, present: 0, absent: 0 });
            }
            const stats = attendanceMap.get(courseId);
            stats.total++;
            if (data.status === 'present') {
              stats.present++;
            } else {
              stats.absent++;
            }
          });
        }
      }

      // Get sessions for all courses to calculate accurate percentage (Total Sessions vs Present)
      const sessionCounts = new Map();
      if (courseIds.length > 0) {
        // Fetch all sessions for these courses
        // We do this in batches of 10
        for (let i = 0; i < courseIds.length; i += 10) {
          const batch = courseIds.slice(i, i + 10);
          const sessionsSnapshot = await db.collection('sessions')
            .where('courseId', 'in', batch)
            // Only count past/current sessions, not future ones
            .where('date', '<=', admin.firestore.Timestamp.now())
            .get();

          sessionsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const courseId = data.courseId;
            sessionCounts.set(courseId, (sessionCounts.get(courseId) || 0) + 1);
          });
        }
      }

      // Combine data with attendance stats and faculty contact
      courseDocs.forEach((courseDoc, index) => {
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          const facultyData = facultyMap.get(courseData.facultyId);
          const attendanceStats = attendanceMap.get(courseDoc.id) || { total: 0, present: 0, absent: 0 };

          // Use actual session count from sessions collection
          const totalSessions = sessionCounts.get(courseDoc.id) || 0;
          const attended = attendanceStats.present;
          const missed = totalSessions - attended; // Derived missed count

          // Calculate attendance percentage based on Total Sessions
          const attendancePercentage = totalSessions > 0
            ? Math.round((attended / totalSessions) * 100)
            : 0;

          courses.push({
            id: courseDoc.id,
            ...courseData,
            facultyName: facultyData?.name || 'Unknown',
            enrolledDate: enrollmentsSnapshot.docs[index].data().enrolledAt,
            // Add attendance statistics
            totalClasses: totalSessions, // Updated to use actual session count
            attended: attended,
            missed: missed > 0 ? missed : 0,
            attendance: attendancePercentage,
            // Add faculty contact information
            contact: {
              email: facultyData?.email || 'N/A',
              phone: facultyData?.mobile || facultyData?.phone || 'N/A'
            }
          });
        }
      });
    }

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get Student Timetable (aggregated from all courses) - OPTIMIZED
app.get('/api/student/timetable', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Check cache
    const cacheKey = `timetable:${userId}`;
    const cached = studentCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: timetable for ${userId}`);
      return res.json(cached);
    }

    console.log(`📅 Cache miss: fetching timetable for ${userId}`);

    // Get enrolled courses
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const timetable = {
      Monday: [], Tuesday: [], Wednesday: [],
      Thursday: [], Friday: [], Saturday: []
    };

    const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().courseId);

    // OPTIMIZED: Batch read courses
    if (courseIds.length > 0) {
      const courseRefs = courseIds.map(id => db.collection('courses').doc(id));
      const courseDocs = await db.getAll(...courseRefs);

      // Collect faculty IDs
      const facultyIds = [...new Set(
        courseDocs
          .filter(doc => doc.exists && doc.data().facultyId)
          .map(doc => doc.data().facultyId)
      )];

      // OPTIMIZED: Batch read faculty
      const facultyMap = new Map();
      if (facultyIds.length > 0) {
        const facultyRefs = facultyIds.map(id => db.collection('faculty').doc(id));
        const facultyDocs = await db.getAll(...facultyRefs);

        facultyDocs.forEach(doc => {
          if (doc.exists) {
            facultyMap.set(doc.id, doc.data());
          }
        });
      }

      // Get attendance stats for all courses
      const attendanceSnapshot = await db.collection('attendance')
        .where('studentId', '==', userId)
        .where('courseId', 'in', courseIds.slice(0, 10)) // Firestore 'in' limit is 10
        .get();

      // Build attendance map by courseId
      const attendanceMap = new Map();
      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const courseId = data.courseId;

        if (!attendanceMap.has(courseId)) {
          attendanceMap.set(courseId, { total: 0, present: 0 });
        }
        const stats = attendanceMap.get(courseId);
        stats.total++;
        if (data.status === 'present') {
          stats.present++;
        }
      });

      // If more than 10 courses, fetch remaining attendance in batches
      if (courseIds.length > 10) {
        for (let i = 10; i < courseIds.length; i += 10) {
          const batch = courseIds.slice(i, i + 10);
          const batchSnapshot = await db.collection('attendance')
            .where('studentId', '==', userId)
            .where('courseId', 'in', batch)
            .get();

          batchSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const courseId = data.courseId;

            if (!attendanceMap.has(courseId)) {
              attendanceMap.set(courseId, { total: 0, present: 0 });
            }
            const stats = attendanceMap.get(courseId);
            stats.total++;
            if (data.status === 'present') {
              stats.present++;
            }
          });
        }
      }

      // Get sessions for all courses to calculate accurate percentage
      const sessionCounts = new Map();
      const uniqueCourseIds = [...new Set(courseIds)];
      if (uniqueCourseIds.length > 0) {
        const sessionBatches = [];
        for (let i = 0; i < uniqueCourseIds.length; i += 10) {
          sessionBatches.push(uniqueCourseIds.slice(i, i + 10));
        }

        for (const batch of sessionBatches) {
          const sessionsSnapshot = await db.collection('sessions')
            .where('courseId', 'in', batch)
            .where('date', '<=', admin.firestore.Timestamp.now())
            .get();

          sessionsSnapshot.docs.forEach(doc => {
            const cid = doc.data().courseId;
            sessionCounts.set(cid, (sessionCounts.get(cid) || 0) + 1);
          });
        }
      }

      // Build timetable
      courseDocs.forEach(courseDoc => {
        if (courseDoc.exists) {
          const course = courseDoc.data();
          const facultyData = facultyMap.get(course.facultyId);

          // Calculate attendance percentage for this course
          const stats = attendanceMap.get(courseDoc.id) || { total: 0, present: 0 };
          const totalSessions = sessionCounts.get(courseDoc.id) || 0;

          const attendancePercentage = totalSessions > 0
            ? Math.round((stats.present / totalSessions) * 100)
            : 0;

          if (Array.isArray(course.timetable)) {
            course.timetable.forEach(slot => {
              if (timetable[slot.day]) {
                timetable[slot.day].push({
                  time: slot.time,
                  courseId: courseDoc.id, // Added courseId for redirection
                  courseCode: course.code,
                  courseName: course.name,
                  type: slot.type,
                  room: slot.room,
                  facultyName: facultyData?.name || 'Unknown',
                  attendance: attendancePercentage // Added attendance percentage
                });
              }
            });
          }
        }
      });

    }

    // Sort each day's slots by time
    Object.keys(timetable).forEach(day => {
      timetable[day].sort((a, b) => {
        const timeA = a.time.split(' - ')[0];
        const timeB = b.time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
    });

    const result = { success: true, timetable };

    // Cache for 1 hour
    studentCache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});


// ============================================
// FACULTY ROUTES
// ============================================

// ============================================================================
// FACULTY PROFILE ENDPOINTS
// ============================================================================

// Get Faculty Profile
app.get('/api/faculty/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const facultyDoc = await db.collection('faculty').doc(userId).get();

    if (!facultyDoc.exists) {
      return res.json({ success: true, faculty: null });
    }

    res.json({ success: true, faculty: facultyDoc.data() });
  } catch (error) {
    console.error('Error fetching faculty profile:', error);
    res.status(500).json({ error: 'Failed to fetch faculty profile' });
  }
});

// Create/Update Faculty Profile
app.post('/api/faculty/profile', verifyToken, async (req, res) => {
  try {
    // Accept both minimal and detailed payloads
    const {
      name,
      employeeId,
      designation,
      department,
      specialization,
      email: emailFromBody,
      phone,
      mobile
    } = req.body;
    const userId = req.user.uid;

    const facultyData = cleanObject({
      userId,
      email: req.user.email || emailFromBody,
      name,
      employeeId,
      designation,
      department,
      specialization,
      phone,
      mobile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('faculty').doc(userId).set(facultyData, { merge: true });

    res.json({ success: true, faculty: facultyData });
  } catch (error) {
    console.error('Error creating faculty profile:', error);
    res.status(500).json({ error: 'Failed to create faculty profile' });
  }
});

// Create Course
app.post('/api/faculty/courses', verifyToken, async (req, res) => {
  try {
    const { code, name, credits, semester, department, academicYear } = req.body;
    const facultyId = req.user.uid;

    // Basic validation to give user-friendly 400 instead of 500
    if (!code || !name || !department) {
      return res.status(400).json({ error: 'Missing required fields: code, name, department' });
    }

    // Auto-create/update faculty profile if it doesn't exist
    // This ensures faculty data is available for Student App
    const facultyDoc = await db.collection('faculty').doc(facultyId).get();
    if (!facultyDoc.exists) {
      console.log(`📝 Auto-creating faculty profile for ${facultyId}`);
      const facultyData = cleanObject({
        userId: facultyId,
        email: req.user.email,
        name: req.user.name || req.user.displayName || req.user.email?.split('@')[0] || 'Faculty',
        department,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await db.collection('faculty').doc(facultyId).set(facultyData, { merge: true });
      console.log(`✅ Faculty profile created for ${facultyId}: ${facultyData.name}`);
    }

    const courseData = cleanObject({
      code,
      name,
      credits, // optional
      semester,
      department,
      academicYear, // optional, used by guide
      facultyId,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const courseRef = await db.collection('courses').add(courseData);

    res.json({ success: true, courseId: courseRef.id, course: { id: courseRef.id, ...courseData } });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// List Courses for faculty
app.get('/api/faculty/courses', verifyToken, async (req, res) => {
  try {
    const facultyId = req.user.uid;
    const snapshot = await db.collection('courses')
      .where('facultyId', '==', facultyId)
      .get();

    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error listing courses:', error);
    res.status(500).json({ error: 'Failed to list courses' });
  }
});

// Create full class (course + timetable + roster import)
app.post('/api/faculty/classes/full', verifyToken, async (req, res) => {
  try {
    const facultyId = req.user.uid;
    const {
      branch, // department
      year, // academicYear
      courseName,
      courseCode,
      className,
      section = 'A',
      timetable = [], // Array<{ day, time, type, room? }>
      credits,
      semester,
      session
    } = req.body || {};

    if (!branch || !year || !courseName || !courseCode) {
      return res.status(400).json({ error: 'branch, year, courseName, courseCode are required' });
    }

    // Generate unique 6-character join code
    function generateJoinCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing chars
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    let joinCode = generateJoinCode();
    // Ensure uniqueness
    let existing = await db.collection('courses').where('joinCode', '==', joinCode).limit(1).get();
    while (!existing.empty) {
      joinCode = generateJoinCode();
      existing = await db.collection('courses').where('joinCode', '==', joinCode).limit(1).get();
    }

    // Create course with embedded timetable and join code
    const courseData = cleanObject({
      code: courseCode,
      name: courseName,
      department: branch,
      academicYear: year,
      className: className || `${branch}${year}`,
      section,
      joinCode,
      facultyId,
      isActive: true,
      timetable: Array.isArray(timetable) ? timetable : [],
      enrolledCount: 0,
      credits: credits || 3,
      semester: semester || '',
      session: session || 'Spring',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const courseRef = await db.collection('courses').add(courseData);

    const created = { id: courseRef.id, ...courseData };
    res.json({ success: true, course: created });
  } catch (error) {
    console.error('Error creating full class:', error);
    res.status(500).json({ error: 'Failed to create full class' });
  }
});

// Delete a course
app.delete('/api/faculty/courses/:courseId', verifyToken, async (req, res) => {
  try {
    const facultyId = req.user.uid;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Check if course exists and belongs to faculty
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = courseDoc.data();
    if (courseData.facultyId !== facultyId) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    // Delete the course
    await db.collection('courses').doc(courseId).delete();

    const studentEmail = req.body.studentEmail || req.body.studentId || req.body.email;

    if (!courseId || !studentEmail) {
      return res.status(400).json({ error: 'courseId and student email are required' });
    }

    // Find student by email
    const studentSnapshot = await db.collection('students')
      .where('email', '==', studentEmail)
      .limit(1)
      .get();

    if (studentSnapshot.empty) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentDoc = studentSnapshot.docs[0];
    const studentId = studentDoc.id;

    // Check if already enrolled
    const existingEnrollment = await db.collection('enrollments')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }

    // Enroll student
    const enrollmentData = {
      studentId,
      courseId,
      isActive: true,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('enrollments').add(enrollmentData);

    res.json({ success: true, message: 'Student enrolled successfully' });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// Generate QR Code for Session
// Generate QR Code for Session (Start Session)
app.post('/api/faculty/generate-qr', verifyToken, async (req, res) => {
  try {
    // Accept both old keys and the ones in the guide
    const courseId = req.body.courseId;
    const roomNumber = req.body.roomNumber;
    const location = req.body.location || {};
    const latitude = req.body.latitude ?? location.latitude;
    const longitude = req.body.longitude ?? location.longitude;
    const radius = req.body.radius ?? req.body.geofenceRadius ?? (location.radius ?? 50);
    const validitySeconds = req.body.validitySeconds ?? 5; // Default 5 seconds for auto-refresh
    const classType = req.body.classType || 'Theory';
    const facultyId = req.user.uid;

    // Validate required inputs early with clear message
    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'location.latitude and location.longitude are required' });
    }

    // Verify faculty teaches this course
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseDoc.data();
    if (course.facultyId !== facultyId) {
      return res.status(403).json({ error: 'You are not authorized to create sessions for this course' });
    }

    // Find matching timetable slot to use scheduled time if possible
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const today = days[now.getDay()];

    let scheduledStart = null;
    if (course.timetable && Array.isArray(course.timetable)) {
      // time format example: "10:00 AM - 11:00 AM"
      const currentSlot = course.timetable.find(t => t.day === today);
      if (currentSlot && currentSlot.time) {
        // Simple heuristic: if we are starting within the slot window or slightly before
        // For now, just taking the start time string from the slot to look professional
        const [start] = currentSlot.time.split(' - ');
        if (start) scheduledStart = start;
      }
    }

    // Create session
    const sessionData = cleanObject({
      courseId,
      courseName: course.name,
      courseCode: course.code,
      facultyId,
      date: admin.firestore.Timestamp.now(),
      startTime: scheduledStart || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      roomNumber,
      locationLatitude: latitude,
      locationLongitude: longitude,
      geofenceRadius: radius,
      presentCount: 0,
      totalStudents: 0,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      qrVersion: 1, // Start with version 1
      qrRefreshInterval: validitySeconds,
      classType
    });

    const sessionRef = await db.collection('sessions').add(sessionData);
    const sessionId = sessionRef.id;

    // AUTO-CREATE ABSENT RECORDS FOR ALL ENROLLED STUDENTS
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('courseId', '==', courseId)
      .where('isActive', '==', true)
      .get();

    const batch = db.batch();
    let studentCount = 0;

    if (!enrollmentsSnapshot.empty) {
      const studentIds = enrollmentsSnapshot.docs.map(d => d.data().studentId);

      const studentDocs = await Promise.all(studentIds.map(id => db.collection('students').doc(id).get()));

      for (const studentDoc of studentDocs) {
        if (!studentDoc.exists) continue;
        const studentData = studentDoc.data();
        const studentId = studentDoc.id;

        const attendanceRef = db.collection('attendance').doc(`${sessionId}_${studentId}`);
        batch.set(attendanceRef, {
          sessionId,
          courseId,
          studentId,
          studentName: studentData.name || 'Unknown',
          studentRollNo: studentData.rollNo || 'N/A',
          courseName: course.name,
          courseCode: course.code,
          status: 'absent', // Default status
          markedAt: null,
          markedBy: 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          qrVersion: null,
          classType
        });
        studentCount++;
      }
    }

    // Update session with total students
    batch.update(sessionRef, { totalStudents: studentCount });
    await batch.commit();

    // Generate QR payload
    const qrPayload = generateQRPayload(
      sessionId,
      courseId,
      facultyId,
      { latitude, longitude, radius },
      validitySeconds * 1000
    );
    qrPayload.qrVersion = 1; // Add version

    // Store active QR
    await db.collection('activeQRs').doc(sessionId).set(cleanObject({
      ...qrPayload,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }));

    res.json({
      success: true,
      sessionId,
      qrData: JSON.stringify(cleanObject(qrPayload)),
      qrPayload: cleanObject(qrPayload),
      expiresIn: validitySeconds,
      session: { id: sessionId, ...sessionData, totalStudents: studentCount }
    });

  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Refresh QR Code
app.post('/api/faculty/refresh-qr', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Get session
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionDoc.data();
    if (!session.isActive) {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Increment version
    const newVersion = (session.qrVersion || 0) + 1;
    await sessionDoc.ref.update({ qrVersion: newVersion });

    // Generate new QR payload
    const validitySeconds = session.qrRefreshInterval || 5;
    const qrPayload = generateQRPayload(
      sessionId,
      session.courseId,
      session.facultyId,
      {
        latitude: session.locationLatitude,
        longitude: session.locationLongitude,
        radius: session.geofenceRadius
      },
      validitySeconds * 1000
    );
    qrPayload.qrVersion = newVersion;

    // Update active QR
    await db.collection('activeQRs').doc(sessionId).set(cleanObject({
      ...qrPayload,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }));

    res.json({
      success: true,
      qrData: JSON.stringify(cleanObject(qrPayload)),
      qrPayload: cleanObject(qrPayload),
      expiresIn: validitySeconds,
      qrVersion: newVersion
    });

  } catch (error) {
    console.error('Error refreshing QR:', error);
    res.status(500).json({ error: 'Failed to refresh QR code' });
  }
});

// Get Live Attendance for Session - OPTIMIZED
app.get('/api/faculty/session/:sessionId/attendance', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionDoc.data();

    // Get attendance records
    const attendanceSnapshot = await db.collection('attendance')
      .where('sessionId', '==', sessionId)
      .orderBy('markedAt', 'desc')
      .get();

    // OPTIMIZED: Use denormalized data (no additional student reads!)
    const attendees = attendanceSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName || 'Unknown',  // Denormalized
        rollNo: data.studentRollNo || 'N/A',  // Denormalized
        status: data.status,
        markedAt: data.markedAt,
        distance: data.distanceFromClass
      };
    });

    res.json({
      session: { id: sessionDoc.id, ...session },
      attendees,
      presentCount: attendees.filter(a => a.status === 'present').length,
      totalAttendees: attendees.length
    });

  } catch (error) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({ error: 'Failed to fetch session attendance' });
  }
});

// Stop Session
app.post('/api/faculty/session/:sessionId/stop', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    await db.collection('sessions').doc(sessionId).update({
      isActive: false,
      endedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('activeQRs').doc(sessionId).delete();

    res.json({ success: true, message: 'Session stopped successfully' });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

// List enrolled students for a course (faculty view)
app.get('/api/faculty/course/:courseId/students', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const sessionId = req.query.sessionId; // optional: provide session to include present status

    // Verify requesting user is faculty for this course
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseDoc.data();
    if (course.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized for this course' });
    }

    // Get enrollments
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('courseId', '==', courseId)
      .where('isActive', '==', true)
      .get();

    const studentIds = enrollmentsSnapshot.docs.map(d => d.data().studentId);
    const students = [];
    for (const sid of studentIds) {
      const sDoc = await db.collection('students').doc(sid).get();
      if (sDoc.exists) {
        students.push({ id: sid, ...sDoc.data() });
      }
    }

    let presentSet = new Set();
    if (sessionId) {
      const attendanceSnapshot = await db.collection('attendance')
        .where('sessionId', '==', sessionId)
        .where('status', '==', 'present')
        .get();
      presentSet = new Set(attendanceSnapshot.docs.map(d => d.data().studentId));
    }

    const result = students.map(s => ({
      id: s.id,
      name: s.name || 'Unknown',
      rollNo: s.rollNo || s.rollNumber || 'N/A',
      present: presentSet.has(s.id)
    }));

    res.json({ success: true, students: result });
  } catch (error) {
    console.error('Error listing enrolled students:', error);
    res.status(500).json({ error: 'Failed to list enrolled students' });
  }
});

// Get attendance grid for a course (all students x all sessions)
app.get('/api/faculty/course/:courseId/attendance-grid', verifyToken, async (req, res) => {
  console.log(`[DEBUG] Attendance Grid Request for course: ${req.params.courseId}`);
  try {
    const { courseId } = req.params;
    const facultyId = req.user.uid;

    // Verify requesting user is faculty for this course
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      console.log('[DEBUG] Course not found');
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseDoc.data();
    if (course.facultyId !== facultyId) {
      console.log('[DEBUG] Not authorized');
      return res.status(403).json({ error: 'Not authorized for this course' });
    }

    // Get all sessions for this course (ordered by date)
    const sessionsSnapshot = await db.collection('sessions')
      .where('courseId', '==', courseId)
      .orderBy('date', 'asc')
      .get();

    const sessions = sessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date?.toDate?.() || new Date(),
        startTime: data.startTime || 'N/A',
        roomNumber: data.roomNumber || 'N/A',
        type: data.classType || 'Theory'
      };
    });

    // Get all enrollments for this course
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('courseId', '==', courseId)
      .where('isActive', '==', true)
      .get();

    const studentIds = enrollmentsSnapshot.docs.map(d => d.data().studentId);

    // Fetch all students
    const students = [];
    for (const sid of studentIds) {
      const sDoc = await db.collection('students').doc(sid).get();
      if (sDoc.exists) {
        students.push({ id: sid, ...sDoc.data() });
      }
    }

    // Fetch all attendance records for this course
    const attendanceSnapshot = await db.collection('attendance')
      .where('courseId', '==', courseId)
      .get();

    // Build attendance map: studentId -> { sessionId -> status }
    const attendanceMap = new Map();
    attendanceSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const studentId = data.studentId;
      const sessionId = data.sessionId;
      const status = data.status;

      if (!attendanceMap.has(studentId)) {
        attendanceMap.set(studentId, new Map());
      }
      attendanceMap.get(studentId).set(sessionId, status);
    });

    // Build result with attendance percentage
    const result = students.map(s => {
      const studentAttendance = attendanceMap.get(s.id) || new Map();
      const sessionData = {};

      let presentCount = 0;
      sessions.forEach(session => {
        const status = studentAttendance.get(session.id) || 'absent';
        sessionData[session.id] = status;
        if (status === 'present') presentCount++;
      });

      const attendancePercentage = sessions.length > 0
        ? Math.round((presentCount / sessions.length) * 100)
        : 0;

      return {
        id: s.id,
        name: s.name || 'Unknown',
        rollNo: s.rollNo || s.rollNumber || 'N/A',
        attendancePercentage,
        sessions: sessionData
      };
    });

    console.log(`[DEBUG] Success. Found ${students.length} students, ${sessions.length} sessions`);
    res.json({
      success: true,
      students: result,
      sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Error fetching attendance grid:', error);
    res.status(500).json({ error: 'Failed to fetch attendance grid' });
  }
});

// Manual attendance marking for a session
// Manual attendance marking for a session
app.post('/api/faculty/session/:sessionId/manual-attendance', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { studentId, status } = req.body;

    if (!studentId || !['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'studentId and status (present/absent) are required' });
    }

    // Verify session exists and belongs to faculty
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionDoc.data();
    if (session.facultyId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized for this session' });
    }

    // Find attendance record
    const attendanceSnapshot = await db.collection('attendance')
      .where('sessionId', '==', sessionId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    let previousStatus = 'absent'; // Default if creating new

    if (attendanceSnapshot.empty) {
      // Create new record if not found (e.g. late enrollment)
      // Fetch student details
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        return res.status(404).json({ error: 'Student not found' });
      }
      const studentData = studentDoc.data();

      const courseDoc = await db.collection('courses').doc(session.courseId).get();
      const course = courseDoc.data();

      await db.collection('attendance').add({
        sessionId,
        courseId: session.courseId,
        studentId,
        studentName: studentData.name || 'Unknown',
        studentRollNo: studentData.rollNo || 'N/A',
        courseName: course.name || 'Unknown',
        courseCode: course.code || 'N/A',
        status,
        markedAt: status === 'present' ? admin.firestore.FieldValue.serverTimestamp() : null,
        markedBy: 'manual_faculty',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const doc = attendanceSnapshot.docs[0];
      previousStatus = doc.data().status;

      if (previousStatus !== status) {
        await doc.ref.update({
          status,
          markedBy: 'manual_faculty',
          markedAt: status === 'present' ? admin.firestore.FieldValue.serverTimestamp() : null
        });
      }
    }

    // Update session present count if status changed
    if (previousStatus !== status) {
      const increment = status === 'present' ? 1 : -1;
      await db.collection('sessions').doc(sessionId).update({
        presentCount: admin.firestore.FieldValue.increment(increment)
      });
    }

    // Invalidate student cache
    invalidateStudentCache(studentId);

    res.json({ success: true, message: `Student marked ${status}` });

  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ============================================
// STUDENT JOIN COURSE BY CODE
// ============================================
app.post('/api/student/join-course', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { joinCode } = req.body;
    if (!joinCode) {
      return res.status(400).json({ error: 'joinCode is required' });
    }

    // Find course by join code
    const courseSnapshot = await db.collection('courses')
      .where('joinCode', '==', joinCode.toUpperCase())
      .limit(1)
      .get();
    if (courseSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid join code' });
    }
    const courseDoc = courseSnapshot.docs[0];
    const courseId = courseDoc.id;

    // Check existing enrollment
    const existing = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollmentData = {
      studentId: userId,
      courseId,
      isActive: true,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'join-code'
    };
    const enrRef = await db.collection('enrollments').add(enrollmentData);

    // Increment enrolledCount
    await db.collection('courses').doc(courseId).update({
      enrolledCount: admin.firestore.FieldValue.increment(1)
    });

    res.json({ success: true, enrollmentId: enrRef.id, course: { id: courseId, ...courseDoc.data() } });
  } catch (error) {
    console.error('Error joining course:', error);
    res.status(500).json({ error: 'Failed to join course' });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 IIIT NR Attendance Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Network: http://192.168.137.1:${PORT}/health`);
});
