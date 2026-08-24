import { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, DoorOpen, UserCheck, UserX, Percent, ScanFace } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { StatCard } from '../../components/ui';
import api from '../../services/api';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse"><div className="h-20 bg-surface-100 rounded-lg" /></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const pieData = data?.departmentStats?.map(d => ({ name: d.code, value: d.students })) || [];

  return (
    <div className="page-container">
      <div className="mb-2">
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="text-surface-500 mt-1">Overview of your institution's attendance system</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={GraduationCap} title="Total Students" value={stats.totalStudents?.toLocaleString() || 0} color="primary" />
        <StatCard icon={Users} title="Total Faculty" value={stats.totalFaculty || 0} color="info" />
        <StatCard icon={Building2} title="Departments" value={stats.totalDepartments || 0} color="purple" />
        <StatCard icon={DoorOpen} title="Total Classes" value={stats.totalClasses || 0} color="accent" />
        <StatCard icon={UserCheck} title="Present Today" value={stats.todayPresent || 0} color="success" subtitle="Students present" />
        <StatCard icon={UserX} title="Absent Today" value={stats.todayAbsent || 0} color="danger" subtitle="Students absent" />
        <StatCard icon={Percent} title="Today's Attendance" value={`${stats.todayPercentage || 0}%`} color="warning" />
        <StatCard icon={ScanFace} title="Face Registered" value={`${stats.faceRegistered || 0}/${stats.totalStudents || 0}`} color="pink" subtitle={`${stats.faceNotRegistered || 0} pending`} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-surface-900">Weekly Attendance Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="present" name="Present" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-surface-900">Students by Department</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, idx) => (<Cell key={idx} fill={COLORS[idx % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attendance % Line Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-surface-900">Weekly Attendance Percentage</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.weeklyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Line type="monotone" dataKey="percentage" name="Attendance %" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Attendance Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-surface-900">Department-wise Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Department</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Students</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Present</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {(data?.departmentStats || []).map((dept, i) => (
                <tr key={i} className="table-row">
                  <td className="px-6 py-4">
                    <span className="font-medium text-surface-900">{dept.department}</span>
                    <span className="ml-2 text-xs text-surface-400">({dept.code})</span>
                  </td>
                  <td className="px-6 py-4 text-surface-600">{dept.students}</td>
                  <td className="px-6 py-4 text-surface-600">{dept.present}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${dept.percentage >= 75 ? 'bg-emerald-500' : dept.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dept.percentage}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-surface-700">{dept.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-surface-900">Recent Attendance Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Faculty</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentSessions || []).slice(0, 5).map((s, i) => (
                <tr key={i} className="table-row">
                  <td className="px-6 py-3 font-medium text-surface-900">{s.subjectId?.subjectName || 'N/A'}</td>
                  <td className="px-6 py-3 text-surface-600">{s.facultyId?.fullName || 'N/A'}</td>
                  <td className="px-6 py-3 text-surface-600">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span className={`badge ${s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : s.status === 'ACTIVE' ? 'badge-active' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
