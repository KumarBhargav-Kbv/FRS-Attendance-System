import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ScanFace, Eye, EyeOff, ArrowLeft, Shield, GraduationCap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const location = useLocation();
  const initialRole = location.state?.role || 'ADMIN';
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { key: 'ADMIN', label: 'Admin', icon: Shield, color: 'primary', gradient: 'from-primary-500 to-primary-600' },
    { key: 'FACULTY', label: 'Faculty', icon: BookOpen, color: 'emerald', gradient: 'from-emerald-500 to-teal-500' },
    { key: 'STUDENT', label: 'Student', icon: GraduationCap, color: 'purple', gradient: 'from-purple-500 to-pink-500' },
  ];

  const demoCredentials = {
    ADMIN: { email: 'admin@frscollege.com', password: 'Admin@123' },
    FACULTY: { email: 'faculty@frscollege.com', password: 'Faculty@123' },
    STUDENT: { email: 'student@frscollege.com', password: 'Student@123' },
  };

  const fillDemo = () => {
    const creds = demoCredentials[selectedRole];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      const redirectMap = { ADMIN: '/admin/dashboard', FACULTY: '/faculty/dashboard', STUDENT: '/student/dashboard' };
      navigate(redirectMap[user.role] || '/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = roles.find(r => r.key === selectedRole);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <ScanFace className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">FRS Attendance</h1>
              <p className="text-white/60 text-sm">Management System</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart Attendance<br />for Modern Campus
          </h2>
          <p className="text-white/60 text-lg max-w-md">
            Leveraging AI-powered face recognition for seamless, contactless attendance tracking.
          </p>
        </div>
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {['99.2% Accuracy', '<1s Detection', '24/7 Available'].map((t, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <p className="text-sm font-semibold text-white">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-surface-500 hover:text-surface-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <ScanFace className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-surface-900">Welcome Back</h2>
            <p className="text-surface-500 mt-1">Sign in to your account</p>
          </div>

          {/* Role Selector */}
          <div className="flex gap-2 mb-8 bg-surface-100 p-1.5 rounded-2xl">
            {roles.map(role => (
              <button
                key={role.key}
                onClick={() => { setSelectedRole(role.key); setEmail(''); setPassword(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedRole === role.key
                    ? `bg-white shadow-md text-surface-900`
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                <role.icon className="w-4 h-4" />
                {role.label}
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={`Enter ${selectedRole.toLowerCase()} email`}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${activeRole.gradient} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In as {activeRole.label}</>
              )}
            </button>
          </form>

          {selectedRole === 'STUDENT' && (
            <p className="text-center text-sm text-surface-500 mt-6">
              New student?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Register here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
