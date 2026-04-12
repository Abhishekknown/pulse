export default function ActivitySummary({ overview }) {
  if (!overview) return null;

  const cards = [
    { label: 'hours focused', value: overview.totalFocusHours },
    { label: 'days accessed', value: overview.daysAccessed },
    { label: 'day streak', value: overview.streak },
  ];

  return (
    <div style={{ marginBottom: 'var(--space-4)', flex: 1 }}>
      <div className="activity-summary-grid">
        {cards.map((card, i) => (
          <div key={i} className="activity-summary-card animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="activity-summary-value">{card.value}</div>
            <div className="activity-summary-label">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
