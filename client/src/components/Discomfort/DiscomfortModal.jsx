import { useState } from 'react';
import { logDiscomfort } from '../../api/api';

const TYPES = [
  { value: 'distraction', label: 'Distraction', emoji: '📱' },
  { value: 'boredom', label: 'Boredom', emoji: '😐' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'urge', label: 'Urge', emoji: '⚡' },
  { value: 'anxiety', label: 'Anxiety', emoji: '😰' },
  { value: 'custom', label: 'Other', emoji: '📝' },
];

const TRIGGERS = [
  { value: 'phone', label: 'Phone', emoji: '📱' },
  { value: 'environment', label: 'Environment', emoji: '🏠' },
  { value: 'thoughts', label: 'Thoughts', emoji: '💭' },
  { value: 'hunger', label: 'Hunger', emoji: '🍔' },
  { value: 'unknown', label: 'Unknown', emoji: '❓' },
];

const ACTIONS = [
  { value: 'ignored', label: 'Ignored it' },
  { value: 'gave_in', label: 'Gave in' },
  { value: 'switched_task', label: 'Switched task' },
  { value: 'took_break', label: 'Took break' },
];

export default function DiscomfortModal({ taskId, onClose, onLogged }) {
  const [type, setType] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState('unknown');
  const [actionTaken, setActionTaken] = useState('ignored');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!type) return setError('Select a discomfort type');
    setError('');
    setSaving(true);
    try {
      await logDiscomfort({ taskId, type, intensity, trigger, actionTaken });
      onLogged?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const intensityLabels = ['Low', 'Mild', 'Medium', 'High', 'Extreme'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚡ Log Discomfort</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Type Selection */}
        <div className="form-group">
          <label className="form-label">What are you feeling?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                style={{
                  padding: 'var(--space-3) var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  border: type === t.value
                    ? '1px solid var(--border-accent)'
                    : '1px solid var(--glass-border)',
                  background: type === t.value
                    ? 'rgba(13, 110, 253, 0.08)'
                    : 'var(--bg-card)',
                  color: type === t.value ? 'var(--text-accent)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="form-group">
          <label className="form-label">Intensity</label>
          <div className="slider-container">
            <div className="slider-labels">
              <span className="slider-label">Low</span>
              <span className="slider-value">
                {intensity} — {intensityLabels[intensity - 1]}
              </span>
              <span className="slider-label">Extreme</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Trigger Selection */}
        <div className="form-group">
          <label className="form-label">Trigger (optional)</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {TRIGGERS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTrigger(t.value)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  border: trigger === t.value
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid var(--glass-border)',
                  background: trigger === t.value
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'transparent',
                  color: trigger === t.value ? 'var(--amber)' : 'var(--text-muted)',
                  fontSize: 'var(--font-xs)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Taken */}
        <div className="form-group">
          <label className="form-label">How did you respond? (optional)</label>
          <select
            className="form-select"
            value={actionTaken}
            onChange={e => setActionTaken(e.target.value)}
          >
            {ACTIONS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : '✓ Log Discomfort'}
          </button>
        </div>
      </div>
    </div>
  );
}
