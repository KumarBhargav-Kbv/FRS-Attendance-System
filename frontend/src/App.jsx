import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import FacultyLayout from './layouts/FacultyLayout';
import StudentLayout from './layouts/StudentLayout';

// Shared Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Faculty from './pages/admin/Faculty';
import Departments from './pages/admin/Departments';
import Subjects from './pages/admin/Subjects';
import Classes from './pages/admin/Classes';
import FaceRegistration from './pages/admin/FaceRegistration';
import Attendance from './pages/admin/Attendance';
import Reports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import MyClasses from './pages/faculty/MyClasses';
import StartAttendance from './pages/faculty/StartAttendance';
import LiveAttendance from './pages/faculty/LiveAttendance';
import AttendanceHistory from './pages/faculty/AttendanceHistory';
import FacultyProfile from './pages/faculty/Profile';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import MyAttendance from './pages/student/MyAttendance';
import SubjectAttendance from './pages/student/SubjectAttendance';
import StudentAttendanceHistory from './pages/student/AttendanceHistory';
import StudentReports from './pages/student/Reports';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="faculty" element={<Faculty />} />
            <Route path="departments" element={<Departments />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="classes" element={<Classes />} />
            <Route path="face-registration" element={<FaceRegistration />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Faculty Routes */}
          <Route path="/faculty" element={<ProtectedRoute roles={['FACULTY']}><FacultyLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="my-classes" element={<MyClasses />} />
            <Route path="start-attendance" element={<StartAttendance />} />
            <Route path="live-attendance" element={<LiveAttendance />} />
            <Route path="attendance-history" element={<AttendanceHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<FacultyProfile />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="subject-attendance" element={<SubjectAttendance />} />
            <Route path="history" element={<StudentAttendanceHistory />} />
            <Route path="reports" element={<StudentReports />} />
            <Route path="face-registration" element={<FaceRegistration />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px' } }} />
    </AuthProvider>
  );
}
