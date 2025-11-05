import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, Course, AttendanceSession, AttendanceStats } from '@/types';

export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();
    if (userData.role !== 'faculty') {
      throw new Error('Unauthorized access. Faculty only.');
    }

    return {
      token: await user.getIdToken(),
      user: {
        id: user.uid,
        name: userData.name,
        email: user.email!,
        role: userData.role
      }
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message);
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const getCourses = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('faculty', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];
  } catch (error: any) {
    console.error('Get courses error:', error);
    throw new Error(error.message);
  }
};

export const getCourseDetails = async (courseId: string) => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    return {
      id: courseDoc.id,
      ...courseDoc.data()
    } as Course;
  } catch (error: any) {
    console.error('Get course details error:', error);
    throw new Error(error.message);
  }
};

export const generateQR = async (
  courseId: string,
  expiresIn: number,
  location: { latitude: number; longitude: number }
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const sessionData = {
      courseId,
      timestamp: Timestamp.now(),
      expiresIn,
      location: {
        ...location,
        radius: 50 // 50 meters radius for location verification
      },
      status: 'active',
      faculty: currentUser.uid
    };

    const sessionRef = await addDoc(collection(db, 'attendance_sessions'), sessionData);

    return {
      sessionId: sessionRef.id,
      qrData: JSON.stringify({
        sessionId: sessionRef.id,
        courseId,
        timestamp: sessionData.timestamp.toMillis(),
        expiresIn
      })
    };
  } catch (error: any) {
    console.error('Generate QR error:', error);
    throw new Error(error.message);
  }
};

export const markManualAttendance = async (
  sessionId: string,
  studentIds: string[],
  status: 'present' | 'absent'
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const batch = [];
    for (const studentId of studentIds) {
      const attendanceData = {
        sessionId,
        studentId,
        timestamp: Timestamp.now(),
        type: 'manual',
        status: status === 'present' ? 'verified' : 'absent',
        markedBy: currentUser.uid
      };

      batch.push(addDoc(collection(db, 'attendance_records'), attendanceData));
    }

    await Promise.all(batch);
    return { updated: studentIds.length };
  } catch (error: any) {
    console.error('Mark manual attendance error:', error);
    throw new Error(error.message);
  }
};

export const getAttendanceStats = async (courseId: string, from: string, to: string) => {
  try {
    const sessionsRef = collection(db, 'attendance_sessions');
    const q = query(
      sessionsRef,
      where('courseId', '==', courseId),
      where('timestamp', '>=', new Date(from)),
      where('timestamp', '<=', new Date(to)),
      orderBy('timestamp', 'desc')
    );

    const sessions = await getDocs(q);
    const sessionIds = sessions.docs.map(doc => doc.id);

    const recordsRef = collection(db, 'attendance_records');
    const recordsQuery = query(
      recordsRef,
      where('sessionId', 'in', sessionIds)
    );

    const records = await getDocs(recordsQuery);
    
    const stats: AttendanceStats = {
      total: 0,
      present: 0,
      absent: 0,
      byDate: {}
    };

    // Get total students in the course
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (!courseDoc.exists()) throw new Error('Course not found');
    const enrolledStudents = courseDoc.data().enrolledStudents || [];
    stats.total = enrolledStudents.length;

    records.forEach(record => {
      const data = record.data();
      const date = new Date(data.timestamp.toDate()).toISOString().split('T')[0];
      
      if (!stats.byDate[date]) {
        stats.byDate[date] = { present: 0, absent: 0 };
      }

      if (data.status === 'verified') {
        stats.present++;
        stats.byDate[date].present++;
      } else {
        stats.absent++;
        stats.byDate[date].absent++;
      }
    });

    return stats;
  } catch (error: any) {
    console.error('Get attendance stats error:', error);
    throw new Error(error.message);
  }
};