import { useState } from 'react';
import { formatTime } from '../../utils/helpers';

export default function Timeline({ tasks, discomforts }) {
  const [tooltip, setTooltip] = useState(null);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="timeline-container">
        <div className="section-header">
          <h3 className="section-title">Timeline</h3>
        </div>
        <div className="timeline-track">
          <div className="timeline-empty">No tasks tracked yet today</div>
        </div>
      </div>
    );
  }

  // Find the range of hours to display
  const allTimes = tasks.flatMap(t => [
    new Date(t.startTime).getHours(),
    t.endTime ? new Date(t.endTime).getHours() + 1 : new Date().getHours() + 1
  ]);
  const minHour = Math.max(0, Math.min(...allTimes) - 1);
  const maxHour = Math.min(24, Math.max(...allTimes) + 1);
  const hourRange = maxHour - minHour;

  const hours = [];
  for (let h = minHour; h <= maxHour; h += Math.max(1, Math.floor(hourRange / 8))) {
    hours.push(h);
  }

  const getPosition = (date) => {
    const d = new Date(date);
    const totalMinutes = (d.getHours() - minHour) * 60 + d.getMinutes();
    const totalRange = hourRange * 60;
    return Math.max(0, Math.min(100, (totalMinutes / totalRange) * 100));
  };

  const getWidth = (start, end) => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const startMin = (s.getHours() - minHour) * 60 + s.getMinutes();
    const endMin = (e.getHours() - minHour) * 60 + e.getMinutes();
    const totalRange = hourRange * 60;
    return Math.max(0.5, ((endMin - startMin) / totalRange) * 100);
  };

  return (
    <div className="timeline-container animate-fade-in">
      <div className="section-header">
        <h3 className="section-title">Timeline</h3>
      </div>
      <div className="timeline-track">
        <div className="timeline-hours">
          {hours.map(h => (
            <span key={h} className="timeline-hour">
              {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
            </span>
          ))}
        </div>
        <div className="timeline-bar-container">
          {tasks.map(task => (
            <div
              key={task._id}
              className="timeline-block"
              style={{
                left: `${getPosition(task.startTime)}%`,
                width: `${getWidth(task.startTime, task.endTime)}%`,
                background: task.category?.color || '#6366f1',
              }}
              title={`${task.title} (${formatTime(task.startTime)} - ${task.endTime ? formatTime(task.endTime) : 'now'})`}
              onMouseEnter={() => setTooltip(task)}
              onMouseLeave={() => setTooltip(null)}
            >
              {getWidth(task.startTime, task.endTime) > 8 && (
                <span className="timeline-block-label">{task.title}</span>
              )}
            </div>
          ))}

          {/* Discomfort markers */}
          {discomforts?.map(d => (
            <div
              key={d._id}
              className="timeline-discomfort-marker"
              style={{ left: `${getPosition(d.timestamp)}%` }}
              title={`${d.type} (intensity: ${d.intensity})`}
            />
          ))}
        </div>
      </div>

      {tooltip && (
        <div style={{
          marginTop: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: tooltip.category?.color || '#6366f1',
            flexShrink: 0,
          }} />
          <span style={{ fontWeight: 600 }}>{tooltip.title}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {formatTime(tooltip.startTime)} — {tooltip.endTime ? formatTime(tooltip.endTime) : 'running'}
          </span>
          {tooltip.category && (
            <span className="timer-category-badge" style={{ marginLeft: 'auto' }}>
              {tooltip.category.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
