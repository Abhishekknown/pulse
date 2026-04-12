import { useState, useEffect } from 'react';
import { getCategories, createCategory } from '../../api/api';

const PRESET_COLORS = [
  '#0d6efd', '#6f42c1', '#d63384', '#dc3545',
  '#fd7e14', '#ffc107', '#198754', '#20c997',
  '#0dcaf0', '#6c757d', '#0a58ca', '#ab2f52',
];

export default function StartTaskModal({ onStart, onClose, defaultTitle, defaultCategory }) {
  const [title, setTitle] = useState(defaultTitle || '');
  const [categoryId, setCategoryId] = useState(defaultCategory || '');
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
    if (defaultCategory) setCategoryId(defaultCategory);
    if (defaultTitle) setTitle(defaultTitle);
  }, [defaultTitle, defaultCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Task title is required');
    if (!categoryId) return setError('Select a category');
    setError('');
    onStart({ title: title.trim(), category: categoryId });
  };

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
      setNewCatColor('#0d6efd');
      setNewCatType('productive');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Start Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              className="form-input"
              type="text"
              placeholder="What are you working on?"
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
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category chips */}
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

          {/* Create new category inline */}
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
                <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>Color</label>
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
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNewCategory(false)}
                >
                  Cancel
                </button>
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

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              ▶ Start Timer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
