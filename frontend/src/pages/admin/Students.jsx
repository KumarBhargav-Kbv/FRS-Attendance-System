import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Eye, Edit2, Trash2, ScanFace, Download } from 'lucide-react';
import { PageHeader, Modal, StatusBadge, SearchInput, ConfirmDialog, EmptyState, LoadingSkeleton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({
    studentId: '', rollNumber: '', fullName: '', email: '', phone: '',
    gender: 'Male', departmentId: '', year: 1, section: 'A', batch: '2024-2028'
  });

  useEffect(() => { fetchStudents(); fetchDepartments(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.students || []);
    } catch (e) { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try { const res = await api.get('/departments'); setDepartments(res.data); } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent._id}`, form);
        toast.success('Student updated');
      } else {
        await api.post('/students', form);
        toast.success('Student created');
      }
      fetchStudents();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${showDelete._id}`);
      toast.success('Student deleted');
      fetchStudents();
      setShowDelete(null);
    } catch (e) { toast.error('Delete failed'); }
  };

  const resetForm = () => {
    setForm({ studentId: '', rollNumber: '', fullName: '', email: '', phone: '', gender: 'Male', departmentId: '', year: 1, section: 'A', batch: '2024-2028' });
    setEditingStudent(null);
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setForm({ studentId: s.studentId, rollNumber: s.rollNumber, fullName: s.fullName, email: s.email, phone: s.phone || '', gender: s.gender || 'Male', departmentId: s.departmentId?._id || '', year: s.year, section: s.section, batch: s.batch || '' });
    setShowModal(true);
  };

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader title="Student Management" subtitle={`${students.length} students registered`}
        actions={<button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Student</button>}
      />

      {/* Search */}
      <div className="max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Search students..." />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <div className="p-6"><LoadingSkeleton rows={8} cols={7} /></div> : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" description="Add students to get started" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Student ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Department</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Year / Section</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Face</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id} className="table-row">
                    <td className="px-6 py-3 font-mono text-sm text-primary-600 font-medium">{s.studentId}</td>
                    <td className="px-6 py-3">
                      <div><span className="font-medium text-surface-900">{s.fullName}</span></div>
                      <div className="text-xs text-surface-400">{s.email}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-surface-600">{s.departmentId?.name || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm text-surface-600">Year {s.year} / {s.section}</td>
                    <td className="px-6 py-3">
                      {s.faceRegistered ? (
                        <span className="badge bg-emerald-100 text-emerald-700"><ScanFace className="w-3 h-3 mr-1" />Registered</span>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setShowDelete(s)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingStudent ? 'Edit Student' : 'Add New Student'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Student ID *</label>
              <input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input-field" required disabled={!!editingStudent} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Roll Number *</label>
              <input value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} className="input-field" required /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Full Name *</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required disabled={!!editingStudent} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option>Male</option><option>Female</option><option>Other</option>
              </select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Department *</label>
              <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="input-field" required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Year *</label>
              <select value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} className="input-field">
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Section *</label>
              <input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Batch</label>
              <input value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="input-field" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingStudent ? 'Update' : 'Create'} Student</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Student Details" size="md">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-surface-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
                {showDetail.fullName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900">{showDetail.fullName}</h3>
                <p className="text-sm text-surface-500">{showDetail.studentId} • {showDetail.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Roll Number', showDetail.rollNumber], ['Department', showDetail.departmentId?.name],
                ['Year', `Year ${showDetail.year}`], ['Section', showDetail.section],
                ['Batch', showDetail.batch], ['Phone', showDetail.phone || 'N/A'],
                ['Gender', showDetail.gender], ['Status', showDetail.status],
                ['Face Registered', showDetail.faceRegistered ? '✅ Yes' : '❌ No'],
              ].map(([label, value], i) => (
                <div key={i} className="p-3 bg-surface-50 rounded-xl">
                  <p className="text-xs text-surface-400 mb-0.5">{label}</p>
                  <p className="font-medium text-surface-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete}
        title="Delete Student" message={`Are you sure you want to delete ${showDelete?.fullName}? This action cannot be undone.`} />
    </div>
  );
}
