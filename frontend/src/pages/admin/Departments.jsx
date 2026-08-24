import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Modal, SearchInput, ConfirmDialog, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', hod: '' });

  useEffect(() => { fetchDepartments(); }, []);
  const fetchDepartments = async () => {
    try { const res = await api.get('/departments'); setDepartments(res.data); } catch(e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/departments/${editing._id}`, form); toast.success('Updated'); }
      else { await api.post('/departments', form); toast.success('Created'); }
      fetchDepartments(); setShowModal(false); resetForm();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/departments/${showDelete._id}`); toast.success('Deleted'); fetchDepartments(); setShowDelete(null); } catch(e) { toast.error('Failed'); }
  };

  const resetForm = () => { setForm({ name: '', code: '', description: '', hod: '' }); setEditing(null); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, code: d.code, description: d.description || '', hod: d.hod || '' }); setShowModal(true); };

  return (
    <div className="page-container">
      <PageHeader title="Department Management" subtitle={`${departments.length} departments`}
        actions={<button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Department</button>} />
      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton /></div> : departments.length === 0 ? <EmptyState icon={Building2} title="No departments" description="Add departments to get started" /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-surface-100 bg-surface-50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Code</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Name</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">HOD</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Description</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
          </tr></thead><tbody>
            {departments.map(d => (
              <tr key={d._id} className="table-row">
                <td className="px-6 py-3 font-mono text-sm text-primary-600 font-semibold">{d.code}</td>
                <td className="px-6 py-3 font-medium text-surface-900">{d.name}</td>
                <td className="px-6 py-3 text-surface-600">{d.hod || '—'}</td>
                <td className="px-6 py-3 text-sm text-surface-500 max-w-xs truncate">{d.description || '—'}</td>
                <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setShowDelete(d)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="input-field" required /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Code *</label><input value={form.code} onChange={e => setForm({...form,code:e.target.value})} className="input-field" required /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">HOD</label><input value={form.hod} onChange={e => setForm({...form,hod:e.target.value})} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="input-field" rows={3} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => {setShowModal(false);resetForm();}} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing?'Update':'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Department" message={`Delete ${showDelete?.name}?`} />
    </div>
  );
}
