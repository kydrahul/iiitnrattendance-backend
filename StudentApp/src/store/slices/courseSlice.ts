import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Course {
  id: string;
  code: string;
  name: string;
  faculty: string;
  section: string;
  totalClasses: number;
  attended: number;
  credits: number;
  isPinned: boolean;
  schedule: CourseSchedule[];
}

interface CourseSchedule {
  day: string;
  time: string;
  room: string;
  topic?: string;
  status?: 'present' | 'absent' | 'pending';
  isCurrent?: boolean;
  isPast?: boolean;
}

interface CourseState {
  courses: Record<string, Course>;
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: {},
  isLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    fetchCoursesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCoursesSuccess: (state, action: PayloadAction<Course[]>) => {
      state.isLoading = false;
      state.courses = action.payload.reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
      }, {} as Record<string, Course>);
      state.error = null;
    },
    fetchCoursesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateCourseAttendance: (state, action: PayloadAction<{ courseId: string; attended: number }>) => {
      const course = state.courses[action.payload.courseId];
      if (course) {
        course.attended = action.payload.attended;
      }
    },
    toggleCoursePinned: (state, action: PayloadAction<{ courseId: string }>) => {
      const course = state.courses[action.payload.courseId];
      if (course) {
        course.isPinned = !course.isPinned;
      }
    },
  },
});

export const {
  fetchCoursesStart,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  updateCourseAttendance,
  toggleCoursePinned,
} = courseSlice.actions;

export default courseSlice.reducer;