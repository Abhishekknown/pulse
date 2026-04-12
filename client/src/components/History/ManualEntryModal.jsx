import { useState, useEffect } from 'react';
import { getCategories, createCategory } from '../../api/api';

const PRESET_COLORS = [
  '#0d6efd', '#6f42c1', '#d63384', '#dc3545',
  '#fd7e14', '#ffc107', '#198754', '#20c997',
  '#0dcaf0', '#6c757d', '#0a58ca', '#ab2f52',
];

export default function ManualEntryModal({ onSave, onClose, editTask }) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [productivityTag, setProductivityTag] = useState('neutral');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0d6efd');
  const [newCatType, setNewCatType] = useState('productive');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setCategoryId(editTask.category?._id || editTask.category || '');
      setProductivityTag(editTask.productivityTag || 'neutral');
      setNote(editTask.note || '');

      if (editTask.startTime) {
        const st = new Date(editTask.startTime);
        setStartTime(toLocalInput(st));
      }
      if (editTask.endTime) {
        const et = new Date(editTask.endTime);
        setEndTime(toLocalInput(et));
      }
    }
  }, [editTask]);

  function toLocalInput(date) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreating(true);
    try {
      const cat = await createCategory({
        name: newCatName.trim(),
        color: newCatColor,
        type: newCatType
      });
      await loadCategories();
      setCategoryId(cat._id);
      setShowNewCategory(false);
      setNewCatName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Task title is required');
    if (!categoryId) return setError('Select a category');
    if (!startTime) return setError('Start time is required');
    if (!endTime) return setError('End time is required');

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return setError('End time must be after start time');

    setError('');
    onSave({
      title: title.trim(),
      category: categoryId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      productivityTag,
      note,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editTask ? '✏️ Edit Task' : '📝 Manual Entry'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              className="form-input"
              type="text"
              placeholder="What did you work on?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">Select category...</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Category chips with New button */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            {categories.map(c => (
              <button
                key={c._id}
                type="button"
                className={`category-chip ${c._id === categoryId ? 'selected' : ''}`}
                onClick={() => setCategoryId(c._id)}
                style={{
                  borderColor: c._id === categoryId ? c.color : undefined,
                  background: c._id === categoryId ? `${c.color}12` : undefined,
                  color: c._id === categoryId ? c.color : undefined,
                }}
              >
                <span className="category-chip-dot" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
            <button
              type="button"
              className="category-chip"
              onClick={() => setShowNewCategory(!showNewCategory)}
              style={{
                borderStyle: 'dashed',
                color: 'var(--text-accent)',
                borderColor: showNewCategory ? 'var(--text-accent)' : undefined,
              }}
            >
              + New Category
            </button>
          </div>

          {/* Inline create category */}
          {showNewCategory && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              marginBottom: 'var(--space-4)',
            }}>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                Create New Category
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label">Color</label>
                <div className="color-picker-grid">
                  {PRESET_COLORS.map(color => (
                    <div
                      key={color}
                      className={`color-swatch ${newCatColor === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewCatColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className={`productivity-option ${newCatType === 'productive' ? 'selected-productive' : ''}`}
                    onClick={() => setNewCatType('productive')}
                  >
                    ✅ Productive
                  </button>
                  <button
                    type="button"
                    className={`productivity-option ${newCatType === 'unproductive' ? 'selected-unproductive' : ''}`}
                    onClick={() => setNewCatType('unproductive')}
                  >
                    📉 Unproductive
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewCategory(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateCategory}
                  disabled={creating || !newCatName.trim()}
                >
                  {creating ? 'Creating...' : '+ Add Category'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ marginTop: 0 }}>
              <label className="form-label">End Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Productivity</label>
            <div className="productivity-selector">
              {['productive', 'neutral', 'unproductive'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`productivity-option ${productivityTag === tag ? `selected-${tag}` : ''}`}
                  onClick={() => setProductivityTag(tag)}
                >
                  {tag === 'productive' ? '✅' : tag === 'unproductive' ? '📉' : '➖'} {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Add a note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, padding: '12px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
              {editTask ? '💾 Save Changes' : '➕ Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
