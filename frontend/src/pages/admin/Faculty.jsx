import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Modal, StatusBadge, SearchInput, ConfirmDialog, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ facultyId: '', fullName: '', email: '', phone: '', departmentId: '' });

  useEffect(() => { fetchFaculty(); fetchDepts(); }, []);

  const fetchFaculty = async () => {
    try { const res = await api.get('/faculty'); setFaculty(res.data); } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  const fetchDepts = async () => { try { const res = await api.get('/departments'); setDepartments(res.data); } catch (e) {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/faculty/${editing._id}`, form); toast.success('Faculty updated'); }
      else { await api.post('/faculty', form); toast.success('Faculty created'); }
      fetchFaculty(); setShowModal(false); resetForm();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/faculty/${showDelete._id}`); toast.success('Deleted'); fetchFaculty(); setShowDelete(null); }
    catch (e) { toast.error('Delete failed'); }
  };

  const resetForm = () => { setForm({ facultyId: '', fullName: '', email: '', phone: '', departmentId: '' }); setEditing(null); };
  const openEdit = (f) => { setEditing(f); setForm({ facultyId: f.facultyId, fullName: f.fullName, email: f.email, phone: f.phone || '', departmentId: f.departmentId?._id || '' }); setShowModal(true); };

  const filtered = faculty.filter(f => f.fullName?.toLowerCase().includes(search.toLowerCase()) || f.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <PageHeader title="Faculty Management" subtitle={`${faculty.length} faculty members`}
        actions={<button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Faculty</button>} />
      <div className="max-w-md"><SearchInput value={search} onChange={setSearch} placeholder="Search faculty..." /></div>
      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton /></div> : filtered.length === 0 ? <EmptyState icon={Users} title="No faculty" description="Add faculty to get started" /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-surface-100 bg-surface-50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Faculty ID</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Name</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Department</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Email</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
          </tr></thead><tbody>
            {filtered.map(f => (
              <tr key={f._id} className="table-row">
                <td className="px-6 py-3 font-mono text-sm text-primary-600 font-medium">{f.facultyId}</td>
                <td className="px-6 py-3 font-medium text-surface-900">{f.fullName}</td>
                <td className="px-6 py-3 text-sm text-surface-600">{f.departmentId?.name || 'N/A'}</td>
                <td className="px-6 py-3 text-sm text-surface-500">{f.email}</td>
                <td className="px-6 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setShowDelete(f)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editing ? 'Edit Faculty' : 'Add Faculty'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Faculty ID *</label>
            <input value={form.facultyId} onChange={e => setForm({ ...form, facultyId: e.target.value })} className="input-field" required disabled={!!editing} /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Full Name *</label>
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input-field" required /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required disabled={!!editing} /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Department *</label>
            <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="input-field" required>
              <option value="">Select</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Faculty" message={`Delete ${showDelete?.fullName}?`} />
    </div>
  );
}
