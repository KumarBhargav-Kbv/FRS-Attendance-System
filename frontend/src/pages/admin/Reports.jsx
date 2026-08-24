import { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/daily?date=${date}`;
      if (reportType === 'monthly') {
        url = `/reports/monthly?month=${month}&year=${year}`;
      }
      const res = await api.get(url);
      setReportData(res.data);
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, date, month, year]);

  const exportCSV = () => {
    if (!reportData) return;
    let headers = '';
    let rows = '';
    let filename = '';

    if (reportType === 'daily') {
      headers = 'Student ID,Name,Subject,Status,Time,Method\n';
      rows = (reportData.records || []).map(r =>
        `"${r.studentId?.studentId || ''}","${r.studentId?.fullName || ''}","${r.subjectId?.subjectName || ''}","${r.status}","${r.time || ''}","${r.recognitionMethod || ''}"`
      ).join('\n');
      filename = `daily_report_${date}.csv`;
    } else {
      headers = 'Date,Total Records,Present,Absent,Late,Attendance %\n';
      rows = (reportData.dailyStats || []).map(s =>
        `"${s.date}",${s.total},${s.present},${s.absent},${s.late},${s.percentage}%`
      ).join('\n');
      filename = `monthly_report_${year}_${month}.csv`;
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toast.success('CSV Report exported');
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Report Generator" subtitle="Generate and export system-wide attendance reports" />

      {/* Filters Card */}
      <div className="card">
        <div className="card-body flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="daily">Daily Attendance Summary</option>
              <option value="monthly">Monthly Aggregate Summary</option>
            </select>
          </div>

          {reportType === 'daily' ? (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Select Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-field"
              />
            </div>
          ) : (
            <div className="flex-2 flex gap-4 w-full">
              <div className="flex-1">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Month</label>
                <select
                  value={month}
                  onChange={e => setMonth(parseInt(e.target.value))}
                  className="input-field"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Year</label>
                <select
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                  className="input-field"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button onClick={exportCSV} className="btn-secondary w-full md:w-auto flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {reportData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="stat-card">
            <p className="text-sm font-medium text-surface-400">Total Records</p>
            <p className="text-3xl font-bold text-surface-900 mt-1">{reportData.summary.total}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm font-medium text-surface-400">Present Sessions</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{reportData.summary.present}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm font-medium text-surface-400">Absent Sessions</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{reportData.summary.absent}</p>
          </div>
          <div className="stat-card animate-glow">
            <p className="text-sm font-medium text-surface-400">Attendance Percentage</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">{reportData.summary.percentage}%</p>
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={6} /></div>
        ) : !reportData || (reportType === 'daily' && !reportData.records?.length) || (reportType === 'monthly' && !reportData.dailyStats?.length) ? (
          <EmptyState icon={FileBarChart} title="No data found" description="Adjust your filters or generate a new report" />
        ) : reportType === 'daily' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Method</th>
                </tr>
              </thead>
              <tbody>
                {reportData.records.map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3 font-mono text-sm text-primary-600 font-semibold">{r.studentId?.studentId}</td>
                    <td className="px-6 py-3 font-medium text-surface-900">{r.studentId?.fullName}</td>
                    <td className="px-6 py-3 text-sm text-surface-600">{r.subjectId?.subjectName}</td>
                    <td className="px-6 py-3"><span className={`badge ${r.status === 'PRESENT' ? 'badge-present' : r.status === 'LATE' ? 'badge-late' : 'badge-absent'}`}>{r.status}</span></td>
                    <td className="px-6 py-3 text-sm text-surface-500">{r.time || '—'}</td>
                    <td className="px-6 py-3 text-sm text-surface-500">{r.recognitionMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Total Sessions</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Present</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Absent</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Late</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.dailyStats.map((s, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3 font-medium text-surface-900">{s.date}</td>
                    <td className="px-6 py-3 text-sm text-surface-600">{s.total}</td>
                    <td className="px-6 py-3 text-sm text-emerald-600 font-semibold">{s.present}</td>
                    <td className="px-6 py-3 text-sm text-red-600 font-semibold">{s.absent}</td>
                    <td className="px-6 py-3 text-sm text-amber-600">{s.late}</td>
                    <td className="px-6 py-3 text-sm font-bold text-primary-600">{s.percentage}%</td>
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
