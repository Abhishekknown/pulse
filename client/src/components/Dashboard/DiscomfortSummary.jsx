import { capitalize, getDiscomfortEmoji, getTriggerEmoji } from '../../utils/helpers';

export default function DiscomfortSummary({ discomfortSummary }) {
  if (!discomfortSummary || discomfortSummary.total === 0) {
    return (
      <div className="glass-card animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <h3 className="section-title">Discomfort Overview</h3>
        </div>
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
          No discomfort logs recorded today — great focus! 🎯
        </div>
      </div>
    );
  }

  const { total, avgIntensity, byType, byTrigger, byAction } = discomfortSummary;

  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  const topTrigger = Object.entries(byTrigger).sort((a, b) => b[1] - a[1])[0];
  const topAction = Object.entries(byAction).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="glass-card animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="section-header">
        <h3 className="section-title">Discomfort Overview</h3>
      </div>

      <div className="discomfort-summary-grid">
        <div className="discomfort-stat">
          <div className="discomfort-stat-value">{total}</div>
          <div className="discomfort-stat-label">Total Logs</div>
        </div>
        <div className="discomfort-stat">
          <div className="discomfort-stat-value">{avgIntensity}/5</div>
          <div className="discomfort-stat-label">Avg Intensity</div>
        </div>
        {topType && (
          <div className="discomfort-stat">
            <div className="discomfort-stat-value">
              {getDiscomfortEmoji(topType[0])} {capitalize(topType[0])}
            </div>
            <div className="discomfort-stat-label">Top Type ({topType[1]}x)</div>
          </div>
        )}
        {topTrigger && (
          <div className="discomfort-stat">
            <div className="discomfort-stat-value">
              {getTriggerEmoji(topTrigger[0])} {capitalize(topTrigger[0])}
            </div>
            <div className="discomfort-stat-label">Top Trigger ({topTrigger[1]}x)</div>
          </div>
        )}
        {topAction && (
          <div className="discomfort-stat">
            <div className="discomfort-stat-value">{capitalize(topAction[0])}</div>
            <div className="discomfort-stat-label">Top Response ({topAction[1]}x)</div>
          </div>
        )}
      </div>

      {/* Type breakdown bar */}
      {Object.keys(byType).length > 0 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
            Type Distribution
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 'var(--radius-full)', overflow: 'hidden', gap: 2 }}>
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const colors = {
                distraction: '#3b82f6',
                boredom: '#64748b',
                fatigue: '#8b5cf6',
                urge: '#f59e0b',
                anxiety: '#f43f5e',
                custom: '#06b6d4'
              };
              return (
                <div
                  key={type}
                  style={{
                    flex: count,
                    background: colors[type] || '#6366f1',
                    borderRadius: 'var(--radius-full)',
                  }}
                  title={`${capitalize(type)}: ${count}`}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const colors = {
                distraction: '#3b82f6',
                boredom: '#64748b',
                fatigue: '#8b5cf6',
                urge: '#f59e0b',
                anxiety: '#f43f5e',
                custom: '#06b6d4'
              };
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[type] }} />
                  {capitalize(type)} ({count})
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
