import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { PageHeader, StatusBadge, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';

export default function StudentAttendanceHistory() {
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
      <PageHeader title="Attendance Roster History" subtitle="Full breakdown of all registered attendance sessions" />
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={8} /></div>
        ) : !data?.recentRecords?.length ? (
          <EmptyState icon={History} title="No history found" description="No attendance sessions have been registered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Faculty</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRecords.map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3 text-sm text-surface-600">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-semibold text-surface-900">{r.subjectId?.subjectName}</td>
                    <td className="px-6 py-3 text-sm text-surface-600">{r.facultyId?.fullName || 'University Faculty'}</td>
                    <td className="px-6 py-3 text-sm text-surface-500">{r.time || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
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
