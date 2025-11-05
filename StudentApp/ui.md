import React, { useState } from 'react';
import { Search, User, Filter, ChevronRight, Calendar, Clock, MapPin, ChevronLeft, Maximize2, Pin, AlertCircle, CheckCircle, XCircle, MoreVertical, Phone, Mail, Settings, Bell, History } from 'lucide-react';

const HomeScreenDesign = () => {
  const [activeView, setActiveView] = useState('home');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const studentInfo = {
    name: "Rahul Sharma",
    rollNo: "21CS001",
    branch: "Computer Science",
    semester: "6th Semester"
  };

  const todayClasses = [
    { id: 1, time: "9:00 AM - 10:00 AM", course: "Data Structures", code: "CS201", faculty: "Dr. Amit Kumar", room: "Room 301", status: "present", isPast: true },
    { id: 2, time: "10:00 AM - 11:00 AM", course: "Database Systems", code: "CS202", faculty: "Dr. Priya Singh", room: "Lab A", status: "present", isPast: true },
    { id: 3, time: "11:30 AM - 12:30 PM", course: "Operating Systems", code: "CS203", faculty: "Dr. Rajesh Verma", room: "Room 205", status: "pending", isCurrent: true },
    { id: 4, time: "2:00 PM - 3:00 PM", course: "Computer Networks", code: "CS204", faculty: "Dr. Sneha Reddy", room: "LT-1", status: "pending", isPast: false },
    { id: 5, time: "3:30 PM - 4:30 PM", course: "Software Engineering", code: "CS205", faculty: "Dr. Vikram Mehta", room: "Room 402", status: "pending", isPast: false }
  ];

  const courses = [
    { id: 1, code: "CS201", name: "Data Structures", faculty: "Dr. Amit Kumar", attended: 28, total: 32, percentage: 87.5, credits: 4, isPinned: true },
    { id: 2, code: "CS202", name: "Database Systems", faculty: "Dr. Priya Singh", attended: 22, total: 30, percentage: 73.3, credits: 3, isPinned: false },
    { id: 3, code: "CS203", name: "Operating Systems", faculty: "Dr. Rajesh Verma", attended: 30, total: 35, percentage: 85.7, credits: 4, isPinned: true },
    { id: 4, code: "CS204", name: "Computer Networks", faculty: "Dr. Sneha Reddy", attended: 25, total: 33, percentage: 75.8, credits: 3, isPinned: false },
    { id: 5, code: "CS205", name: "Software Engineering", faculty: "Dr. Vikram Mehta", attended: 18, total: 28, percentage: 64.3, credits: 4, isPinned: false },
    { id: 6, code: "CS206", name: "Theory of Computation", faculty: "Dr. Ananya Joshi", attended: 26, total: 30, percentage: 86.7, credits: 3, isPinned: true },
    { id: 7, code: "MA201", name: "Discrete Mathematics", faculty: "Dr. Suresh Patel", attended: 29, total: 32, percentage: 90.6, credits: 4, isPinned: false },
    { id: 8, code: "CS207", name: "Web Technologies", faculty: "Dr. Neha Agarwal", attended: 20, total: 29, percentage: 69.0, credits: 3, isPinned: false }
  ];

  const getStatusColor = (status) => {
    if (status === 'present') return 'text-green-600 bg-green-50';
    if (status === 'absent') return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'text-green-700';
    return 'text-red-700';
  };

  const getCardBackground = (percentage) => {
    if (percentage < 75) return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
  };

  const HomeScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-blue-900">IIIT NR Attendance</h1>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-700" />
            </button>
            <button 
              onClick={() => setShowProfilePopup(true)}
              className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
            >
              <User className="w-5 h-5 text-blue-700" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses or faculty..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showProfilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfilePopup(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">RS</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{studentInfo.name}</h3>
                <p className="text-sm text-gray-600">{studentInfo.branch}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Roll Number</span>
                <span className="font-medium text-gray-900">{studentInfo.rollNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Semester</span>
                <span className="font-medium text-gray-900">{studentInfo.semester}</span>
              </div>
            </div>
            <button
              onClick={() => setShowProfilePopup(false)}
              className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-white px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
            <span className="text-sm text-gray-500">• Tuesday, Nov 5</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => setActiveView('weekView')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {todayClasses.map((cls) => (
            <div
              key={cls.id}
              className={`p-3 rounded-lg border transition-all ${
                cls.isCurrent 
                  ? 'bg-blue-50 border-blue-200 font-medium' 
                  : cls.isPast 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-600">{cls.time}</span>
                    {cls.isCurrent && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Live</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{cls.course}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    <span>{cls.faculty}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cls.room}
                    </span>
                  </div>
                </div>
                <div>
                  {cls.status === 'present' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                  {cls.status === 'absent' && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  {cls.status === 'pending' && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Courses</h2>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3 pb-20">
          {courses.sort((a, b) => b.isPinned - a.isPinned).map((course) => (
            <div
              key={course.id}
              onClick={() => {
                setSelectedCourse(course);
                setActiveView('courseDetail');
              }}
              className={`p-4 rounded-lg border ${getCardBackground(course.percentage)} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {course.isPinned && <Pin className="w-3.5 h-3.5 text-blue-600" />}
                    <span className="text-xs font-medium text-gray-600">{course.code}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1">{course.name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{course.faculty}</p>
                </div>
                <div className={`text-2xl font-bold ${getPercentageColor(course.percentage)}`}>
                  {course.percentage.toFixed(1)}%
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {course.attended}/{course.total} classes attended
                </span>
                <span className="text-gray-500">{course.credits} credits</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 -mt-6">
            <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-green-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/>
                <path d="M8 4v4M16 4v4M4 8h16M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xs font-medium mt-2 text-gray-600">Scan QR</span>
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className="flex flex-col items-center gap-1 text-gray-600"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const CourseDetailScreen = () => {
    if (!selectedCourse) return null;

    const sessions = [
      { id: 1, date: "Nov 5, 2024", time: "9:00 AM", status: "present", topic: "Binary Trees Implementation" },
      { id: 2, date: "Nov 4, 2024", time: "9:00 AM", status: "present", topic: "Tree Traversal Algorithms" },
      { id: 3, date: "Nov 1, 2024", time: "9:00 AM", status: "absent", topic: "Graph Data Structures" },
      { id: 4, date: "Oct 31, 2024", time: "9:00 AM", status: "present", topic: "Hashing Techniques" },
      { id: 5, date: "Oct 29, 2024", time: "9:00 AM", status: "present", topic: "Advanced Sorting" }
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('home')} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900">{selectedCourse.name}</h1>
              <p className="text-sm text-gray-600">{selectedCourse.code}</p>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className={`p-4 rounded-lg border ${getCardBackground(selectedCourse.percentage)} mb-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Overall Attendance</span>
              <span className={`text-3xl font-bold ${getPercentageColor(selectedCourse.percentage)}`}>
                {selectedCourse.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Classes Attended</p>
                <p className="font-semibold text-gray-900">{selectedCourse.attended}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Classes</p>
                <p className="font-semibold text-gray-900">{selectedCourse.total}</p>
              </div>
              <div>
                <p className="text-gray-600">Classes Missed</p>
                <p className="font-semibold text-red-600">{selectedCourse.total - selectedCourse.attended}</p>
              </div>
              <div>
                <p className="text-gray-600">Credits</p>
                <p className="font-semibold text-gray-900">{selectedCourse.credits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Faculty Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{selectedCourse.faculty}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>+91 98765 43210</span>
                <button className="ml-auto text-blue-600 text-xs">Copy</button>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>amit.kumar@iiitnr.ac.in</span>
                <button className="ml-auto text-blue-600 text-xs">Copy</button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">All Sessions</h3>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600">{session.date}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">{session.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{session.topic}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status === 'present' ? 'Present' : 'Absent'}
                    </div>
                  </div>
                  {session.status === 'absent' && (
                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Request Exception →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WeekViewScreen = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('home')} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-semibold text-gray-900 flex-1">Weekly Timetable</h1>
            <button 
              onClick={() => setActiveView('history')}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <History className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-medium text-gray-600">Time</div>
              {days.map(day => (
                <div key={day} className="text-xs font-medium text-gray-600 text-center">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>
            
            {timeSlots.map((time, idx) => (
              <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs text-gray-600 py-2">{time}</div>
                {days.map((day, dayIdx) => (
                  <div
                    key={`${day}-${time}`}
                    className={`p-2 rounded text-xs ${
                      (dayIdx + idx) % 3 === 0
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {(dayIdx + idx) % 3 === 0 && (
                      <div>
                        <p className="font-medium text-gray-900 truncate">CS{200 + idx}</p>
                        <p className="text-gray-600 truncate">Room {300 + idx}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const HistoryScreen = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('weekView')} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-semibold text-gray-900 flex-1">Attendance History</h1>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Filter by Course</h3>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Courses</option>
              <option>Data Structures</option>
              <option>Database Systems</option>
              <option>Operating Systems</option>
            </select>
          </div>

          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                  <div className={`text-2xl font-bold ${getPercentageColor(course.percentage)}`}>
                    {course.percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{course.attended}/{course.total} classes</span>
                  <button 
                    onClick={() => {
                      setSelectedCourse(course);
                      setActiveView('courseDetail');
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SettingsScreen = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('home')} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-semibold text-gray-900 flex-1">Settings</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">RS</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{studentInfo.name}</h3>
                <p className="text-sm text-gray-600">{studentInfo.rollNo}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <h3 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">Account</h3>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Edit Profile</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Manage Courses</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <h3 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">Preferences</h3>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Notifications</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Reminders</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <h3 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">Support</h3>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Help & FAQ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Contact Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <h3 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">Legal</h3>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-gray-900">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-900">Terms of Service</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 mb-20">
            <button className="w-full px-4 py-3 flex items-center justify-center gap-3 hover:bg-red-50 transition-colors text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-semibold">Logout</span>
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-8">
            <p>Version 2.0.1</p>
            <p className="mt-1">© 2024 IIIT Naya Raipur</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen">
      {activeView === 'home' && <HomeScreen />}
      {activeView === 'courseDetail' && <CourseDetailScreen />}
      {activeView === 'weekView' && <WeekViewScreen />}
      {activeView === 'history' && <HistoryScreen />}
      {activeView === 'settings' && <SettingsScreen />}
    </div>
  );
};

export default HomeScreenDesign;