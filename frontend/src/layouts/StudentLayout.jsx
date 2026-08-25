import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, User, ClipboardCheck, BookOpen, History, FileBarChart,
  LogOut, Menu, ChevronLeft, ScanFace
} from 'lucide-react';

const sidebarLinks = [
  { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/profile', label: 'My Profile', icon: User },
  { path: '/student/attendance', label: 'My Attendance', icon: ClipboardCheck },
  { path: '/student/subject-attendance', label: 'Subject Attendance', icon: BookOpen },
  { path: '/student/history', label: 'Attendance History', icon: History },
  { path: '/student/reports', label: 'Reports', icon: FileBarChart },
  { path: '/student/face-registration', label: 'Face Registration', icon: ScanFace },
];

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <ScanFace className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <div><h2 className="text-white font-bold text-sm">FRS Attendance</h2><p className="text-surface-400 text-xs">Student Portal</p></div>
          )}
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map(link => (
          <NavLink key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`}>
            <link.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-surface-700/50">
        {sidebarOpen && <div className="px-4 py-2 mb-2"><p className="text-sm font-medium text-white truncate">{user?.name}</p><p className="text-xs text-surface-400 truncate">{user?.email}</p></div>}
        <button onClick={handleLogout} className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center px-2' : ''}`}>
          <LogOut className="w-5 h-5" />{sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50">
      <aside className={`hidden lg:flex flex-col bg-surface-900 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}><SidebarContent /></aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface-900 shadow-2xl"><SidebarContent /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-surface-100 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-surface-100 rounded-lg"><Menu className="w-5 h-5" /></button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 hover:bg-surface-100 rounded-lg"><ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} /></button>
            <span className="text-sm font-medium text-surface-500">Hello, <span className="text-surface-900">{user?.name}</span></span>
          </div>
          <span className="badge bg-purple-100 text-purple-700">Student</span>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
