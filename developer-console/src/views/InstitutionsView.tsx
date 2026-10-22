import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { InstitutionPayload } from '../services/api';
import { InstitutionDetailsView } from './InstitutionDetailsView';

const PAGE_SIZE = 50;

const TERM_YEAR = { school: '2026-2027', college: '2026-27' };

function buildTermsPlan(count: string, academicYear: string | undefined, type: 'school' | 'college') {
  const parsed = Math.floor(Number(count));
  const total = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 12) : type === 'college' ? 2 : 3;
  const prefix = type === 'college' ? 'Semester' : 'Term';
  return [
    {
      academicYear: academicYear || TERM_YEAR[type],
      terms: Array.from({ length: total }, (_, i) => `${prefix} ${i + 1}`),
    },
  ];
}

const STRUCTURE_DEFAULTS = {
  school: {
    units: ['English', 'Mathematics', 'Science'],
    levels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    programs: [] as string[],
    sections: ['A', 'B', 'C'],
  },
  college: {
    units: ['CSE', 'ECE', 'Civil', 'Mechanical', 'AIML'],
    levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    programs: ['B.Tech', 'M.Tech'],
    sections: ['A', 'B'],
  },
};

export const InstitutionsView: React.FC = () => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'school' | 'college'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'inactive' | 'suspended'>('all');

  // Import / export / delete-confirm state
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<any>(null);
  const [viewingInstId, setViewingInstId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'school' | 'college'>('school');
  const [subscription, setSubscription] = useState('active');
  // School: deptsText = subjects, yearsText = classes. College: departments/years.
  const [deptsText, setDeptsText] = useState(STRUCTURE_DEFAULTS.school.units.join(', '));
  const [yearsText, setYearsText] = useState(STRUCTURE_DEFAULTS.school.levels.join(', '));
  const [coursesText, setCoursesText] = useState('');
  const [sectionsText, setSectionsText] = useState(STRUCTURE_DEFAULTS.school.sections.join(', '));
  const [termsCount, setTermsCount] = useState('3');

  const handleTypeChange = (val: 'school' | 'college') => {
    setType(val);
    const defaults = STRUCTURE_DEFAULTS[val] || STRUCTURE_DEFAULTS.school;
    setDeptsText(defaults.units.join(', '));
    setYearsText(defaults.levels.join(', '));
    setCoursesText(defaults.programs.join(', '));
    setSectionsText(defaults.sections.join(', '));
    setTermsCount(String(val === 'college' ? 2 : 3));
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadPage = (pageToLoad: number) => {
    setLoading(true);
    developerApi
      .getInstitutions({
        search: search || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset: pageToLoad * PAGE_SIZE,
      })
      .then((res) => {
        setInstitutions(Array.isArray(res?.data) ? res.data : []);
        setTotal(typeof res?.total === 'number' ? res.total : 0);
      })
      .catch((err) => console.warn('[Institutions Fetch Error]', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(0);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, typeFilter, statusFilter]);

  const refresh = () => loadPage(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreateModal = () => {
    setEditingInst(null);
    setName('');
    setCode('');
    setType('school');
    setSubscription('active');
    setDeptsText(STRUCTURE_DEFAULTS.school.units.join(', '));
    setYearsText(STRUCTURE_DEFAULTS.school.levels.join(', '));
    setCoursesText('');
    setSectionsText(STRUCTURE_DEFAULTS.school.sections.join(', '));
    setTermsCount('3');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (inst: any) => {
    setEditingInst(inst);
    setName(inst.institutionName || '');
    setCode(inst.institutionCode || '');
    setType(inst.institutionType || 'school');
    setSubscription(inst.subscriptionStatus || 'active');
    setDeptsText(Array.isArray(inst.departments) ? inst.departments.join(', ') : inst.departments || '');
    const levels = inst.institutionType === 'college'
      ? (Array.isArray(inst.yearsOfStudy) && inst.yearsOfStudy.length > 0 ? inst.yearsOfStudy : inst.academicYears)
      : inst.academicYears;
    setYearsText(Array.isArray(levels) ? levels.join(', ') : levels || '');
    setCoursesText(Array.isArray(inst.courses) ? inst.courses.join(', ') : inst.courses || '');
    setSectionsText(Array.isArray(inst.sections) ? inst.sections.join(', ') : inst.sections || '');
    setTermsCount(String(inst.terms?.[0]?.terms?.length || (inst.institutionType === 'college' ? 2 : 3)));
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

    const units = deptsText.split(',').map((s) => s.trim()).filter(Boolean);
    const levels = yearsText.split(',').map((s) => s.trim()).filter(Boolean);
    const programs = coursesText.split(',').map((s) => s.trim()).filter(Boolean);
    const sections = sectionsText.split(',').map((s) => s.trim()).filter(Boolean);

    const payload: InstitutionPayload = {
      institutionName: name,
      institutionCode: code.toUpperCase(),
      institutionType: type,
      subscriptionStatus: subscription,
      // Send the canonical aliases; the server also accepts the storage-shaped
      // departments/academicYears/courses names for old clients.
      subjects: type === 'school' ? units : [],
      classes: type === 'school' ? levels : [],
      departments: type === 'college' ? units : [],
      yearsOfStudy: type === 'college' ? levels : [],
      programs: type === 'college' ? programs : [],
      sections,
      terms: (() => {
        const plan = buildTermsPlan(termsCount, editingInst?.terms?.[0]?.academicYear, type);
        return [...(editingInst?.terms || []).filter((t: any) => t.academicYear !== plan[0].academicYear), ...plan];
      })(),
      convert:
        editingInst && editingInst.institutionType !== type ? true : undefined,
    };

    try {
      if (editingInst) {
        await developerApi.updateInstitution(editingInst.id, payload);
      } else {
        await developerApi.createInstitution(payload);
      }
      setModalOpen(false);
      if (editingInst) {
        refresh();
      } else {
        setPage(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save institution.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (inst: any) => {
    setDeleteTarget(inst);
    setDeleteCode('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteCode.trim().toUpperCase() !== deleteTarget.institutionCode) return;
    setDeleteBusy(true);
    try {
      await developerApi.deleteInstitution(deleteTarget.id);
      if (page > 0 && institutions.length === 1) {
        setPage(page - 1);
      } else {
        refresh();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete institution');
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleSuspend = async (inst: any) => {
    const newStatus = inst.subscriptionStatus === 'suspended' ? 'active' : 'suspended';
    const ok =
      newStatus === 'suspended'
        ? window.confirm(`Suspend ${inst.institutionName}? Its users will be blocked until it is activated again.`)
        : window.confirm(`Activate ${inst.institutionName}?`);
    if (!ok) return;
    try {
      await developerApi.updateInstitution(inst.id, { subscriptionStatus: newStatus });
      refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const submitImport = async () => {
    setImportBusy(true);
    setImportError('');
    setImportResult(null);
    try {
      const res = await developerApi.importInstitutions(importText);
      setImportResult(res);
      setPage(0);
    } catch (err: any) {
      setImportError(err.message || 'Import failed.');
    } finally {
      setImportBusy(false);
    }
  };

  const handleExport = async () => {
    setExportBusy(true);
    try {
      const blob = await developerApi.exportInstitutions({
        search: search || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `institutions-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Institutions</h1>
          <p className="page-subtitle">Manage onboarded schools, colleges, and academic structures</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => { setImportOpen(true); setImportResult(null); setImportError(''); }}>
            Import CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exportBusy || loading}>
            {exportBusy ? 'Exporting...' : 'Export CSV'}
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create institution
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          className="input"
          style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }}
          placeholder="Search by name or code..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className="input" style={{ width: '150px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
          <option value="all">All types</option>
          <option value="school">School</option>
          <option value="college">College</option>
        </select>
        <select className="input" style={{ width: '170px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {loading ? 'Loading...' : `${total} institution${total === 1 ? '' : 's'}`}
        </span>
      </div>

      {loading && institutions.length === 0 ? (
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
                      <div className="table-empty-text">
                        {search || typeFilter !== 'all' || statusFilter !== 'all'
                          ? 'No institutions match your search or filters'
                          : 'No institutions registered'}
                      </div>
                      <div className="table-empty-hint">
                        {search || typeFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try a different search term or clear the filters'
                          : 'Click "+ Create institution" to onboard your first school or college'}
                      </div>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => toggleSuspend(inst)}>
                          {inst.subscriptionStatus === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => openDeleteConfirm(inst)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && institutions.length > 0 && (
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
                    <label className="form-label">Years of study (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 1st Year, 2nd Year, 3rd Year"
                      value={yearsText}
                      onChange={(e) => setYearsText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Programs (comma-separated, optional)</label>
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
                    <label className="form-label">Subjects (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. English, Mathematics, Science"
                      value={deptsText}
                      onChange={(e) => setDeptsText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Classes (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Class 1, Class 2, Class 3"
                      value={yearsText}
                      onChange={(e) => setYearsText(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Sections (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. A, B, C"
                  value={sectionsText}
                  onChange={(e) => setSectionsText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {type === 'school' ? 'Number of terms (1-12)' : 'Number of semesters (1-12)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input"
                  placeholder={type === 'school' ? 'e.g. 3' : 'e.g. 2'}
                  value={termsCount}
                  onChange={(e) => setTermsCount(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                />
              </div>

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

      {/* Import CSV Modal */}
      {importOpen && (
        <div className="modal-overlay" onClick={() => setImportOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Import institutions from CSV</h3>
              <button className="close-btn" onClick={() => setImportOpen(false)}>&#10005;</button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Upload a .csv file or paste rows. Header must include <code>institutionCode</code> and{' '}
              <code>institutionName</code>. Optional columns: <code>institutionType</code>,{' '}
              <code>subscriptionStatus</code>, <code>departments</code>, <code>academicYears</code>,{' '}
              <code>yearsOfStudy</code>, <code>courses</code>, <code>sections</code>. For schools,{' '}
              <code>departments</code> holds subjects and <code>academicYears</code> holds classes. For colleges,{' '}
              <code>yearsOfStudy</code> holds 1st/2nd/3rd/4th Year (academic sessions such as 2026-27 are separate).
              List columns use <code>; </code> as the in-field separator.
              Max 1000 rows per import.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Choose .csv file
                <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImportFile} />
              </label>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  setImportText(
                    'institutionCode,institutionName,institutionType,subscriptionStatus,departments,academicYears,yearsOfStudy,courses,sections\nGIS001,Greenfield International School,school,active,English; Mathematics; Science,Class 1; Class 2; Class 3,,,A; B'
                  )
                }
              >
                Load template
              </button>
            </div>

            <textarea
              className="input"
              rows={7}
              placeholder={'institutionCode,institutionName,institutionType,...\nGIS001,Greenfield International School,school,active,...'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />

            {importError && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-input)',
                  fontSize: '13px',
                  marginTop: '12px',
                }}
              >
                {importError}
              </div>
            )}

            {importResult && (
              <div
                style={{
                  backgroundColor: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  color: 'var(--color-success)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-input)',
                  fontSize: '13px',
                  marginTop: '12px',
                }}
              >
                <strong>
                  Imported {importResult.imported}
                  {importResult.skipped > 0 ? `, skipped ${importResult.skipped}` : ''}
                  {importResult.truncated ? ' (first 1000 of ' + importResult.total + ' rows)' : ''}
                </strong>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                    {importResult.errors.slice(0, 10).map((er: any, i: number) => (
                      <li key={i}>
                        Row {er.row}: {er.message}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...and {importResult.errors.length - 10} more</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            <div className="action-bar">
              <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={importBusy || !importText.trim()}
                onClick={submitImport}
              >
                {importBusy ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal (type-to-confirm) */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete institution</h3>
              <button className="close-btn" onClick={() => setDeleteTarget(null)}>&#10005;</button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              This permanently removes <strong>{deleteTarget.institutionName}</strong> and cannot be undone. Type the
              institution code <code>{deleteTarget.institutionCode}</code> to confirm.
            </p>

            <input
              type="text"
              className="input"
              placeholder={deleteTarget.institutionCode}
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value)}
              autoFocus
            />

            <div className="action-bar">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={
                  deleteBusy || deleteCode.trim().toUpperCase() !== deleteTarget.institutionCode
                }
                onClick={confirmDelete}
              >
                {deleteBusy ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
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
