import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { AdminPayload } from '../services/api';

export const AdminsView: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedInstCode, setSelectedInstCode] = useState('');
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

  const openCreateModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('TempPass123!');
    if (institutions.length > 0) {
      setSelectedInstCode(institutions[0].institutionCode);
    }
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

    const payload: AdminPayload = {
      fullName,
      email,
      phone,
      institutionCode: selectedInstCode,
      password: password || 'TempPass123!',
      title: 'Institution Admin',
      scope: { departments: [], academicYears: [] },
      permissions: ['Manage Students', 'Manage Teachers', 'Attendance', 'Institution Settings'],
    };

    try {
      await developerApi.createAdmin(payload);
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create Institution Administrator.');
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
          <h1 className="page-title">Institution Administrators</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Manage administrator accounts assigned to onboarded institutions
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create Institution Admin
        </button>
      </div>

      {loading ? (
        <div className="card">Loading administrators...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Admin Name</th>
              <th>Email</th>
              <th>Institution</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No Institution Administrators created yet. Click "+ Create Institution Admin" above.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id}>
                  <td style={{ fontWeight: 600 }}>{admin.fullName}</td>
                  <td>{admin.email}</td>
                  <td>
                    <code>{admin.institutionName || admin.institutionCode}</code>
                  </td>
                  <td>
                    <span className="badge badge-college">Institution Admin</span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ height: '30px', fontSize: '12px', color: 'var(--color-danger)' }} onClick={() => handleDelete(admin.id)}>
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
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Create Institution Administrator</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--color-danger)', padding: '10px', borderRadius: 'var(--radius-input)', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
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
                <label className="form-label">Email Address *</label>
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
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="+1 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Institution *</label>
                <select className="input" value={selectedInstCode} onChange={(e) => setSelectedInstCode(e.target.value)} required>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.institutionCode}>
                      {inst.institutionName} ({inst.institutionCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <input
                  type="text"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  User will be prompted to change temporary password on first mobile login.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Account...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
