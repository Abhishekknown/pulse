import { useState } from 'react';
import { formatDuration, formatTime, capitalize } from '../../utils/helpers';

export default function TaskCard({ task, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="task-card">
      <div
        className="task-card-color"
        style={{ background: task.category?.color || '#6366f1' }}
      />
      <div className="task-card-info">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-meta">
          <span>{task.category?.name || 'Uncategorized'}</span>
          <span>•</span>
          <span>
            {formatTime(task.startTime)} — {task.endTime ? formatTime(task.endTime) : 'running'}
          </span>
          {task.productivityTag && (
            <>
              <span>•</span>
              <span className={`tag tag-${task.productivityTag}`}>
                {capitalize(task.productivityTag)}
              </span>
            </>
          )}
          {task.discomfortLogs?.length > 0 && (
            <span className="discomfort-badge">⚡ {task.discomfortLogs.length}</span>
          )}
          {task.note && (
            <>
              <span>•</span>
              <span style={{ fontStyle: 'italic' }}>"{task.note}"</span>
            </>
          )}
        </div>
      </div>
      <div className="task-card-duration">
        {task.status === 'running' ? '...' : formatDuration(task.duration)}
      </div>
      <div className="task-card-actions">
        {onEdit && (
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => onEdit(task)}>✏️</button>
        )}
        {onDelete && (
          confirmDelete ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--red)' }}>Sure?</span>
              <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 'var(--font-xs)' }} onClick={() => { setConfirmDelete(false); onDelete(task._id); }}>Yes</button>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 'var(--font-xs)' }} onClick={() => setConfirmDelete(false)}>No</button>
            </div>
          ) : (
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setConfirmDelete(true)}>🗑️</button>
          )
        )}
      </div>
    </div>
  );
}
