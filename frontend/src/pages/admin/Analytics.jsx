import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeader, LoadingSkeleton } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(res => setData(res.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-container"><LoadingSkeleton rows={10} /></div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Analytics & Trends" subtitle="Detailed trends, department distributions, and visual attendance statistics" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Comparative Chart */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-surface-900">Weekly Comparative Statistics</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Rates */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-surface-900">Attendance Percentage Curve</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#0d9488" strokeWidth={3} activeDot={{ r: 8 }} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-surface-900">Department Performance Metrics</h3></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.departmentStats || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="code" type="category" />
              <Tooltip />
              <Bar dataKey="percentage" fill="#8b5cf6" name="Attendance %" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
