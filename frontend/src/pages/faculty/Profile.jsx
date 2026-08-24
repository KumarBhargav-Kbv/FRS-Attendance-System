import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import api from '../../services/api';

export default function FacultyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data.profile))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><p className="text-surface-500">Loading profile...</p></div>;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Faculty Profile" subtitle="Your official institution credentials and contact info" />
      <div className="max-w-2xl">
        <div className="card">
          <div className="card-body space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-surface-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {profile?.fullName?.[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-surface-900">{profile?.fullName}</h3>
                <p className="text-sm text-surface-500">{profile?.facultyId}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-400 font-semibold mb-1">EMAIL ADDRESS</p>
                <div className="flex items-center gap-2 text-surface-700">
                  <Mail className="w-4 h-4 text-surface-400" />
                  <span>{profile?.email}</span>
                </div>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-400 font-semibold mb-1">PHONE NUMBER</p>
                <div className="flex items-center gap-2 text-surface-700">
                  <Phone className="w-4 h-4 text-surface-400" />
                  <span>{profile?.phone || 'Not Configured'}</span>
                </div>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-400 font-semibold mb-1">INSTITUTE DEPARTMENT</p>
                <div className="flex items-center gap-2 text-surface-700">
                  <Shield className="w-4 h-4 text-surface-400" />
                  <span>{profile?.departmentId?.name} ({profile?.departmentId?.code})</span>
                </div>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-400 font-semibold mb-1">ACCOUNT ROLE</p>
                <div className="flex items-center gap-2 text-surface-700">
                  <User className="w-4 h-4 text-surface-400" />
                  <span className="badge bg-emerald-100 text-emerald-700">FACULTY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
