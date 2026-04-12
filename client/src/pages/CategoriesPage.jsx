import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/api';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#A1A1AA', '#71717A', '#52525B', '#FFFFFF',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [type, setType] = useState('productive');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setName('');
    setColor('#3B82F6');
    setType('productive');
    setError('');
    setShowCreate(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) return setError('Name is required');
    try {
      await createCategory({ name: name.trim(), color, type });
      resetForm();
      loadCategories();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setColor(cat.color);
    setType(cat.type);
    setShowCreate(true);
  };

  const handleUpdate = async () => {
    if (!name.trim()) return setError('Name is required');
    try {
      await updateCategory(editingId, { name: name.trim(), color, type });
      resetForm();
      loadCategories();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      setConfirmDeleteId(null);
      loadCategories();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your work into categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}>
          ＋ New Category
        </button>
      </div>

      {/* Create / Edit Form */}
      {showCreate && (
        <div className="glass-card animate-slide-up" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
            {editingId ? 'Edit Category' : 'Create Category'}
          </h3>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" placeholder="e.g. Deep Work, Reading, Exercise"
              value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker-grid">
              {PRESET_COLORS.map(c => (
                <div key={c} className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: 24, height: 24, background: color, display: 'inline-block', border: '1px solid var(--border)', borderRadius: '4px' }} />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{color}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="productivity-selector">
              <button type="button"
                className={`productivity-option ${type === 'productive' ? 'selected-productive' : ''}`}
                onClick={() => setType('productive')}>
                ✅ Productive
              </button>
              <button type="button"
                className={`productivity-option ${type === 'unproductive' ? 'selected-unproductive' : ''}`}
                onClick={() => setType('unproductive')}>
                📱 Unproductive
              </button>
            </div>
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>{error}</p>}

          <div className="modal-actions" style={{ marginTop: 'var(--space-4)' }}>
            <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            <button className="btn btn-primary" onClick={editingId ? handleUpdate : handleCreate}>
              {editingId ? '💾 Save Changes' : '＋ Create Category'}
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-text">No categories yet</div>
          <div className="empty-state-subtext">Create categories to organize your work</div>
        </div>
      ) : (
        <div className="task-list">
          {categories.map(cat => (
            <div key={cat._id} className="task-card">
              <div className="task-card-color" style={{ background: cat.color, width: 6, height: 48 }} />
              <div className="task-card-info">
                <div className="task-card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {cat.name}
                  <span className={`tag tag-${cat.type === 'productive' ? 'productive' : 'unproductive'}`}>
                    {cat.type}
                  </span>
                </div>
                <div className="task-card-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ width: 10, height: 10, background: cat.color, display: 'inline-block' }} />
                    {cat.color}
                  </span>
                </div>
              </div>
              <div className="task-card-actions" style={{ opacity: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {confirmDeleteId === cat._id ? (
                  <>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--red)' }}>Sure?</span>
                    <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 'var(--font-xs)' }} onClick={() => handleDelete(cat._id)}>Yes</button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 'var(--font-xs)' }} onClick={() => setConfirmDeleteId(null)}>No</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 'var(--font-sm)' }} onClick={() => handleEdit(cat)}>✏️ Edit</button>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 'var(--font-sm)' }} onClick={() => setConfirmDeleteId(cat._id)}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
