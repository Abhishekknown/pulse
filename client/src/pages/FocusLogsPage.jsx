import { useState, useEffect } from 'react';
import { getFocusLogs, createManualTask, updateTask, deleteTask } from '../api/api';
import ManualEntryModal from '../components/History/ManualEntryModal';
import { formatDuration, formatTime, formatDate, capitalize } from '../utils/helpers';

export default function FocusLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getFocusLogs(page, 20);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (data) => {
    try {
      await createManualTask(data);
      setShowManualEntry(false);
      loadLogs();
      window.dispatchEvent(new Event('task_added'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditSave = async (data) => {
    try {
      await updateTask(editingLog._id, data);
      setEditingLog(null);
      loadLogs();
      window.dispatchEvent(new Event('task_added'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setConfirmDeleteId(null);
      loadLogs();
      window.dispatchEvent(new Event('task_added'));
    } catch (err) {
      alert(err.message);
    }
  };

  const getSessionIcon = (type) => {
    switch (type) {
      case 'focus': return '🎯';
      case 'short_break': return '☕';
      case 'long_break': return '🌿';
      default: return '⏱️';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Focus Logs</h1>
          <p className="page-subtitle">Detailed view of all your sessions ({total} total)</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowManualEntry(true)}
        >
          ➕ Manual Entry
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No sessions logged yet</div>
          <div className="empty-state-subtext">Complete focus sessions to see them here</div>
        </div>
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table focus-logs-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>PROJECT / TASK</th>
                  <th>CATEGORY</th>
                  <th>TYPE</th>
                  <th style={{ textAlign: 'right' }}>MINUTES</th>
                  <th>BREAKS</th>
                  <th>COMMENT</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const breakReasons = log.discomfortLogs?.map(d => capitalize(d.type)).join(', ') || '—';
                  const breakCount = log.discomfortLogs?.length || 0;

                  return (
                    <tr key={log._id}>
                      <td>
                        <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
                          {new Date(log.startTime).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                          {formatTime(log.startTime)} ~ {log.endTime ? formatTime(log.endTime) : '—'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{log.title}</span>
                      </td>
                      <td>
                        <span className="category-chip" style={{
                          borderColor: log.category?.color,
                          color: log.category?.color,
                          background: `${log.category?.color}12`,
                          cursor: 'default',
                          fontSize: '10px'
                        }}>
                          <span className="category-chip-dot" style={{ background: log.category?.color }} />
                          {log.category?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-xs)' }}>
                          {getSessionIcon(log.sessionType)} {capitalize(log.sessionType?.replace('_', ' ') || 'focus')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round((log.duration || 0) / 60)}
                      </td>
                      <td>
                        {breakCount > 0 ? (
                          <div>
                            <span className="discomfort-badge">⚡ {breakCount}</span>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                              {breakReasons}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontStyle: log.comment ? 'normal' : 'italic' }}>
                          {log.comment || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {confirmDeleteId === log._id ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--red)' }}>Sure?</span>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 'var(--font-xs)' }} onClick={() => handleDelete(log._id)}>Yes</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 'var(--font-xs)' }} onClick={() => setConfirmDeleteId(null)}>No</button>
                          </div>
                        ) : (
                          <>
                            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setEditingLog(log)}>✏️</button>
                            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setConfirmDeleteId(log._id)}>🗑️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-6)', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                ← Previous
              </button>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualEntryModal
          onSave={handleManualSave}
          onClose={() => setShowManualEntry(false)}
        />
      )}

      {/* Edit Modal */}
      {editingLog && (
        <ManualEntryModal
          editTask={editingLog}
          onSave={handleEditSave}
          onClose={() => setEditingLog(null)}
        />
      )}
    </div>
  );
}
