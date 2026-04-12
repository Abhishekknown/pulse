import { useState, useEffect } from 'react';
import { getTasks, createManualTask, updateTask, deleteTask } from '../api/api';
import { getToday, formatDate, getDateOffset, isToday } from '../utils/helpers';
import TaskCard from '../components/History/TaskCard';
import ManualEntryModal from '../components/History/ManualEntryModal';

export default function HistoryPage() {
  const [date, setDate] = useState(getToday());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [date]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks(`date=${date}`);
      setTasks(data);
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
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditSave = async (data) => {
    try {
      await updateTask(editingTask._id, data);
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">Browse and manage your past tasks</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowManualEntry(true)}
        >
          ➕ Manual Entry
        </button>
      </div>

      {/* Date Navigation */}
      <div className="date-nav">
        <button
          className="date-nav-btn"
          onClick={() => setDate(getDateOffset(date, -1))}
        >
          ←
        </button>
        <div className="date-display">
          {isToday(date) ? '📅 Today' : formatDate(date)}
        </div>
        <button
          className="date-nav-btn"
          onClick={() => setDate(getDateOffset(date, 1))}
          disabled={isToday(date)}
          style={{ opacity: isToday(date) ? 0.3 : 1 }}
        >
          →
        </button>
        {!isToday(date) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setDate(getToday())}
          >
            Today
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No tasks recorded for this day</div>
          <div className="empty-state-subtext">
            Use the tracker to log tasks, or add a manual entry
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-6)' }}
            onClick={() => setShowManualEntry(true)}
          >
            ➕ Add Manual Entry
          </button>
        </div>
      ) : (
        <div className="task-list animate-fade-in">
          {tasks.map((task, i) => (
            <div key={task._id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <TaskCard
                task={task}
                onEdit={setEditingTask}
                onDelete={handleDelete}
              />
            </div>
          ))}

          {/* Summary */}
          <div className="glass-card" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-8)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>
                  {tasks.length}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Tasks</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>
                  {Math.round(tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60)}m
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Total Time</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>
                  {tasks.reduce((sum, t) => sum + (t.discomfortLogs?.length || 0), 0)}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Disruptions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualEntryModal
          onSave={handleManualSave}
          onClose={() => setShowManualEntry(false)}
        />
      )}

      {/* Edit Modal */}
      {editingTask && (
        <ManualEntryModal
          editTask={editingTask}
          onSave={handleEditSave}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
