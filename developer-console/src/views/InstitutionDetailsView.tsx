import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';

interface InstitutionDetailsViewProps {
  institutionId: string | null;
  onClose: () => void;
}

type TabType = 'overview' | 'subscription' | 'departments' | 'courses';

export const InstitutionDetailsView: React.FC<InstitutionDetailsViewProps> = ({
  institutionId,
  onClose,
}) => {
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!institutionId) return;
    setLoading(true);
    developerApi
      .getInstitutionById(institutionId)
      .then((data) => setInstitution(data))
      .catch((err) => console.warn('[Details Fetch Error]', err.message))
      .finally(() => setLoading(false));
  }, [institutionId]);

  if (!institutionId) return null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'departments', label: 'Departments' },
    { key: 'courses', label: 'Courses' },
  ];

  const departmentsList = Array.isArray(institution?.departments)
    ? institution.departments
    : [];
  const academicYearsList = Array.isArray(institution?.academicYears)
    ? institution.academicYears
    : [];
  const coursesList = Array.isArray(institution?.courses)
    ? institution.courses
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {loading ? 'Loading...' : institution?.institutionName || 'Institution Details'}
          </h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            Loading institution details...
          </div>
        ) : !institution ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-danger)' }}>
            Failed to load institution details.
          </div>
        ) : (
          <>
            {/* Header Info */}
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    {institution.institutionName}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, marginTop: '4px' }}>
                    Code: {institution.institutionCode}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className={`badge ${institution.institutionType === 'school' ? 'badge-school' : 'badge-college'}`}>
                    {institution.institutionType}
                  </span>
                  <span className={`badge ${institution.subscriptionStatus === 'active' ? 'badge-active' : institution.subscriptionStatus === 'trial' ? 'badge-trial' : 'badge-inactive'}`}>
                    {institution.subscriptionStatus || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ fontSize: '12px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                  General Information
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {[
                    ['ID', institution.id],
                    ['Code', institution.institutionCode],
                    ['Name', institution.institutionName],
                    ['Type', institution.institutionType?.toUpperCase()],
                    ['Subscription', institution.subscriptionStatus?.toUpperCase()],
                    ['Created', institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : '-'],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{label as string}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {value as string}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                  Subscription & Licensing
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  Manage ERP access tier and active status for {institution.institutionName}.
                </p>
                <div
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Current Subscription Status
                  </span>
                  <span className={`badge ${institution.subscriptionStatus === 'active' ? 'badge-active' : institution.subscriptionStatus === 'trial' ? 'badge-trial' : 'badge-inactive'}`}>
                    {institution.subscriptionStatus || 'Active'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'departments' && (
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                  {institution.institutionType === 'school' ? 'Classes' : 'Departments'}
                </h4>
                {departmentsList.length === 0 && academicYearsList.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    No departments or academic years configured.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {departmentsList.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          {institution.institutionType === 'school' ? 'Classes' : 'Departments'}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {departmentsList.map((d: string, i: number) => (
                            <span key={i} className="badge badge-college">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {academicYearsList.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          {institution.institutionType === 'school' ? 'Sections' : 'Academic Years'}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {academicYearsList.map((y: string, i: number) => (
                            <span key={i} className="badge badge-active">{y}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                  Courses Offered
                </h4>
                {coursesList.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {institution.institutionType === 'school'
                      ? 'Courses are not typically configured for schools.'
                      : 'No courses configured for this institution.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {coursesList.map((c: string, i: number) => (
                      <span key={i} className="badge badge-college">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
