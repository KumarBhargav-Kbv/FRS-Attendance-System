import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, Eye, EyeOff, ArrowLeft, GraduationCap, School } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('1');
  const [section, setSection] = useState('A');
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch departments for dropdown
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.data);
        if (response.data.length > 0) {
          setDepartmentId(response.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        toast.error('Failed to load departments');
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !studentId || !rollNumber || !departmentId || !year || !section) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/student/register', {
        name,
        email,
        password,
        studentId,
        rollNumber,
        departmentId,
        year: parseInt(year),
        section
      });
      setIsSuccess(true);
      toast.success('Registration request submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10">
          <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">FRS Attendance</h1>
              <p className="text-white/60 text-sm">Student Registration</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the Smart<br />Attendance System
          </h2>
          <p className="text-white/60 text-lg max-w-md">
            Register your student account to track class attendance, view subject-wise reports, and manage your academic profile.
          </p>
        </div>
        <div className="relative z-10 text-white/40 text-sm">
          © SVIET Attendance System.
        </div>
      </div>

      {/* Right Panel - Register Form / Success Modal */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 border border-surface-100">
          {isSuccess ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-600 animate-pulse">
                <GraduationCap className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">Registration Submitted!</h2>
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-sm max-w-md mx-auto leading-relaxed">
                <strong>Important Notice:</strong> Your account status is currently <strong>PENDING approval</strong>. 
                An administrator must verify your details and activate your account before you can log in.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <>
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-surface-500 hover:text-surface-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-surface-900">Student Sign Up</h2>
                <p className="text-surface-500 mt-1">Register for an attendance profile</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input-field py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@college.com"
                      className="input-field py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Student ID / Roll No</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="e.g. 21B91A0501"
                      className="input-field py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Admission Roll Number</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value)}
                      placeholder="e.g. Roll 01"
                      className="input-field py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Department</label>
                    <select
                      value={departmentId}
                      onChange={e => setDepartmentId(e.target.value)}
                      className="input-field py-2 bg-white"
                      required
                    >
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Year</label>
                    <select
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      className="input-field py-2 bg-white"
                      required
                    >
                      <option value="1">I Year</option>
                      <option value="2">II Year</option>
                      <option value="3">III Year</option>
                      <option value="4">IV Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Section</label>
                    <select
                      value={section}
                      onChange={e => setSection(e.target.value)}
                      className="input-field py-2 bg-white"
                      required
                    >
                      <option value="A">A Section</option>
                      <option value="B">B Section</option>
                      <option value="C">C Section</option>
                      <option value="D">D Section</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1">Choose Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="input-field py-2 pr-10"
                        required
                        minLength={6}
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Request Student Registration</>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-surface-500 mt-4">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Log In here
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
