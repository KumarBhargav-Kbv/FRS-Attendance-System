import { useState, useEffect } from 'react';
import { DoorOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Modal, ConfirmDialog, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ departmentId: '', year: 4, section: 'A', subjectId: '', facultyId: '', room: 'B1.308', schedule: { day: 'Monday', startTime: '09:00', endTime: '09:50', period: 1 } });

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    try { const [c,d,s,f] = await Promise.all([api.get('/classes'),api.get('/departments'),api.get('/subjects'),api.get('/faculty')]); setClasses(c.data); setDepartments(d.data); setSubjects(s.data); setFaculty(f.data); } catch(e){}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/classes/${editing._id}`, form); toast.success('Updated'); }
      else { await api.post('/classes', form); toast.success('Created'); }
      fetchAll(); setShowModal(false); resetForm();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };
  const handleDelete = async () => { try { await api.delete(`/classes/${showDelete._id}`); toast.success('Deleted'); fetchAll(); setShowDelete(null); } catch(e) { toast.error('Failed'); } };
  const resetForm = () => { setForm({ departmentId: '', year: 4, section: 'A', subjectId: '', facultyId: '', room: 'B1.308', schedule: { day: 'Monday', startTime: '09:00', endTime: '09:50', period: 1 } }); setEditing(null); };
  const openEdit = (c) => { setEditing(c); setForm({ departmentId: c.departmentId?._id||'', year: c.year, section: c.section, subjectId: c.subjectId?._id||'', facultyId: c.facultyId?._id||'', room: c.room||'', schedule: c.schedule||{day:'Monday',startTime:'09:00',endTime:'09:50',period:1} }); setShowModal(true); };

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <div className="page-container">
      <PageHeader title="Class Management" subtitle={`${classes.length} classes`}
        actions={<button onClick={()=>{resetForm();setShowModal(true);}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Class</button>} />
      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton /></div> : classes.length===0 ? <EmptyState icon={DoorOpen} title="No classes" description="Add classes" /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-surface-100 bg-surface-50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Subject</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Department</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Year/Sec</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Faculty</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Schedule</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Room</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
          </tr></thead><tbody>
            {classes.map(c => (
              <tr key={c._id} className="table-row">
                <td className="px-6 py-3 font-medium text-surface-900">{c.subjectId?.subjectName||'N/A'}<br/><span className="text-xs text-surface-400">{c.subjectId?.subjectCode}</span></td>
                <td className="px-6 py-3 text-sm text-surface-600">{c.departmentId?.code||'N/A'}</td>
                <td className="px-6 py-3 text-sm text-surface-600">Y{c.year}/{c.section}</td>
                <td className="px-6 py-3 text-sm text-surface-600">{c.facultyId?.fullName||'N/A'}</td>
                <td className="px-6 py-3 text-sm text-surface-600">{c.schedule?.day?.slice(0,3)} P{c.schedule?.period}<br/><span className="text-xs text-surface-400">{c.schedule?.startTime}-{c.schedule?.endTime}</span></td>
                <td className="px-6 py-3 text-sm text-surface-600">{c.room||'—'}</td>
                <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                  <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={()=>setShowDelete(c)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
      <Modal isOpen={showModal} onClose={()=>{setShowModal(false);resetForm();}} title={editing?'Edit Class':'Add Class'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Department *</label><select value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})} className="input-field" required><option value="">Select</option>{departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Subject *</label><select value={form.subjectId} onChange={e=>setForm({...form,subjectId:e.target.value})} className="input-field" required><option value="">Select</option>{subjects.map(s=><option key={s._id} value={s._id}>{s.subjectName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Faculty *</label><select value={form.facultyId} onChange={e=>setForm({...form,facultyId:e.target.value})} className="input-field" required><option value="">Select</option>{faculty.map(f=><option key={f._id} value={f._id}>{f.fullName}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Year *</label><select value={form.year} onChange={e=>setForm({...form,year:parseInt(e.target.value)})} className="input-field">{[1,2,3,4].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Section *</label><input value={form.section} onChange={e=>setForm({...form,section:e.target.value})} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Room</label><input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Day</label><select value={form.schedule.day} onChange={e=>setForm({...form,schedule:{...form.schedule,day:e.target.value}})} className="input-field">{days.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Period</label><select value={form.schedule.period} onChange={e=>setForm({...form,schedule:{...form.schedule,period:parseInt(e.target.value)}})} className="input-field">{[1,2,3,4,5,6,7].map(p=><option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Start Time</label><input type="time" value={form.schedule.startTime} onChange={e=>setForm({...form,schedule:{...form.schedule,startTime:e.target.value}})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">End Time</label><input type="time" value={form.schedule.endTime} onChange={e=>setForm({...form,schedule:{...form.schedule,endTime:e.target.value}})} className="input-field" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={()=>{setShowModal(false);resetForm();}} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing?'Update':'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!showDelete} onClose={()=>setShowDelete(null)} onConfirm={handleDelete} title="Delete Class" message="Delete this class?" />
    </div>
  );
}
