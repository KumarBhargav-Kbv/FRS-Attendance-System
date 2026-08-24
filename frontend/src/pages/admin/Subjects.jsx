import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Modal, SearchInput, ConfirmDialog, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ subjectCode: '', subjectName: '', departmentId: '', year: 4, semester: 1, facultyId: '' });

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    try { const [s,d,f] = await Promise.all([api.get('/subjects'),api.get('/departments'),api.get('/faculty')]); setSubjects(s.data); setDepartments(d.data); setFaculty(f.data); } catch(e){}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/subjects/${editing._id}`, form); toast.success('Updated'); }
      else { await api.post('/subjects', form); toast.success('Created'); }
      fetchAll(); setShowModal(false); resetForm();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => { try { await api.delete(`/subjects/${showDelete._id}`); toast.success('Deleted'); fetchAll(); setShowDelete(null); } catch(e) { toast.error('Failed'); } };
  const resetForm = () => { setForm({ subjectCode: '', subjectName: '', departmentId: '', year: 4, semester: 1, facultyId: '' }); setEditing(null); };
  const openEdit = (s) => { setEditing(s); setForm({ subjectCode: s.subjectCode, subjectName: s.subjectName, departmentId: s.departmentId?._id||'', year: s.year, semester: s.semester, facultyId: s.facultyId?._id||'' }); setShowModal(true); };

  return (
    <div className="page-container">
      <PageHeader title="Subject Management" subtitle={`${subjects.length} subjects`}
        actions={<button onClick={() => {resetForm();setShowModal(true);}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Subject</button>} />
      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton /></div> : subjects.length===0 ? <EmptyState icon={BookOpen} title="No subjects" description="Add subjects" /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-surface-100 bg-surface-50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Code</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Department</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Year/Sem</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Faculty</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
          </tr></thead><tbody>
            {subjects.map(s => (
              <tr key={s._id} className="table-row">
                <td className="px-6 py-3 font-mono text-sm text-primary-600 font-semibold">{s.subjectCode}</td>
                <td className="px-6 py-3 font-medium text-surface-900">{s.subjectName}</td>
                <td className="px-6 py-3 text-sm text-surface-600">{s.departmentId?.name||'N/A'}</td>
                <td className="px-6 py-3 text-sm text-surface-600">Y{s.year}/S{s.semester}</td>
                <td className="px-6 py-3 text-sm text-surface-600">{s.facultyId?.fullName||'Unassigned'}</td>
                <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                  <button onClick={()=>openEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={()=>setShowDelete(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
      <Modal isOpen={showModal} onClose={()=>{setShowModal(false);resetForm();}} title={editing?'Edit Subject':'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Code *</label><input value={form.subjectCode} onChange={e=>setForm({...form,subjectCode:e.target.value})} className="input-field" required disabled={!!editing} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Name *</label><input value={form.subjectName} onChange={e=>setForm({...form,subjectName:e.target.value})} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Department *</label><select value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})} className="input-field" required><option value="">Select</option>{departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Faculty</label><select value={form.facultyId} onChange={e=>setForm({...form,facultyId:e.target.value})} className="input-field"><option value="">Unassigned</option>{faculty.map(f=><option key={f._id} value={f._id}>{f.fullName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Year *</label><select value={form.year} onChange={e=>setForm({...form,year:parseInt(e.target.value)})} className="input-field">{[1,2,3,4].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Semester *</label><select value={form.semester} onChange={e=>setForm({...form,semester:parseInt(e.target.value)})} className="input-field">{[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={()=>{setShowModal(false);resetForm();}} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing?'Update':'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!showDelete} onClose={()=>setShowDelete(null)} onConfirm={handleDelete} title="Delete Subject" message={`Delete ${showDelete?.subjectName}?`} />
    </div>
  );
}
