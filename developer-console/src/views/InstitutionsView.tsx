import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { InstitutionPayload } from '../services/api';

export const InstitutionsView: React.FC = () => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'school' | 'college'>('college');
  const [subscription, setSubscription] = useState('active');
  const [deptsText, setDeptsText] = useState('CSE, ECE, Civil, Mechanical, AIML');
  const [yearsText, setYearsText] = useState('1st Year, 2nd Year, 3rd Year, 4th Year');
  const [coursesText, setCoursesText] = useState('B.Tech, M.Tech');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    developerApi
      .getInstitutions()
      .then((data) => setInstitutions(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('[Institutions Fetch Error]', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingInst(null);
    setName('');
    setCode('');
    setType('college');
    setSubscription('active');
    setDeptsText('CSE, ECE, Civil, Mechanical, AIML');
    setYearsText('1st Year, 2nd Year, 3rd Year, 4th Year');
    setCoursesText('B.Tech, M.Tech');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (inst: any) => {
    setEditingInst(inst);
    setName(inst.institutionName || '');
    setCode(inst.institutionCode || '');
    setType(inst.institutionType || 'college');
    setSubscription(inst.subscriptionStatus || 'active');
    setDeptsText(Array.isArray(inst.departments) ? inst.departments.join(', ') : inst.departments || '');
    setYearsText(Array.isArray(inst.academicYears) ? inst.academicYears.join(', ') : inst.academicYears || '');
    setCoursesText(Array.isArray(inst.courses) ? inst.courses.join(', ') : inst.courses || '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Institution Name and Code are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const departments = deptsText.split(',').map((s) => s.trim()).filter(Boolean);
    const academicYears = yearsText.split(',').map((s) => s.trim()).filter(Boolean);
    const courses = coursesText.split(',').map((s) => s.trim()).filter(Boolean);

    const payload: InstitutionPayload = {
      institutionName: name,
      institutionCode: code.toUpperCase(),
      institutionType: type,
      subscriptionStatus: subscription,
      departments,
      academicYears,
      courses,
    };

    try {
      if (editingInst) {
        await developerApi.updateInstitution(editingInst.id, payload);
      } else {
        await developerApi.createInstitution(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save institution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this institution?')) {
      try {
        await developerApi.deleteInstitution(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete institution');
      }
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Institution Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Configure onboarded schools, colleges, departments, and academic structures
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create Institution
        </button>
      </div>

      {loading ? (
        <div className="card">Loading institutions...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Institution Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Subscription Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No institutions registered yet. Click "+ Create Institution" above.
                </td>
              </tr>
            ) : (
              institutions.map((inst) => (
                <tr key={inst.id}>
                  <td style={{ fontWeight: 600 }}>{inst.institutionName}</td>
                  <td><code>{inst.institutionCode}</code></td>
                  <td>
                    <span className="badge badge-college">{inst.institutionType}</span>
                  </td>
                  <td>
                    <span className="badge badge-active">{inst.subscriptionStatus || 'Active'}</span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ height: '30px', fontSize: '12px', marginRight: '6px' }} onClick={() => openEditModal(inst)}>
                      Edit
                    </button>
                    <button className="btn btn-outline" style={{ height: '30px', fontSize: '12px', color: 'var(--color-danger)' }} onClick={() => handleDelete(inst.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editingInst ? 'Edit Institution' : 'Create New Institution'}
              </h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--color-danger)', padding: '10px', borderRadius: 'var(--radius-input)', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Institution Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Greenfield International School"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institution Code *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. GIS001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={Boolean(editingInst)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Institution Type</label>
                  <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="college">College</option>
                    <option value="school">School</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subscription Plan</label>
                  <select className="input" value={subscription} onChange={(e) => setSubscription(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Departments (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. CSE, ECE, ME, Civil"
                  value={deptsText}
                  onChange={(e) => setDeptsText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Academic Years (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 1st Year, 2nd Year, 3rd Year"
                  value={yearsText}
                  onChange={(e) => setYearsText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Courses (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. B.Tech, M.Tech, MBA"
                  value={coursesText}
                  onChange={(e) => setCoursesText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingInst ? 'Save Changes' : 'Create Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
