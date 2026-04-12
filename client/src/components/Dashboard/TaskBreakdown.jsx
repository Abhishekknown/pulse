import { formatDuration, formatTime, capitalize } from '../../utils/helpers';

export default function TaskBreakdown({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-breakdown">
        <div className="section-header">
          <h3 className="section-title">Task Breakdown</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No tasks to show</div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-breakdown animate-fade-in">
      <div className="section-header">
        <h3 className="section-title">Task Breakdown</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="task-list">
        {tasks.map((task, i) => (
          <div key={task._id} className={`task-card animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
            <div
              className="task-card-color"
              style={{ background: task.category?.color || '#6366f1' }}
            />
            <div className="task-card-info">
              <div className="task-card-title">{task.title}</div>
              <div className="task-card-meta">
                <span>{task.category?.name || 'Uncategorized'}</span>
                <span>•</span>
                <span>{formatTime(task.startTime)} — {task.endTime ? formatTime(task.endTime) : 'running'}</span>
                {task.productivityTag && (
                  <>
                    <span>•</span>
                    <span className={`tag tag-${task.productivityTag}`}>
                      {capitalize(task.productivityTag)}
                    </span>
                  </>
                )}
                {task.discomfortLogs?.length > 0 && (
                  <span className="discomfort-badge">
                    ⚡ {task.discomfortLogs.length}
                  </span>
                )}
              </div>
            </div>
            <div className="task-card-duration">
              {task.status === 'running' ? '...' : formatDuration(task.duration)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
