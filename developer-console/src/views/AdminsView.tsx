import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { AdminPayload } from '../services/api';

export const AdminsView: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInstCode, setSelectedInstCode] = useState('');
  const [role, setRole] = useState('admin');
  const [title, setTitle] = useState('');
  const [scopeDepts, setScopeDepts] = useState('');
  const [scopeYears, setScopeYears] = useState('');
  const [permissionsText, setPermissionsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsData, instsData] = await Promise.all([
        developerApi.getAdmins(),
        developerApi.getInstitutions(),
      ]);
      setAdmins(Array.isArray(adminsData) ? adminsData : []);
      const instList = Array.isArray(instsData) ? instsData : [];
      setInstitutions(instList);
      if (instList.length > 0) {
        setSelectedInstCode(instList[0].institutionCode);
      }
    } catch (err: any) {
      console.warn('[Admins Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('TempPass123!');
    setRole('admin');
    setTitle('Institution Admin');
    setScopeDepts('');
    setScopeYears('');
    setPermissionsText('Manage Students, Manage Teachers, Attendance, Institution Settings');
    setError('');
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    resetForm();
    if (institutions.length > 0) {
      setSelectedInstCode(institutions[0].institutionCode);
    }
    setModalOpen(true);
  };

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin);
    setFullName(admin.fullName || '');
    setEmail(admin.email || '');
    setPhone(admin.phone || '');
    setPassword('');
    setSelectedInstCode(admin.institutionCode || '');
    setRole(admin.role || 'admin');
    setTitle(admin.title || 'Institution Admin');
    const scope = admin.scope || {};
    setScopeDepts(Array.isArray(scope.departments) ? scope.departments.join(', ') : '');
    setScopeYears(Array.isArray(scope.academicYears) ? scope.academicYears.join(', ') : '');
    setPermissionsText(Array.isArray(admin.permissions) ? admin.permissions.join(', ') : '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !selectedInstCode) {
      setError('Full Name, Email, and Institution are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const departments = scopeDepts.split(',').map((s) => s.trim()).filter(Boolean);
    const academicYears = scopeYears.split(',').map((s) => s.trim()).filter(Boolean);
    const permissions = permissionsText.split(',').map((s) => s.trim()).filter(Boolean);

    const payload: AdminPayload = {
      fullName,
      email,
      phone,
      role,
      institutionCode: selectedInstCode,
      title: title || 'Institution Admin',
      scope: { departments, academicYears },
      permissions,
    };

    if (!editingAdmin) {
      payload.password = password || 'TempPass123!';
    }

    try {
      if (editingAdmin) {
        await developerApi.updateAdmin(editingAdmin.id, payload);
      } else {
        await developerApi.createAdmin(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this administrator?')) {
      try {
        await developerApi.deleteAdmin(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete administrator');
      }
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Institution Admins</h1>
          <p className="page-subtitle">Manage administrator accounts assigned to onboarded institutions</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create admin
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Loading administrators...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Institution</th>
                <th>Role</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty">
                      <div className="table-empty-icon" style={{ fontWeight: 700 }}>@</div>
                      <div className="table-empty-text">No institution admins created</div>
                      <div className="table-empty-hint">Click &quot;+ Create admin&quot; to assign an administrator</div>
                    </div>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td style={{ fontWeight: 600 }}>{admin.fullName}</td>
                    <td>{admin.email}</td>
                    <td><code>{admin.institutionName || admin.institutionCode}</code></td>
                    <td>
                      <span className={`badge ${admin.role === 'admin' ? 'badge-college' : 'badge-school'}`}>
                        {admin.role ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1) : 'Institution Admin'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(admin)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(admin.id)}>
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

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingAdmin ? 'Edit institution admin' : 'Create institution admin'}
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
                <label className="form-label">Full name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email address *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. john.smith@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="+1 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned institution *</label>
                <select className="input" value={selectedInstCode} onChange={(e) => setSelectedInstCode(e.target.value)} required>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.institutionCode}>
                      {inst.institutionName} ({inst.institutionCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="principal">Principal</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="accountant">Accountant</option>
                  <option value="hod">HOD</option>
                  <option value="librarian">Librarian</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. School Principal, College Dean"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Scope departments</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. CSE, ECE, ME"
                    value={scopeDepts}
                    onChange={(e) => setScopeDepts(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Scope academic years</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 2024-2025, 2025-2026"
                    value={scopeYears}
                    onChange={(e) => setScopeYears(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Permissions (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Manage Students, Manage Teachers, Attendance"
                  value={permissionsText}
                  onChange={(e) => setPermissionsText(e.target.value)}
                />
              </div>

              {!editingAdmin && (
                <div className="form-group">
                  <label className="form-label">Temporary password *</label>
                  <input
                    type="text"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    User will be prompted to change password on first mobile login.
                  </span>
                </div>
              )}

              <div className="action-bar">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAdmin ? 'Save changes' : 'Create admin account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
