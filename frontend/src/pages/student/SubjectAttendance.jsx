import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader, ProgressBar, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';

export default function SubjectAttendance() {
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
      <PageHeader title="Subject Wise Breakdown" subtitle="Detailed statistics on a per-course basis" />
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {(data?.subjectWise || []).map((sub, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="card-header flex justify-between items-center">
                <h3 className="font-bold text-surface-900">{sub.subject?.subjectName}</h3>
                <span className="badge bg-purple-100 text-purple-700 font-mono text-xs">{sub.subject?.subjectCode}</span>
              </div>
              <div className="card-body space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Attendance Percentage</span>
                  <span className={`font-bold text-lg ${sub.percentage >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {sub.percentage}%
                  </span>
                </div>
                <ProgressBar value={sub.percentage} color="auto" showLabel={false} size="lg" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-surface-100">
                  <div>
                    <p className="text-surface-400 font-semibold">Total Classes</p>
                    <p className="text-base font-bold text-surface-700 mt-0.5">{sub.total}</p>
                  </div>
                  <div>
                    <p className="text-emerald-600 font-semibold">Present</p>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">{sub.present}</p>
                  </div>
                  <div>
                    <p className="text-red-600 font-semibold">Absent</p>
                    <p className="text-base font-bold text-red-700 mt-0.5">{sub.absent}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
