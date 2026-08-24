import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Hash, Shield } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import api from '../../services/api';

export default function StudentProfile() {
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
      <PageHeader title="My Profile" subtitle="Your official university details, biometric state, and academic metadata" />
      <div className="max-w-2xl">
        <div className="card">
          <div className="card-body space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-surface-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {profile?.fullName?.[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-surface-900">{profile?.fullName}</h3>
                <p className="text-sm text-surface-500">ID: {profile?.studentId} • Roll: {profile?.rollNumber}</p>
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
                  <span>{profile?.phone || 'Not Registered'}</span>
                </div>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-400 font-semibold mb-1">DEPARTMENT / CODE</p>
                <div className="flex items-center gap-2 text-surface-700">
                  <Shield className="w-4 h-4 text-surface-400" />
                  <span>{profile?.departmentId?.name} ({profile?.departmentId?.code})</span>
                </div>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-400 font-semibold mb-1">YEAR / SECTION / BATCH</p>
                <div className="flex items-center gap-2 text-surface-700">
                  <Calendar className="w-4 h-4 text-surface-400" />
                  <span>Year {profile?.year} - {profile?.section} ({profile?.batch || '2024-2028'})</span>
                </div>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl col-span-2">
                <p className="text-xs text-surface-400 font-semibold mb-1">BIOMETRIC FACE REGISTRATION STATUS</p>
                <div className="flex items-center gap-2 mt-1">
                  {profile?.faceRegistered ? (
                    <span className="badge bg-emerald-100 text-emerald-700">✓ Biometric Face Data Enrolled</span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700">⚠ Biometric Data Pending. Contact Admin.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
