import { useNavigate } from 'react-router-dom';
import { ScanFace, Zap, BarChart3, Shield, Clock, Database, ChevronRight, Sparkles } from 'lucide-react';

const features = [
  { icon: ScanFace, title: 'Face Recognition', desc: 'AI-powered facial recognition for instant student identification', color: 'from-primary-500 to-primary-600' },
  { icon: Zap, title: 'Automated Attendance', desc: 'Hands-free attendance marking with real-time camera processing', color: 'from-amber-500 to-orange-500' },
  { icon: Clock, title: 'Real-Time Tracking', desc: 'Live attendance monitoring with instant status updates', color: 'from-emerald-500 to-teal-500' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Comprehensive reports with visual insights and trends', color: 'from-blue-500 to-cyan-500' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'JWT authentication with role-based access control', color: 'from-purple-500 to-pink-500' },
  { icon: Database, title: 'Cloud Database', desc: 'MongoDB Atlas for scalable, reliable data storage', color: 'from-rose-500 to-red-500' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ScanFace className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">FRS</span>
            <span className="text-lg font-light text-primary-300 ml-1">Attendance</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="px-5 py-2 text-sm font-medium text-surface-300 hover:text-white transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-16 pt-16 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">Powered by AI & Computer Vision</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-200 to-accent-300">
              FRS Attendance
            </span>
            <br />
            <span className="text-white">Management System</span>
          </h1>

          <p className="text-xl lg:text-2xl text-surface-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Smart, Fast & Automated Attendance Using Face Recognition.
            <br className="hidden md:block" />
            Built for modern educational institutions.
          </p>

          {/* Login Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => navigate('/login', { state: { role: 'ADMIN' } })}
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Admin Login <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login', { state: { role: 'FACULTY' } })}
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Faculty Login <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login', { state: { role: 'STUDENT' } })}
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-2xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Student Login <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Recognition Speed', value: '<1s' },
              { label: 'Accuracy Rate', value: '99.2%' },
              { label: 'Active Students', value: '1,250+' },
              { label: 'Daily Sessions', value: '50+' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-surface-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 lg:px-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">Powerful Features</h2>
            <p className="text-surface-400 text-lg">Everything you need for modern attendance management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Credentials */}
      <section className="relative z-10 px-6 lg:px-16 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-primary-900/50 to-accent-900/50 border border-primary-500/20 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 text-center">🎓 Demo Credentials</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { role: 'Admin', email: 'admin@frscollege.com', pass: 'Admin@123', color: 'primary' },
                { role: 'Faculty', email: 'faculty@frscollege.com', pass: 'Faculty@123', color: 'emerald' },
                { role: 'Student', email: 'student@frscollege.com', pass: 'Student@123', color: 'purple' },
              ].map((cred, i) => (
                <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <p className={`text-sm font-semibold text-${cred.color}-400 mb-2`}>{cred.role}</p>
                  <p className="text-xs text-surface-400">Email: <span className="text-white">{cred.email}</span></p>
                  <p className="text-xs text-surface-400 mt-1">Password: <span className="text-white">{cred.pass}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-surface-800 text-center">
        <p className="text-surface-500 text-sm">© 2024 FRS Attendance Management System. Built for academic excellence.</p>
      </footer>
    </div>
  );
}
