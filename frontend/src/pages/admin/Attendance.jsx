import { useState, useEffect } from 'react';
import { ClipboardCheck, Download } from 'lucide-react';
import { PageHeader, StatusBadge, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchAttendance(); }, [date]);
  const fetchAttendance = async () => {
    setLoading(true);
    try { const res = await api.get(`/attendance?date=${date}`); setRecords(res.data.records || []); }
    catch(e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;

  const exportCSV = () => {
    const headers = 'Student ID,Name,Subject,Status,Time,Confidence,Method\n';
    const rows = records.map(r =>
      `${r.studentId?.studentId||''},${r.studentId?.fullName||''},${r.subjectId?.subjectName||''},${r.status},${r.time||''},${r.recognitionConfidence||''},${r.recognitionMethod||''}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${date}.csv`; a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="page-container">
      <PageHeader title="Attendance Records" subtitle="View and manage attendance data"
        actions={<div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> CSV</button>
        </div>} />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center"><p className="text-3xl font-bold text-surface-900">{records.length}</p><p className="text-sm text-surface-500">Total Records</p></div>
        <div className="stat-card text-center"><p className="text-3xl font-bold text-emerald-600">{present}</p><p className="text-sm text-surface-500">Present</p></div>
        <div className="stat-card text-center"><p className="text-3xl font-bold text-red-600">{absent}</p><p className="text-sm text-surface-500">Absent</p></div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton /></div> : records.length === 0 ? <EmptyState icon={ClipboardCheck} title="No records" description={`No attendance records for ${date}`} /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-surface-100 bg-surface-50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Student</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Time</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Confidence</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Method</th>
          </tr></thead><tbody>
            {records.map(r => (
              <tr key={r._id} className="table-row">
                <td className="px-6 py-3"><div><span className="font-medium text-surface-900">{r.studentId?.fullName||'N/A'}</span><br/><span className="text-xs text-surface-400">{r.studentId?.studentId}</span></div></td>
                <td className="px-6 py-3 text-sm text-surface-600">{r.subjectId?.subjectName||'N/A'}</td>
                <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-6 py-3 text-sm text-surface-600">{r.time||'—'}</td>
                <td className="px-6 py-3 text-sm font-medium">{r.recognitionConfidence ? `${r.recognitionConfidence}%` : '—'}</td>
                <td className="px-6 py-3"><span className="badge bg-surface-100 text-surface-600 text-xs">{r.recognitionMethod === 'FACE_RECOGNITION' ? '🤖 Face' : '✋ Manual'}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
