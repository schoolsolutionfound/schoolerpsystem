import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';
import type { AuditEvent } from '../services/api';

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  'institution.created': 'Institution created',
  'institution.updated': 'Institution updated',
  'institution.deleted': 'Institution deleted',
  'institutions.imported': 'Institutions imported (CSV)',
  'admin.created': 'Admin created',
  'admin.updated': 'Admin updated',
  'admin.deleted': 'Admin deleted',
  'admin.password_reset': 'Admin password reset',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const AuditView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  const load = (pageToLoad: number, action: string, target: string) => {
    setLoading(true);
    developerApi
      .getAuditEvents({
        limit: PAGE_SIZE,
        offset: pageToLoad * PAGE_SIZE,
        action: action === 'all' ? undefined : action,
        targetType: target === 'all' ? undefined : target,
      })
      .then((res) => {
        setEvents(Array.isArray(res?.data) ? res.data : []);
        setTotal(typeof res?.total === 'number' ? res.total : 0);
      })
      .catch(() => {
        setEvents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(0);
  }, [actionFilter, targetFilter]);

  useEffect(() => {
    load(page, actionFilter, targetFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="page-subtitle">Developer actions on institutions and administrators</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="input"
          style={{ width: '240px' }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="input"
          style={{ width: '170px' }}
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
        >
          <option value="all">All targets</option>
          <option value="institution">Institutions</option>
          <option value="admin">Administrators</option>
        </select>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {loading ? 'Loading...' : `${total} event${total === 1 ? '' : 's'}`}
        </span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Loading activity...
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Target</th>
                <th>Actor</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty">
                      <div className="table-empty-icon" style={{ fontWeight: 700 }}>[ ]</div>
                      <div className="table-empty-text">
                        {actionFilter !== 'all' || targetFilter !== 'all' ? 'No events match your filters' : 'No activity recorded yet'}
                      </div>
                      <div className="table-empty-hint">
                        {actionFilter !== 'all' || targetFilter !== 'all'
                          ? 'Try a different filter'
                          : 'Actions taken in this console will appear here'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                      {formatTime(ev.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          ev.action.includes('deleted')
                            ? 'badge-inactive'
                            : ev.action.includes('created') || ev.action.includes('imported')
                              ? 'badge-active'
                              : 'badge-trial'
                        }`}
                      >
                        {ACTION_LABELS[ev.action] || ev.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ev.targetLabel || '—'}</div>
                      {ev.targetType !== 'platform' && (
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{ev.targetType}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>{ev.actorEmail}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
                      {ev.details && Object.keys(ev.details).length > 0
                        ? Object.entries(ev.details)
                            .filter(([, v]) => v !== null && v !== undefined && v !== '')
                            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
                            .join(' · ')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && events.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Showing {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
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
    </div>
  );
};
