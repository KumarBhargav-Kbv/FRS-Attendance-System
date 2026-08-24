import { useState, useEffect } from 'react';
import { BookOpen, Play, Calendar, Percent } from 'lucide-react';
import { StatCard } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/analytics/faculty-dashboard')
      .then(res => setData(res.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><p className="text-surface-500">Loading...</p></div>;

  const stats = data?.stats || {};

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-2">
        <h1 className="section-title">Faculty Dashboard</h1>
        <p className="text-surface-500 mt-1">Hello, {data?.faculty?.fullName}. Manage your sessions and review attendance here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard icon={BookOpen} title="Assigned Classes" value={stats.assignedClasses} color="primary" />
        <StatCard icon={Calendar} title="Today's Classes" value={stats.todayClasses} color="info" />
        <StatCard icon={Percent} title="Avg Attendance" value={`${stats.averageAttendance}%`} color="warning" />
        <StatCard icon={Play} title="Today's Registered" value={stats.todayTotal} color="success" subtitle={`${stats.todayPresent} marked`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-surface-900">Today's Active Sessions</h3></div>
          <div className="card-body space-y-4">
            {data?.todaySessions?.length === 0 ? (
              <p className="text-surface-400 text-sm">No attendance sessions registered today.</p>
            ) : (
              (data.todaySessions || []).map((session, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-surface-50 rounded-xl border border-surface-100">
                  <div>
                    <p className="font-bold text-surface-900">{session.subjectId?.subjectName}</p>
                    <p className="text-xs text-surface-400">Time: {session.startTime} | Status: {session.status}</p>
                  </div>
                  {session.status === 'ACTIVE' && (
                    <button
                      onClick={() => navigate('/faculty/live-attendance', { state: { sessionId: session._id } })}
                      className="btn-success py-1.5 px-3 text-xs"
                    >
                      View Live Feed
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Classes */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-surface-900">Your Assigned Subjects</h3></div>
          <div className="card-body space-y-3">
            {(data?.classes || []).map((cls, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-surface-50 rounded-xl">
                <div>
                  <p className="font-semibold text-surface-800">{cls.subjectId?.subjectName}</p>
                  <p className="text-xs text-surface-400">{cls.departmentId?.code} Year {cls.year} Section {cls.section}</p>
                </div>
                <button
                  onClick={() => navigate('/faculty/start-attendance', { state: { classId: cls._id, subjectId: cls.subjectId?._id } })}
                  className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Start
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
