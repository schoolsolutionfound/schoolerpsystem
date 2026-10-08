import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { AdminPayload } from '../services/api';
import { InstitutionSelect } from '../components/InstitutionSelect';

const PAGE_SIZE = 50;

export const AdminsView: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [defaultInstCode, setDefaultInstCode] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [instFilter, setInstFilter] = useState('');
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
  const [authWarning, setAuthWarning] = useState('');

  // Reset-password state
  const [resetAdmin, setResetAdmin] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Prefetch a single institution to pre-select in the create modal.
  useEffect(() => {
    developerApi
      .getInstitutions({ limit: 1 })
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) {
          setDefaultInstCode(data[0].institutionCode);
          setSelectedInstCode(data[0].institutionCode);
        }
      })
      .catch((err) => console.warn('[Institutions Fetch Error]', err.message));
  }, []);

  const loadAdmins = (pageToLoad: number, inst: string) => {
    setLoading(true);
    developerApi
      .getAdmins({
        institutionCode: inst || undefined,
        limit: PAGE_SIZE,
        offset: pageToLoad * PAGE_SIZE,
      })
      .then((res) => {
        setAdmins(Array.isArray(res?.data) ? res.data : []);
        setTotal(typeof res?.total === 'number' ? res.total : 0);
      })
      .catch((err) => console.warn('[Admins Fetch Error]', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdmins(page, instFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, instFilter]);

  const onFilterChange = (code: string) => {
    setInstFilter(code);
    if (page !== 0) setPage(0);
  };

  const refresh = () => loadAdmins(page, instFilter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterActive = instFilter !== '';

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
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
    if (defaultInstCode) {
      setSelectedInstCode(defaultInstCode);
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
      if (!password) {
        setError('Password is required for new administrators.');
        setSubmitting(false);
        return;
      }
      payload.password = password;
    }

    try {
      if (editingAdmin) {
        await developerApi.updateAdmin(editingAdmin.id, payload);
      } else {
        const created: any = await developerApi.createAdmin(payload);
        if (created?.authStatus === 'skipped') {
          setAuthWarning(
            'Institution admin was saved, but the server could not create a Firebase auth account (Firebase Admin not initialized). Email/password login will NOT work until the server is restarted with Firebase credentials.'
          );
        }
      }
      if (editingAdmin) {
        refresh();
      } else {
        // New admin — jump to the first page so it is visible.
        setPage(0);
        loadAdmins(0, instFilter);
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const openResetModal = (admin: any) => {
    setResetAdmin(admin);
    setResetPassword('');
    setResetMsg('');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const arr = new Uint32Array(12);
    crypto.getRandomValues(arr);
    setResetPassword(Array.from(arr, (n) => chars[n % chars.length]).join(''));
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAdmin) return;
    setResetBusy(true);
    setResetMsg('');
    try {
      await developerApi.resetAdminPassword(resetAdmin.id, resetPassword);
      setResetMsg(`Password for ${resetAdmin.email} has been reset. Share it securely — the user must change it on their next login.`);
    } catch (err: any) {
      setResetMsg(err.message || 'Failed to reset password.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this administrator?')) {
      try {
        await developerApi.deleteAdmin(id);
        if (page > 0 && admins.length === 1) {
          setPage(page - 1);
        } else {
          refresh();
        }
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

      {authWarning && (
        <div
          style={{
            backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)',
            color: 'var(--color-warning)', padding: '10px 14px', borderRadius: 'var(--radius-input)',
            fontSize: '13px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', gap: '12px',
          }}
        >
          <span>{authWarning}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setAuthWarning('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <InstitutionSelect
          value={instFilter}
          onChange={(code) => onFilterChange(code)}
          allowAll
          allLabel="All institutions"
          placeholder="Filter by institution..."
          style={{ flex: 1, minWidth: '240px', maxWidth: '420px' }}
        />
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {loading ? 'Loading...' : `${total} administrator${total === 1 ? '' : 's'}`}
        </span>
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
                      <div className="table-empty-text">
                        {filterActive ? 'No administrators for this institution' : 'No institution admins created'}
                      </div>
                      <div className="table-empty-hint">
                        {filterActive
                          ? 'Choose a different institution or clear the filter'
                          : 'Click &quot;+ Create admin&quot; to assign an administrator'}
                      </div>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => openResetModal(admin)}>
                          Reset password
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

          {!loading && admins.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Showing {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 0 || loading}
                  onClick={() => setPage(page - 1)}
                >
                  &larr; Previous
                </button>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
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
                <InstitutionSelect
                  value={selectedInstCode}
                  onChange={(code) => setSelectedInstCode(code)}
                  placeholder="Search institution by name or code..."
                  required
                />
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
                  <option value="driver">Driver</option>
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

      {resetAdmin && (
        <div className="modal-overlay" onClick={() => setResetAdmin(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset password</h3>
              <button className="close-btn" onClick={() => setResetAdmin(null)}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Setting a new temporary password for <strong>{resetAdmin.email}</strong>.
              The user will be forced to change it on their next login.
            </p>

            {resetMsg && (
              <div
                style={{
                  backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
                  color: 'var(--color-success)', padding: '10px 14px', borderRadius: 'var(--radius-input)',
                  fontSize: '13px', marginBottom: '16px',
                }}
              >
                {resetMsg}
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label className="form-label">New temporary password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input"
                    style={{ flex: 1 }}
                    value={resetPassword}
                    required
                    minLength={8}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary" onClick={generatePassword} disabled={resetBusy}>
                    Generate
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Must be 8+ characters with uppercase, lowercase, and a digit.
                </span>
              </div>

              <div className="action-bar">
                <button type="button" className="btn btn-secondary" onClick={() => setResetAdmin(null)} disabled={resetBusy}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={resetBusy || resetPassword.length < 8}>
                  {resetBusy ? 'Resetting...' : 'Reset password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
