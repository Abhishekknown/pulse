export default function BarChart({ data, maxValue, height = 240, barColor = '#c15c5c22', barFill = '#c15c5c' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
        No data yet
      </div>
    );
  }

  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const gridLines = [];
  const step = max <= 5 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5);
  for (let i = 0; i <= max; i += step) {
    gridLines.push(i);
  }
  // Ensure max is in grid
  if (gridLines[gridLines.length - 1] < max) {
    gridLines.push(Math.ceil(max));
  }
  const gridMax = gridLines[gridLines.length - 1] || 1;

  return (
    <div className="bar-chart-wrapper">
      <div className="bar-chart" style={{ height }}>
        {/* Y-axis labels + grid lines */}
        <div className="bar-chart-y-axis">
          {gridLines.reverse().map(val => (
            <div key={val} className="bar-chart-y-label">
              {Number.isInteger(val) ? val : val.toFixed(1)}
            </div>
          ))}
        </div>

        {/* Bars area */}
        <div className="bar-chart-area">
          {/* Grid lines */}
          {gridLines.reverse().map(val => (
            <div key={`grid-${val}`} className="bar-chart-grid-line"
              style={{ bottom: `${(val / gridMax) * 100}%` }} />
          ))}

          {/* Bars */}
          <div className="bar-chart-bars">
            {data.map((item, i) => {
              const heightPct = (item.value / gridMax) * 100;
              const hasCategories = item.categories && Object.keys(item.categories).length > 0;

              return (
                <div key={i} className="bar-chart-bar-group">
                  <div className="bar-chart-bar-container" style={{ height: '100%' }}>
                    {hasCategories ? (
                      // Stacked bar
                      <div className="bar-chart-bar-stack" style={{ height: `${heightPct}%` }}>
                        {Object.entries(item.categories).map(([name, cat]) => {
                          const catPct = item.value > 0 ? (cat.time / 3600 / item.value) * 100 : 0;
                          return (
                            <div key={name} className="bar-chart-bar-segment"
                              style={{ height: `${catPct}%`, background: cat.color || barFill }}
                              title={`${name}: ${(cat.time / 3600).toFixed(1)}h`} />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bar-chart-bar"
                        style={{
                          height: `${heightPct}%`,
                          background: item.color || barFill,
                          opacity: 0.25,
                          border: `1px solid ${item.color || barFill}`
                        }}
                        title={`${item.value}`} />
                    )}
                  </div>
                  <div className="bar-chart-x-label">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
