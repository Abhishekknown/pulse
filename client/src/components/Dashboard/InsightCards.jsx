export default function InsightCards({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <h3 className="section-title">Insights</h3>
        </div>
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-sm)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
        }}>
          Complete some tasks to unlock insights 🔓
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="section-header">
        <h3 className="section-title">Insights</h3>
      </div>
      <div className="insights-grid">
        {insights.map((insight, i) => (
          <div key={i} className={`insight-card animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
            <div className="insight-card-icon">{insight.icon}</div>
            <div className="insight-card-title">{insight.title}</div>
            <div className="insight-card-value">{insight.value}</div>
            <div className="insight-card-detail">{insight.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
