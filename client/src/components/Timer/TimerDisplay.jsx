import { useTimer } from '../../context/TimerContext';
import { formatTimerDisplay } from '../../utils/helpers';

export default function TimerDisplay() {
  const { elapsed, activeTask, isRunning } = useTimer();

  if (!isRunning) return null;

  return (
    <div className="timer-task-info animate-fade-in">
      <div className="timer-display">{formatTimerDisplay(elapsed)}</div>
      <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
        <div className="timer-task-title">{activeTask.title}</div>
        {activeTask.category && (
          <span className="timer-category-badge">
            <span
              className="timer-category-dot"
              style={{ background: activeTask.category.color }}
            />
            {activeTask.category.name}
          </span>
        )}
      </div>
    </div>
  );
}
