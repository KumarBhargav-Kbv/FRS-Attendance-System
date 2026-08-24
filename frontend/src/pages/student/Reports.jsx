import { useState, useEffect } from 'react';
import { FileBarChart, Download } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/student-dashboard')
      .then(res => setData(res.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data?.recentRecords) return;
    const headers = 'Date,Subject,Status,Time,Method\n';
    const rows = data.recentRecords.map(r =>
      `"${new Date(r.date).toLocaleDateString()}","${r.subjectId?.subjectName || ''}","${r.status}","${r.time || ''}","${r.recognitionMethod || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_attendance_report.csv`;
    a.click();
    toast.success('Attendance report exported successfully');
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="My Attendance Report"
        subtitle="Download or review your full academic attendance scorecard"
        actions={
          <button onClick={exportCSV} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Report Card (CSV)
          </button>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <div className="card-header"><h3 className="font-semibold text-surface-900 font-sans">Summary Scorecard</h3></div>
          <div className="card-body">
            {loading ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-surface-500 font-medium">Overall Attendance Percentage:</span>
                  <span className="font-bold text-lg text-primary-600">{data?.stats?.percentage}%</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-surface-500 font-medium">Total Registered Sessions:</span>
                  <span className="font-bold text-lg text-surface-800">{data?.stats?.total}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-surface-500 font-medium">Attended Sessions:</span>
                  <span className="font-bold text-lg text-emerald-600">{data?.stats?.present}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-surface-500 font-medium">Absences:</span>
                  <span className="font-bold text-lg text-red-600">{data?.stats?.absent}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
