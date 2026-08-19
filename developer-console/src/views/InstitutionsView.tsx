import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { InstitutionPayload } from '../services/api';
import { InstitutionDetailsView } from './InstitutionDetailsView';

export const InstitutionsView: React.FC = () => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<any>(null);
  const [viewingInstId, setViewingInstId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'school' | 'college'>('college');
  const [subscription, setSubscription] = useState('active');
  const [deptsText, setDeptsText] = useState('CSE, ECE, Civil, Mechanical, AIML');
  const [yearsText, setYearsText] = useState('1st Year, 2nd Year, 3rd Year, 4th Year');
  const [coursesText, setCoursesText] = useState('B.Tech, M.Tech');

  const handleTypeChange = (val: 'school' | 'college') => {
    setType(val);
    if (val === 'school') {
      setDeptsText('Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10');
      setYearsText('A, B, C');
      setCoursesText('');
    } else {
      setDeptsText('CSE, ECE, Civil, Mechanical, AIML');
      setYearsText('1st Year, 2nd Year, 3rd Year, 4th Year');
      setCoursesText('B.Tech, M.Tech');
    }
  };
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
          <h1 className="page-title">Institutions</h1>
          <p className="page-subtitle">Manage onboarded schools, colleges, and academic structures</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create institution
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Loading institutions...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Code</th>
                <th>Type</th>
                <th>Subscription</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty">
                      <div className="table-empty-icon" style={{ fontWeight: 700 }}>[ ]</div>
                      <div className="table-empty-text">No institutions registered</div>
                      <div className="table-empty-hint">Click &quot;+ Create institution&quot; to onboard your first school or college</div>
                    </div>
                  </td>
                </tr>
              ) : (
                institutions.map((inst) => (
                  <tr key={inst.id}>
                    <td style={{ fontWeight: 600 }}>{inst.institutionName}</td>
                    <td><code>{inst.institutionCode}</code></td>
                    <td>
                      <span className={`badge ${inst.institutionType === 'school' ? 'badge-school' : 'badge-college'}`}>
                        {inst.institutionType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${inst.subscriptionStatus === 'active' ? 'badge-active' : inst.subscriptionStatus === 'trial' ? 'badge-trial' : 'badge-inactive'}`}>
                        {inst.subscriptionStatus || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewingInstId(inst.id)}>
                          View
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(inst)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inst.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInst ? 'Edit institution' : 'Create institution'}
              </h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-input)',
                fontSize: '13px', marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Institution name *</label>
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
                <label className="form-label">Institution code *</label>
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
                  <label className="form-label">Type</label>
                  <select className="input" value={type} onChange={(e) => handleTypeChange(e.target.value as any)}>
                    <option value="college">College</option>
                    <option value="school">School</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subscription</label>
                  <select className="input" value={subscription} onChange={(e) => setSubscription(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {type === 'college' ? (
                <>
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
                    <label className="form-label">Academic years (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 1st Year, 2nd Year, 3rd Year"
                      value={yearsText}
                      onChange={(e) => setYearsText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Courses (optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. B.Tech, M.Tech, MBA"
                      value={coursesText}
                      onChange={(e) => setCoursesText(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Classes (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Class 1, Class 2, Class 3"
                      value={deptsText}
                      onChange={(e) => setDeptsText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sections (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. A, B, C"
                      value={yearsText}
                      onChange={(e) => setYearsText(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="action-bar">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingInst ? 'Save changes' : 'Create institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Institution Details Modal */}
      <InstitutionDetailsView
        institutionId={viewingInstId}
        onClose={() => setViewingInstId(null)}
      />
    </div>
  );
};
