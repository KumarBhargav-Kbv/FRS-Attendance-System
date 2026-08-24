import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit-logs')
      .then(res => setLogs(res.data.logs || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Audit Trails" subtitle="System modification history and manual attendance changes" />
      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton rows={6} /></div> : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit logs" description="System is operating cleanly" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-3">
                      <span className="font-medium text-surface-900">{log.userId?.name || 'System'}</span>
                      <br /><span className="text-xs text-surface-400">{log.userId?.email}</span>
                    </td>
                    <td className="px-6 py-3"><span className="badge bg-purple-100 text-purple-700 font-mono text-xs">{log.action}</span></td>
                    <td className="px-6 py-3 text-sm text-surface-600">{log.description}</td>
                    <td className="px-6 py-3 text-sm text-surface-500">{new Date(log.createdAt).toLocaleString()}</td>
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
