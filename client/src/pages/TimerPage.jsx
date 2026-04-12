import { useState, useEffect } from 'react';
import { useTimer } from '../context/TimerContext';
import { getCategories, createCategory, logDiscomfort, getTasks } from '../api/api';
import { getToday } from '../utils/helpers';

const BREAK_REASONS = [
  { value: 'distraction', label: 'Distraction', emoji: '📱' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'boredom', label: 'Boredom', emoji: '😐' },
  { value: 'hunger', label: 'Hunger', emoji: '🍔' },
  { value: 'anxiety', label: 'Anxiety', emoji: '😰' },
  { value: 'urge', label: 'Urge/Impulse', emoji: '⚡' },
  { value: 'custom', label: 'Other', emoji: '📝' },
];

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#A1A1AA', '#71717A', '#52525B', '#FFFFFF',
];

export default function TimerPage() {
  const {
    mode, timeLeft, isRunning, activeTask, pomodoroCount,
    loading, sessionCompleted, TIMER_MODES,
    switchMode, startTimer, stopTimer, resetTimer, pauseTimer, resumeTimer,
    setSessionCompleted
  } = useTimer();

  const [categories, setCategories] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [todayTasks, setTodayTasks] = useState([]);
  const [showBreakReason, setShowBreakReason] = useState(false);
  const [breakReason, setBreakReason] = useState('');
  const [breakIntensity, setBreakIntensity] = useState(3);
  const [sessionComment, setSessionComment] = useState('');
  const [error, setError] = useState('');

  // New category inline
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#c15c5c');

  // Task modal & Choice modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStopChoice, setShowStopChoice] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTodayTasks();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0]._id);
    } catch (err) { console.error(err); }
  };

  const loadTodayTasks = async () => {
    try {
      const tasks = await getTasks(`date=${getToday()}&sessionType=focus`);
      setTodayTasks(tasks.filter(t => t.status !== 'running'));
    } catch (err) { console.error(err); }
  };

  const handleStart = async () => {
    if (!taskTitle.trim()) return setError('Enter a task name');
    if (!selectedCategory) return setError('Select a category');
    setError('');
    try {
      await startTimer({ title: taskTitle.trim(), category: selectedCategory });
      setShowTaskModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStop = async () => {
    // If session completed normally, show comment prompt
    // If break mode, require reason
    if (mode !== 'focus' || sessionCompleted) {
      await finishSession();
    } else {
      // Manual stop during focus — show choice modal
      setShowStopChoice(true);
    }
  };

  const handleManualStatus = async (status) => {
    try {
      if (status === 'interrupted') {
        // Log generic distraction for interrupted sessions
        await logDiscomfort({
          taskId: activeTask._id,
          type: 'distraction',
          intensity: 3,
          trigger: 'manual_stop',
          actionTaken: 'took_break'
        });
      }
      await stopTimer({ status, comment: status === 'interrupted' ? 'Session interrupted by user' : 'Completed early by user' });
      setShowStopChoice(false);
      loadTodayTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const finishSession = async () => {
    try {
      await stopTimer({ comment: sessionComment });
      setSessionComment('');
      setSessionCompleted(false);
      loadTodayTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBreakReasonSubmit = async () => {
    try {
      // Log the break reason as discomfort
      if (activeTask && breakReason) {
        await logDiscomfort({
          taskId: activeTask._id,
          type: breakReason,
          intensity: breakIntensity,
          trigger: 'unknown',
          actionTaken: 'took_break'
        });
      }
      await stopTimer({ comment: sessionComment });
      setShowBreakReason(false);
      setBreakReason('');
      setBreakIntensity(3);
      setSessionComment('');
      setSessionCompleted(false);
      loadTodayTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSwitchToBreak = async (breakType) => {
    // First stop current focus if running
    if (activeTask) {
      setShowBreakReason(true);
    } else {
      switchMode(breakType);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await createCategory({ name: newCatName.trim(), color: newCatColor, type: 'productive' });
      await loadCategories();
      setSelectedCategory(cat._id);
      setShowNewCat(false);
      setNewCatName('');
    } catch (err) { setError(err.message); }
  };

  const handleQuickStart = async (task) => {
    setTaskTitle(task.title);
    setSelectedCategory(task.category?._id || '');
    // Auto-start since parameters are loaded
    try {
      await startTimer({ title: task.title, category: task.category?._id || '' });
      setShowTaskModal(false);
    } catch (err) { setError(err.message); }
  };

  // Format timer display
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isFocusRunning = isRunning && mode === 'focus';

  if (loading) {
    return <div className="page-container"><div className="loading-container"><div className="spinner" /></div></div>;
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      {/* Timer Card Centered Wrapper */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="timer-card" data-running={isRunning ? 'true' : 'false'} style={{ width: '100%', maxWidth: '640px' }}>
        {/* Mode Tabs */}
        <div className="timer-mode-tabs">
          {Object.entries(TIMER_MODES).map(([key, val]) => (
            <button
              key={key}
              className={`timer-mode-tab ${mode === key ? 'active' : ''}`}
              onClick={() => !isRunning && switchMode(key)}
              disabled={isRunning}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Big Timer */}
        <div className={`timer-countdown ${isFocusRunning ? 'running' : ''}`}>
          {sessionCompleted && !activeTask ? (
            <span style={{ fontSize: '0.5em', color: 'var(--red)' }}>Time's up</span>
          ) : timerDisplay}
        </div>

        {/* Controls */}
        <div className="timer-main-controls">
          {!isRunning && !activeTask ? (
            <button className="timer-start-btn" onClick={() => setShowTaskModal(true)}>
              START
            </button>
          ) : isRunning ? (
            <button className="timer-start-btn" onClick={pauseTimer}>
              PAUSE
            </button>
          ) : sessionCompleted ? (
            <button className="timer-start-btn" onClick={handleStop}>
              DONE
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="timer-start-btn" onClick={resumeTimer}>
                RESUME
              </button>
              <button className="timer-stop-link" onClick={handleStop}>
                STOP
              </button>
            </div>
          )}
        </div>

        {/* Session Counter */}
        <div className="timer-session-counter">
          <span>#{pomodoroCount}</span>
          <span>{sessionCompleted ? 'Session complete!' : activeTask ? activeTask.title : 'Time to focus!'}</span>
        </div>
      </div>
      </div>

      {/* Task Input Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: 'var(--font-xl)' }}>Tasks</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)} style={{ fontSize: '1.25rem', padding: 'var(--space-2)' }}>✕</button>
            </div>

            {/* Task Input Row */}
            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <input
                className="form-input"
                style={{ padding: 'var(--space-5)', fontSize: 'var(--font-xl)', height: 'auto' }}
                type="text"
                placeholder="What are you working on?"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                autoFocus
              />
            </div>

            {/* Category Selection */}
            <div className="form-group">
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                {categories.map(c => (
                  <button
                    key={c._id}
                    className={`category-chip ${c._id === selectedCategory ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(c._id)}
                    style={{
                      padding: '8px 14px',
                      fontSize: 'var(--font-sm)',
                      borderColor: c._id === selectedCategory ? c.color : undefined,
                      background: c._id === selectedCategory ? `${c.color}18` : undefined,
                      color: c._id === selectedCategory ? c.color : undefined,
                    }}
                  >
                    <span className="category-chip-dot" style={{ background: c.color, width: '8px', height: '8px' }} />
                    {c.name}
                  </button>
                ))}
                <button
                  className="category-chip"
                  onClick={() => setShowNewCat(!showNewCat)}
                  style={{ borderStyle: 'dashed', color: 'var(--text-muted)', padding: '8px 14px', fontSize: 'var(--font-sm)' }}
                >
                  + New
                </button>
              </div>

              {showNewCat && (
                <div style={{
                  marginTop: 'var(--space-3)', padding: 'var(--space-4)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <input className="form-input" placeholder="Category name" value={newCatName}
                      onChange={e => setNewCatName(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={handleAddCategory} disabled={!newCatName.trim()}>
                      Add
                    </button>
                  </div>
                  <div className="color-picker-grid">
                    {PRESET_COLORS.map(c => (
                      <div key={c} className={`color-swatch ${newCatColor === c ? 'selected' : ''}`}
                        style={{ background: c }} onClick={() => setNewCatColor(c)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p style={{ color: 'var(--red)', fontSize: 'var(--font-sm)', margin: 'var(--space-3) 0' }}>{error}</p>}

            {/* Modal Actions */}
            <div style={{ marginTop: 'var(--space-8)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <button className="btn btn-secondary" style={{ padding: 'var(--space-4)', fontSize: 'var(--font-md)', height: 'auto' }} onClick={() => setShowTaskModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ padding: 'var(--space-4)', fontSize: 'var(--font-md)', height: 'auto' }} onClick={handleStart} disabled={!taskTitle.trim() || !selectedCategory}>
                Start Focus
              </button>
            </div>

            {/* Today's completed tasks */}
            {todayTasks.length > 0 && (
              <div style={{ marginTop: 'var(--space-8)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-6)' }}>
                <div className="quick-start-title" style={{ fontSize: 'var(--font-base)', marginBottom: 'var(--space-4)' }}>Today's Sessions ({todayTasks.length})</div>
                <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {todayTasks.slice(0, 5).map(task => (
                    <div key={task._id} className="task-card" onClick={() => handleQuickStart(task)} style={{ cursor: 'pointer', padding: 'var(--space-4)' }}>
                      <div className="task-card-color" style={{ background: task.category?.color || '#6c757d', width: '4px' }} />
                      <div className="task-card-info" style={{ gap: 'var(--space-1)' }}>
                        <div className="task-card-title" style={{ fontSize: 'var(--font-base)' }}>{task.title}</div>
                        <div className="task-card-meta" style={{ fontSize: 'var(--font-sm)' }}>
                          <span>{task.category?.name}</span>
                          <span>•</span>
                          <span>{Math.round((task.duration || 0) / 60)}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Break Reason Modal */}
      {showBreakReason && (
        <div className="modal-overlay" onClick={() => setShowBreakReason(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Taking a break?</h2>
              <button className="modal-close" onClick={() => setShowBreakReason(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
              Why are you stopping? This helps track discomfort patterns.
            </p>

            <div className="form-group">
              <label className="form-label">Reason</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                {BREAK_REASONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`category-chip ${breakReason === r.value ? 'selected' : ''}`}
                    onClick={() => setBreakReason(r.value)}
                    style={{
                      borderColor: breakReason === r.value ? 'var(--text-secondary)' : undefined,
                      background: breakReason === r.value ? 'var(--bg-secondary)' : undefined,
                      color: breakReason === r.value ? 'var(--text-primary)' : undefined,
                      justifyContent: 'center', padding: 'var(--space-3)'
                    }}
                  >
                    <span>{r.emoji}</span> {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Intensity</label>
              <div className="slider-container">
                <div className="slider-labels">
                  <span className="slider-label">Low</span>
                  <span className="slider-value">{breakIntensity}/5</span>
                  <span className="slider-label">High</span>
                </div>
                <input type="range" min="1" max="5" value={breakIntensity}
                  onChange={e => setBreakIntensity(Number(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea className="form-textarea" placeholder="How was this session?"
                value={sessionComment} onChange={e => setSessionComment(e.target.value)} rows={2} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowBreakReason(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBreakReasonSubmit}
                disabled={!breakReason}>
                Stop & Log Break
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Complete Modal */}
      {sessionCompleted && !showBreakReason && activeTask && !showStopChoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">🎉 {mode === 'focus' ? 'Focus' : 'Break'} Complete!</h2>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
              {mode === 'focus' 
                ? `Great work on "${activeTask.title}"! Ready for a break?`
                : 'Break is over! Ready to focus again?'}
            </p>

            <div className="form-group">
              <label className="form-label">Comment / reflection (optional)</label>
              <textarea className="form-textarea" placeholder="How did it go?" 
                value={sessionComment} onChange={e => setSessionComment(e.target.value)} rows={2} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={finishSession}>
                {mode === 'focus' ? '✓ Done — Start Break' : '✓ Done — Back to Focus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stop Choice Modal */}
      {showStopChoice && activeTask && (
        <div className="modal-overlay" onClick={() => setShowStopChoice(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Session Interrupted</h2>
              <button className="modal-close" onClick={() => setShowStopChoice(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-8)' }}>
              How would you like to mark this session for "{activeTask.title}"?
            </p>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '4px', height: 'auto' }}
                onClick={() => handleManualStatus('completed')}
              >
                <span style={{ fontSize: 'var(--font-md)' }}>Mark as Completed</span>
                <span style={{ fontSize: 'var(--font-xs)', opacity: 0.8, fontWeight: 400 }}>I finished my goal early</span>
              </button>
              
              <button 
                className="btn btn-secondary" 
                style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '4px', height: 'auto', border: '1px solid var(--red-subtle)', color: 'var(--red)' }}
                onClick={() => handleManualStatus('interrupted')}
              >
                <span style={{ fontSize: 'var(--font-md)' }}>Mark as Distraction</span>
                <span style={{ fontSize: 'var(--font-xs)', opacity: 0.8, fontWeight: 400 }}>I got interrupted or lost focus</span>
              </button>
            </div>

            <button 
              className="btn btn-ghost" 
              style={{ width: '100%', marginTop: 'var(--space-6)' }}
              onClick={() => setShowStopChoice(false)}
            >
              Cancel (Keep Working)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
