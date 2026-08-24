import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StartAttendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(location.state?.classId || '');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(location.state?.subjectId || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/faculty-dashboard')
      .then(res => {
        setClasses(res.data.classes || []);
        // Populate subject options from classes
        const subs = (res.data.classes || []).map(c => c.subjectId).filter((val, idx, self) => self.findIndex(t => t?._id === val?._id) === idx);
        setSubjects(subs);
      })
      .catch(e => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject) {
      toast.error('Please select both class and subject');
      return;
    }

    try {
      const res = await api.post('/attendance/session', {
        classId: selectedClass,
        subjectId: selectedSubject
      });
      toast.success('Attendance session started!');
      navigate('/faculty/live-attendance', { state: { sessionId: res.data._id } });
    } catch (err) {
      if (err.response?.data?.session) {
        toast.success('Resuming existing active session');
        navigate('/faculty/live-attendance', { state: { sessionId: err.response.data.session._id } });
      } else {
        toast.error(err.response?.data?.message || 'Failed to start session');
      }
    }
  };

  if (loading) return <div className="page-container"><p className="text-surface-500">Loading configurations...</p></div>;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Start Attendance Session" subtitle="Set up class parameters and launch real-time face tracking" />
      <div className="max-w-xl">
        <form onSubmit={handleStart} className="card">
          <div className="card-body space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Select Class Section</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="input-field"
                required
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.departmentId?.code} Year {c.year} - {c.section} ({c.room})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Select Course / Subject</label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="input-field"
                required
              >
                <option value="">-- Choose Course --</option>
                {subjects.map(s => (
                  <option key={s?._id} value={s?._id}>{s?.subjectName} ({s?.subjectCode})</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-surface-100 flex justify-end">
              <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start Live Recognition Session
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
