import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Percent, CheckCircle, Clock } from 'lucide-react';
import { StatCard, ProgressBar } from '../../components/ui';
import api from '../../services/api';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/student-dashboard')
      .then(res => setData(res.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><p className="text-surface-500">Loading your academic metrics...</p></div>;

  const stats = data?.stats || {};
  const threshold = data?.threshold || 75;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-2">
        <h1 className="section-title">Student Dashboard</h1>
        <p className="text-surface-500 mt-1">Hello, {data?.student?.fullName}. Track your academic attendance history and status.</p>
      </div>

      {data?.belowThreshold && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Attendance Warning Alert!</p>
            <p className="text-sm mt-0.5">Your overall attendance is {stats.percentage}%, which falls below the institution required minimum of {threshold}%. Maintain attendance to avoid defalcation list.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard icon={Percent} title="Overall Attendance" value={`${stats.percentage}%`} color={data?.belowThreshold ? 'danger' : 'success'} />
        <StatCard icon={Calendar} title="Total Sessions" value={stats.total} color="primary" />
        <StatCard icon={CheckCircle} title="Sessions Present" value={stats.present} color="success" />
        <StatCard icon={Clock} title="Late Arrivals" value={stats.late} color="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Course breakdowns */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-surface-900">Subject-wise Attendance</h3></div>
          <div className="card-body space-y-4">
            {(data?.subjectWise || []).map((sub, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-surface-700">{sub.subject?.subjectName} ({sub.subject?.subjectCode})</span>
                  <span className="font-semibold text-surface-900">{sub.percentage}%</span>
                </div>
                <ProgressBar value={sub.percentage} color="auto" showLabel={false} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-surface-900">Recent Attendance History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentRecords || []).slice(0, 5).map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3 text-sm text-surface-600">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm text-surface-900 font-semibold">{r.subjectId?.subjectName}</td>
                    <td className="px-6 py-3">
                      <span className={`badge ${r.status === 'PRESENT' ? 'badge-present' : r.status === 'LATE' ? 'badge-late' : 'badge-absent'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
