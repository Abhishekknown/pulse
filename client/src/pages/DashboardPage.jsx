import { useState, useEffect } from 'react';
import { getDashboardOverview, getDashboardChart, getTaskSummary, getCategorySummary, getAdvancedMetrics, getDistractionAnalytics } from '../api/api';
import { getToday } from '../utils/helpers';
import ActivitySummary from '../components/Dashboard/ActivitySummary';
import PersonalButler from '../components/Dashboard/PersonalButler';
import ExportReport from '../components/Dashboard/ExportReport';
import { ComposedChart, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [chartView, setChartView] = useState('week');
  const [chartDate, setChartDate] = useState(getToday());
  const [customStart, setCustomStart] = useState(getToday());
  const [customEnd, setCustomEnd] = useState(getToday());
  
  const [chartData, setChartData] = useState(null);
  const [taskSummary, setTaskSummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);
  const [advancedMetrics, setAdvancedMetrics] = useState(null);
  const [distractionAnalytics, setDistractionAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (chartView !== 'custom') {
      loadChart();
    }
  }, [chartView, chartDate]);

  const loadOverview = async () => {
    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err) { console.error(err); }
  };

  const loadChart = async () => {
    setLoading(true);
    try {
      const chart = await getDashboardChart(chartView, chartDate, customStart, customEnd);
      setChartData(chart);
      
      if (chart?.startDate && chart?.endDate) {
         const [tasks, cats, adv, dist] = await Promise.all([
           getTaskSummary(chart.startDate, chart.endDate),
           getCategorySummary(chart.startDate, chart.endDate),
           getAdvancedMetrics(chart.startDate, chart.endDate),
           getDistractionAnalytics(chart.startDate, chart.endDate)
         ]);
         setTaskSummary(tasks);
         setCategorySummary(cats);
         setAdvancedMetrics(adv);
         setDistractionAnalytics(dist);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApplyCustom = () => {
    loadChart();
  };

  const handleViewChange = (v) => {
    setChartView(v);
    if (v !== 'custom') setChartDate(getToday());
  };

  // Safety checks for distractions analytics
  const highestCategory = distractionAnalytics?.tasks?.[0]?.title || 'None';
  
  // Safe sort and access for timing analysis
  let worstTiming = 'None';
  if (Array.isArray(distractionAnalytics?.timing) && distractionAnalytics.timing.length > 0) {
    const sortedTiming = [...distractionAnalytics.timing].sort((a,b) => (b.count || 0) - (a.count || 0));
    worstTiming = sortedTiming[0]?.name || 'None';
  }

  return (
    <div className="page-container">
      <PersonalButler />

      {/* Primary Date Filter */}
      <div className="glass-card" style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['day', 'week', 'month', 'custom'].map(view => (
            <button
              key={view}
              className={`view-toggle-btn ${chartView === view ? 'active' : ''}`}
              onClick={() => handleViewChange(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        {chartView === 'custom' && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <input type="date" className="input-field" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ padding: '8px' }} />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input type="date" className="input-field" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ padding: '8px' }} />
            <button className="btn btn-primary" onClick={handleApplyCustom} style={{ padding: '8px 16px' }}>Apply</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <ActivitySummary overview={overview} />
        <ExportReport
          overview={overview}
          chartData={chartData}
          taskSummary={taskSummary}
          categorySummary={categorySummary}
          advancedMetrics={advancedMetrics}
          distractionAnalytics={distractionAnalytics}
          chartView={chartView}
        />
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          {/* Advanced Metric Cards */}
          {advancedMetrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Efficiency Ratio</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 600, color: 'var(--text-primary)' }}>{advancedMetrics.focusEfficiency}</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>Hours / Friction</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Zone</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>{advancedMetrics.peakProductivityZone}</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>Highest Focus</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Density</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 600, color: 'var(--text-primary)' }}>{advancedMetrics.sessionDensity}</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Highest Distraction</div>
                <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{highestCategory}</div>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Worst Window</div>
                <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: '#EF4444' }}>{worstTiming}</div>
              </div>
            </div>
          )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
          {/* Daily Behavior Chart */}
          <div className="glass-card" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Daily Behavior Comparison</h3>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{chartData?.periodLabel}</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="label" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#161618' }} contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="hours" name="Time (hrs)" fill="#FFFFFF" radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Friction & Interruptions */}
          <div className="glass-card">
            <div className="section-header">
              <h3 className="section-title">Interruptions</h3>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{chartData?.periodLabel}</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="label" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Line type="monotone" dataKey="distractions" name="Distractions" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="breaks" name="Breaks" stroke="#71717A" strokeWidth={2} dot={{ r: 3, fill: '#71717A' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* Category Comparison Chart */}
          <div className="glass-card" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="section-header">
              <h3 className="section-title">Category Comparison</h3>
            </div>
            {distractionAnalytics?.tasks?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distractionAnalytics.tasks.map(t => ({ name: t.title, distractions: t.distractions, breaks: t.breaks, hours: +(t.time / 3600).toFixed(2) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={{ stroke: '#27272A' }} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#161618' }} contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                  <Bar yAxisId="left" dataKey="hours" name="Time (hrs)" fill="#FFFFFF" radius={[2, 2, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="breaks" name="Breaks" fill="#71717A" radius={[2, 2, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="distractions" name="Distractions" fill="#EF4444" radius={[2, 2, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No task data available.</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-8)' }}>
            
            {/* Total Time Trend */}
            <div className="glass-card">
              <div className="section-header">
                <h3 className="section-title">Total Time Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData?.data || []}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="hours" name="Time (hrs)" stroke="#FFFFFF" fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Distraction Timing Analysis */}
            <div className="glass-card">
              <div className="section-header">
                <h3 className="section-title">Distraction Time-of-Day</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distractionAnalytics?.timing || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                  <XAxis type="number" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#161618' }} contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" name="Distractions" fill="#EF4444" radius={[0, 2, 2, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution Donut */}
            <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
              <div className="section-header">
                <h3 className="section-title">Category Distribution</h3>
              </div>
              {categorySummary?.categories?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div style={{ flex: '1 1 250px', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySummary.categories.map(c => ({ name: c.name, value: +(c.time/3600).toFixed(2), fill: c.color }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          dataKey="value"
                          paddingAngle={0}
                          stroke="#0B0B0C"
                        >
                          {categorySummary.categories.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#FFFFFF' : `rgba(255,255,255, ${Math.max(0.1, 0.4 - index*0.08)})`} stroke="#0B0B0C" strokeWidth={2} /> 
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Custom Minimal Legend */}
                  <div style={{ flex: '1 1 200px', paddingLeft: 'var(--space-2)' }}>
                    {categorySummary.categories.map((cat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div style={{ width: 12, height: 12, background: i === 0 ? '#FFFFFF' : `rgba(255,255,255, ${Math.max(0.1, 0.4 - i*0.08)})`, borderRadius: '2px' }} />
                        <div style={{ flex: 1, color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === 0 ? 600 : 500 }}>{cat.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{(cat.time/3600).toFixed(1)}h</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No category data available.</p>}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
