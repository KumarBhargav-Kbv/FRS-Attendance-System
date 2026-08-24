import { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import { PageHeader, StatusBadge, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';

export default function MyAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/student-dashboard')
      .then(res => setData(res.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="My Attendance Records" subtitle="Full timeline of your recorded class attendances" />
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={6} /></div>
        ) : !data?.recentRecords?.length ? (
          <EmptyState icon={Calendar} title="No attendance recorded" description="You have not attended any classes yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Method</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRecords.map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3 text-sm text-surface-600">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-semibold text-surface-900">{r.subjectId?.subjectName}</td>
                    <td className="px-6 py-3 text-sm text-surface-500">{r.time || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-3 text-xs text-surface-400 font-mono">{r.recognitionMethod}</td>
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
