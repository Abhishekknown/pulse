import { useState, useEffect } from 'react';
import { useTimer } from '../context/TimerContext';
import { getTasks } from '../api/api';
import { formatTimerDisplay, formatDuration, formatTime, getToday } from '../utils/helpers';
import TimerDisplay from '../components/Timer/TimerDisplay';
import StartTaskModal from '../components/Timer/StartTaskModal';
import DiscomfortModal from '../components/Discomfort/DiscomfortModal';

export default function TrackerPage() {
  const { activeTask, elapsed, isRunning, startTimer, stopTimer, loading } = useTimer();
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDiscomfortModal, setShowDiscomfortModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [stopData, setStopData] = useState({ productivityTag: 'neutral', note: '' });
  const [recentTasks, setRecentTasks] = useState([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('');

  useEffect(() => {
    loadRecentTasks();
  }, [isRunning]);

  const loadRecentTasks = async () => {
    try {
      const tasks = await getTasks(`date=${getToday()}`);
      setRecentTasks(tasks.filter(t => t.status !== 'running'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = async (data) => {
    try {
      await startTimer(data);
      setShowStartModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickStart = (task) => {
    setQuickTitle(task.title);
    setQuickCategory(task.category?._id || '');
    setShowStartModal(true);
  };

  const handleStopClick = () => {
    setShowStopConfirm(true);
  };

  const handleStopConfirm = async () => {
    try {
      await stopTimer(stopData);
      setShowStopConfirm(false);
      setStopData({ productivityTag: 'neutral', note: '' });
      loadRecentTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Tracker</h1>
        <p className="page-subtitle">Track your tasks and stay focused</p>
      </div>

      {/* Timer Section */}
      <div className="glass-card glass-card-glow" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="timer-section">
          {isRunning ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span className="timer-active-indicator" />
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>TRACKING</span>
              </div>
              <TimerDisplay />
              <div className="timer-controls">
                <button className="btn-discomfort" onClick={() => setShowDiscomfortModal(true)}>
                  ⚡ Log Discomfort
                </button>
                <button className="btn-stop" onClick={handleStopClick}>
                  ⏹ Stop
                </button>
              </div>
            </>
          ) : (
            <div className="timer-idle">
              <div className="timer-display" style={{ opacity: 0.3 }}>00:00:00</div>
              <p className="timer-idle-text" style={{ marginTop: 'var(--space-4)' }}>
                Ready to focus? Start tracking a task.
              </p>
              <button
                className="btn-start"
                onClick={() => { setQuickTitle(''); setQuickCategory(''); setShowStartModal(true); }}
              >
                ▶ Start Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Start from Recent */}
      {!isRunning && recentTasks.length > 0 && (
        <div className="quick-start-section animate-fade-in">
          <div className="quick-start-title">Quick Start — Recent Tasks</div>
          <div className="quick-start-grid">
            {[...new Map(recentTasks.map(t => [t.title, t])).values()].slice(0, 6).map(task => (
              <button
                key={task._id}
                className="quick-start-tile"
                onClick={() => handleQuickStart(task)}
              >
                <span
                  className="quick-start-dot"
                  style={{ background: task.category?.color || '#6366f1' }}
                />
                <span className="quick-start-tile-title">{task.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Completed Tasks */}
      {recentTasks.length > 0 && (
        <div style={{ marginTop: 'var(--space-8)' }} className="animate-fade-in">
          <div className="section-header">
            <h3 className="section-title">Today's Tasks</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              {recentTasks.length} completed
            </span>
          </div>
          <div className="task-list">
            {recentTasks.slice(0, 5).map(task => (
              <div key={task._id} className="task-card">
                <div className="task-card-color" style={{ background: task.category?.color || '#6366f1' }} />
                <div className="task-card-info">
                  <div className="task-card-title">{task.title}</div>
                  <div className="task-card-meta">
                    <span>{task.category?.name}</span>
                    <span>•</span>
                    <span>{formatTime(task.startTime)} — {formatTime(task.endTime)}</span>
                  </div>
                </div>
                <div className="task-card-duration">{formatDuration(task.duration)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Modal */}
      {showStartModal && (
        <StartTaskModal
          onStart={handleStart}
          onClose={() => setShowStartModal(false)}
          defaultTitle={quickTitle}
          defaultCategory={quickCategory}
        />
      )}

      {/* Discomfort Modal */}
      {showDiscomfortModal && activeTask && (
        <DiscomfortModal
          taskId={activeTask._id}
          onClose={() => setShowDiscomfortModal(false)}
          onLogged={() => {}}
        />
      )}

      {/* Stop Confirmation */}
      {showStopConfirm && (
        <div className="modal-overlay" onClick={() => setShowStopConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Stop Task</h2>
              <button className="modal-close" onClick={() => setShowStopConfirm(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-5)' }}>
              You've been working for <strong style={{ color: 'var(--text-primary)' }}>{formatTimerDisplay(elapsed)}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">How productive was this session?</label>
              <div className="productivity-selector">
                {['productive', 'neutral', 'unproductive'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`productivity-option ${stopData.productivityTag === tag ? `selected-${tag}` : ''}`}
                    onClick={() => setStopData(p => ({ ...p, productivityTag: tag }))}
                  >
                    {tag === 'productive' ? '✅' : tag === 'unproductive' ? '📉' : '➖'}{' '}
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <textarea
                className="form-textarea"
                placeholder="How did the session go?"
                value={stopData.note}
                onChange={e => setStopData(p => ({ ...p, note: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowStopConfirm(false)}>
                Continue Working
              </button>
              <button className="btn btn-primary" onClick={handleStopConfirm}>
                ⏹ Stop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
