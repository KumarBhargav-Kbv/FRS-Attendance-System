import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Play } from 'lucide-react';
import { PageHeader, LoadingSkeleton } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/analytics/faculty-dashboard')
      .then(res => setClasses(res.data.classes || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="My Assigned Classes" subtitle="Review your timetables, room assignments, and schedules" />
      {loading ? (
        <LoadingSkeleton cols={4} rows={4} />
      ) : classes.length === 0 ? (
        <div className="card p-8 text-center text-surface-500">No classes assigned to you.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="card-header flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-surface-900 text-lg">{cls.subjectId?.subjectName}</h3>
                  <p className="text-xs text-surface-500 mt-0.5">{cls.subjectId?.subjectCode}</p>
                </div>
                <span className="badge bg-primary-100 text-primary-700">{cls.room}</span>
              </div>
              <div className="card-body space-y-4">
                <div className="space-y-2 text-sm text-surface-600">
                  <p><strong>Department:</strong> {cls.departmentId?.name}</p>
                  <p><strong>Year / Section:</strong> Year {cls.year} - {cls.section}</p>
                  <p><strong>Schedule:</strong> {cls.schedule?.day} at {cls.schedule?.startTime} - {cls.schedule?.endTime} (Period {cls.schedule?.period})</p>
                </div>
                <button
                  onClick={() => navigate('/faculty/start-attendance', { state: { classId: cls._id, subjectId: cls.subjectId?._id } })}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2"
                >
                  <Play className="w-4 h-4" /> Start Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
