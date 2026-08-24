import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    attendanceThreshold: 75,
    recognitionConfidenceThreshold: 60,
    instituteName: 'Sri Vasavi Institute of Engineering & Technology',
    instituteCode: 'SVIET'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data))
      .catch(e => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      toast.success('Settings updated successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return <div className="page-container"><p className="text-surface-500">Loading settings...</p></div>;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="System Settings" subtitle="Configure institute parameters and threshold metrics" />
      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="card">
          <div className="card-body space-y-6">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Institute Name</label>
              <input
                type="text"
                value={settings.instituteName}
                onChange={e => setSettings({ ...settings, instituteName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Institute Code</label>
              <input
                type="text"
                value={settings.instituteCode}
                onChange={e => setSettings({ ...settings, instituteCode: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Attendance Defaulter Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.attendanceThreshold}
                onChange={e => setSettings({ ...settings, attendanceThreshold: parseInt(e.target.value) })}
                className="input-field"
                required
              />
              <p className="text-xs text-surface-400 mt-1">Students below this percentage will get warning notices.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Face Match Confidence Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.recognitionConfidenceThreshold}
                onChange={e => setSettings({ ...settings, recognitionConfidenceThreshold: parseInt(e.target.value) })}
                className="input-field"
                required
              />
              <p className="text-xs text-surface-400 mt-1">Minimum similarity rate required to auto-identify students.</p>
            </div>

            <div className="pt-4 border-t border-surface-100 flex justify-end">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
