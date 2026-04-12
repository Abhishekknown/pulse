import { formatDuration } from '../../utils/helpers';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      icon: '⏱️',
      value: formatDuration(summary.totalTime),
      label: 'Total Tracked',
      accent: 'var(--gradient-primary)',
    },
    {
      icon: '✅',
      value: formatDuration(summary.productiveTime),
      label: 'Productive Time',
      accent: 'linear-gradient(135deg, #10b981, #06b6d4)',
    },
    {
      icon: '📉',
      value: formatDuration(summary.unproductiveTime),
      label: 'Unproductive Time',
      accent: 'linear-gradient(135deg, #f43f5e, #ec4899)',
    },
    {
      icon: '⚡',
      value: summary.discomfortCount,
      label: 'Discomfort Events',
      accent: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
    },
    {
      icon: '🎯',
      value: `${summary.productivityRatio}%`,
      label: 'Productivity Ratio',
      accent: 'var(--gradient-primary)',
    },
    {
      icon: '📋',
      value: summary.taskCount,
      label: 'Tasks Completed',
      accent: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`summary-card animate-slide-up stagger-${i + 1}`}
          style={{ '--card-accent': card.accent }}
        >
          <div className="summary-card-icon">{card.icon}</div>
          <div className="summary-card-value">{card.value}</div>
          <div className="summary-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
