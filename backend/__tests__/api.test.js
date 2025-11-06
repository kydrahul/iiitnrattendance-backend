const request = require('supertest');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { app } = require('../src/index');

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn()
    }))
  }))
}));

describe('API Endpoints', () => {
  const mockFacultyToken = 'faculty-token';
  const mockStudentToken = 'student-token';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock faculty auth
    admin.auth().verifyIdToken.mockImplementation((token) => {
      if (token === mockFacultyToken) {
        return Promise.resolve({ role: 'faculty' });
      } else if (token === mockStudentToken) {
        return Promise.resolve({ role: 'student' });
      }
      return Promise.reject(new Error('Invalid token'));
    });
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('POST /generate-qr', () => {
    it('should generate QR token for faculty', async () => {
      const res = await request(app)
        .post('/generate-qr')
        .set('Authorization', `Bearer ${mockFacultyToken}`)
        .send({
          sessionId: 'test-session',
          courseId: 'test-course'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('qrToken');
    });

    it('should reject non-faculty users', async () => {
      const res = await request(app)
        .post('/generate-qr')
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .send({
          sessionId: 'test-session',
          courseId: 'test-course'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /verify-scan', () => {
    it('should verify valid QR token', async () => {
      const qrToken = jwt.sign(
        {
          sessionId: 'test-session',
          courseId: 'test-course',
          exp: Math.floor(Date.now() / 1000) + 300
        },
        process.env.QR_SIGNING_KEY || 'test-key'
      );

      const res = await request(app)
        .post('/verify-scan')
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .send({
          qrToken,
          studentId: 'test-student',
          lat: 21.1458,
          lng: 81.6355
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject expired QR token', async () => {
      const qrToken = jwt.sign(
        {
          sessionId: 'test-session',
          courseId: 'test-course',
          exp: Math.floor(Date.now() / 1000) - 300
        },
        process.env.QR_SIGNING_KEY || 'test-key'
      );

      const res = await request(app)
        .post('/verify-scan')
        .set('Authorization', `Bearer ${mockStudentToken}`)
        .send({
          qrToken,
          studentId: 'test-student',
          lat: 21.1458,
          lng: 81.6355
        });

      expect(res.status).toBe(400);
    });
  });
});