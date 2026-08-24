import { useState, useEffect } from 'react';
import { History, Eye, Download } from 'lucide-react';
import { PageHeader, StatusBadge, LoadingSkeleton, EmptyState } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AttendanceHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/sessions')
      .then(res => setSessions(res.data))
      .catch(e => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Attendance Session History" subtitle="Review past sessions, active rosters, and export data" />
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={6} /></div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={History} title="No sessions recorded" description="Start a new attendance session to populate history" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">End Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3 font-semibold text-surface-900">
                      {session.subjectId?.subjectName}
                      <span className="block text-xs font-normal text-surface-400 font-mono mt-0.5">{session.subjectId?.subjectCode}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-surface-600">
                      Year {session.classId?.year} Section {session.classId?.section}
                    </td>
                    <td className="px-6 py-3 text-sm text-surface-600">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-surface-500">{session.startTime}</td>
                    <td className="px-6 py-3 text-sm text-surface-500">{session.endTime || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={session.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
