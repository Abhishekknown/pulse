import { useState } from 'react';
import { jsPDF } from 'jspdf';

// ─── Color Palette (Dark Theme) ───
const C = {
  bg: [13, 13, 13],          // #0D0D0D
  surface: [26, 26, 26],     // #1A1A1A
  surfaceLight: [18, 18, 18],// #121212
  white: [255, 255, 255],    // #FFFFFF
  secondary: [161, 161, 161],// #A1A1A1
  muted: [107, 107, 107],    // #6B6B6B
  green: [74, 222, 128],     // #4ADE80
  amber: [250, 204, 21],     // #FACC15
  blue: [96, 165, 250],      // #60A5FA
  red: [239, 68, 68],        // #EF4444
};

// ─── Helper: Format seconds to readable ───
function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m 0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

function fmtTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

// ─── PDF Generator ───
function generateReport({
  overview,
  chartData,
  taskSummary,
  categorySummary,
  advancedMetrics,
  distractionAnalytics,
  chartView,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 0;

  // ─── Utilities ───
  const setColor = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const drawBg = () => {
    setFill(C.bg);
    doc.rect(0, 0, W, H, 'F');
  };

  const checkPage = (needed = 30) => {
    if (y + needed > H - 20) {
      doc.addPage();
      drawBg();
      y = margin;
    }
  };

  const drawSeparator = () => {
    checkPage(10);
    setFill(C.surface);
    doc.rect(margin, y, contentW, 0.3, 'F');
    y += 12;
  };

  const drawSectionTitle = (text) => {
    checkPage(20);
    doc.setFontSize(10);
    setColor(C.muted);
    doc.text(text.toUpperCase(), margin, y);
    y += 8;
  };

  const drawMetricRow = (label, value, insight = null, valueColor = C.white) => {
    checkPage(insight ? 18 : 12);
    doc.setFontSize(13);
    setColor(valueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), margin, y);

    doc.setFontSize(11);
    setColor(C.secondary);
    doc.setFont('helvetica', 'normal');
    const valWidth = doc.getTextWidth(String(value));
    doc.text(`  ${label}`, margin + valWidth, y);
    y += 6;

    if (insight) {
      doc.setFontSize(9);
      setColor(C.muted);
      doc.text(insight, margin, y);
      y += 6;
    }
    y += 2;
  };

  const drawKeyValue = (label, value, x = margin, w = contentW) => {
    checkPage(10);
    doc.setFontSize(10);
    setColor(C.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, y);

    doc.setFontSize(10);
    setColor(C.white);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), x + w - doc.getTextWidth(String(value)), y);
    y += 7;
  };

  // ─────────────────────────────────
  // PAGE 1: HEADER + HERO SCORE
  // ─────────────────────────────────
  drawBg();
  y = margin;

  // Branding
  doc.setFontSize(9);
  setColor(C.muted);
  doc.setFont('helvetica', 'normal');
  doc.text('PULSE', margin, y);

  const dateText = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  doc.text(dateText, W - margin - doc.getTextWidth(dateText), y);
  y += 14;

  // Title
  doc.setFontSize(28);
  setColor(C.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Report', margin, y);
  y += 8;

  // Subtitle
  doc.setFontSize(11);
  setColor(C.secondary);
  doc.setFont('helvetica', 'normal');
  const periodLabel = chartData?.periodLabel || `${chartView} view`;
  doc.text(periodLabel, margin, y);
  y += 20;

  // ── Hero Score Block ──
  setFill(C.surfaceLight);
  doc.roundedRect(margin, y, contentW, 50, 3, 3, 'F');

  const heroHours = overview?.totalFocusHours ?? 0;
  doc.setFontSize(48);
  setColor(C.white);
  doc.setFont('helvetica', 'bold');
  const heroText = `${heroHours}`;
  const heroW = doc.getTextWidth(heroText);
  doc.text(heroText, W / 2 - heroW / 2 - 5, y + 32);

  doc.setFontSize(16);
  setColor(C.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('hrs', W / 2 + heroW / 2 - 3, y + 32);

  doc.setFontSize(10);
  setColor(C.muted);
  doc.text('Total Focus Time (All-Time)', W / 2 - doc.getTextWidth('Total Focus Time (All-Time)') / 2, y + 42);
  y += 60;

  // ── Overview Stats Row ──
  const stats = [
    { label: 'Sessions', value: overview?.totalSessions ?? 0 },
    { label: 'Days Active', value: overview?.daysAccessed ?? 0 },
    { label: 'Day Streak', value: overview?.streak ?? 0 },
  ];
  const statW = contentW / stats.length;
  stats.forEach((s, i) => {
    const sx = margin + i * statW;
    doc.setFontSize(22);
    setColor(C.white);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.value), sx + statW / 2 - doc.getTextWidth(String(s.value)) / 2, y);

    doc.setFontSize(9);
    setColor(C.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, sx + statW / 2 - doc.getTextWidth(s.label) / 2, y + 6);
  });
  y += 20;

  drawSeparator();

  // ─────────────────────────────────
  // ADVANCED METRICS
  // ─────────────────────────────────
  if (advancedMetrics) {
    drawSectionTitle('Advanced Metrics');

    drawMetricRow(
      'Efficiency Ratio',
      advancedMetrics.focusEfficiency,
      'Hours of focus per friction event. Higher is better.',
      C.blue
    );
    drawMetricRow(
      'Peak Productivity Zone',
      advancedMetrics.peakProductivityZone || 'None',
      advancedMetrics.peakBucketHours
        ? `${advancedMetrics.peakBucketHours} hours focused in this window.`
        : null,
      C.green
    );
    drawMetricRow(
      'Session Density',
      advancedMetrics.sessionDensity,
      'Total focus sessions in this period.'
    );
    drawMetricRow(
      'Total Friction Events',
      advancedMetrics.totalFriction,
      'Breaks + distractions + task switches combined.',
      advancedMetrics.totalFriction > 10 ? C.red : C.amber
    );

    drawSeparator();
  }

  // ─────────────────────────────────
  // CATEGORY BREAKDOWN
  // ─────────────────────────────────
  if (categorySummary?.categories?.length > 0) {
    drawSectionTitle('Category Breakdown');

    const totalCatTime = categorySummary.totalTime || 1;
    categorySummary.categories.forEach((cat, i) => {
      checkPage(18);
      const pct = ((cat.time / totalCatTime) * 100).toFixed(1);

      // Category name and time
      doc.setFontSize(12);
      setColor(i === 0 ? C.white : C.secondary);
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.text(cat.name, margin, y);

      const timeStr = fmtDuration(cat.time);
      doc.text(timeStr, W - margin - doc.getTextWidth(timeStr), y);
      y += 5;

      // Progress bar
      setFill(C.surface);
      doc.roundedRect(margin, y, contentW, 3, 1.5, 1.5, 'F');
      const barW = Math.max(2, (parseFloat(pct) / 100) * contentW);
      setFill(i === 0 ? C.white : C.secondary);
      doc.roundedRect(margin, y, barW, 3, 1.5, 1.5, 'F');
      y += 5;

      // Percentage + sessions
      doc.setFontSize(9);
      setColor(C.muted);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pct}% of total  •  ${cat.sessions} session${cat.sessions !== 1 ? 's' : ''}`, margin, y);
      y += 8;
    });

    drawSeparator();
  }

  // ─────────────────────────────────
  // DISTRACTION ANALYSIS
  // ─────────────────────────────────
  if (distractionAnalytics) {
    drawSectionTitle('Distraction & Interruption Analysis');

    // Category distractions table
    if (distractionAnalytics.tasks?.length > 0) {
      // Header
      checkPage(12);
      doc.setFontSize(9);
      setColor(C.muted);
      doc.setFont('helvetica', 'bold');
      doc.text('Category', margin, y);
      doc.text('Time', margin + 70, y);
      doc.text('Breaks', margin + 100, y);
      doc.text('Distractions', margin + 125, y);
      y += 6;

      distractionAnalytics.tasks.forEach(t => {
        checkPage(8);
        doc.setFontSize(10);
        setColor(C.white);
        doc.setFont('helvetica', 'normal');
        doc.text(t.title || '—', margin, y);

        setColor(C.secondary);
        doc.text(fmtDuration(t.time), margin + 70, y);

        setColor(t.breaks > 0 ? C.amber : C.muted);
        doc.text(String(t.breaks), margin + 100, y);

        setColor(t.distractions > 0 ? C.red : C.muted);
        doc.text(String(t.distractions), margin + 125, y);
        y += 7;
      });
      y += 4;
    }

    // Timing analysis
    if (distractionAnalytics.timing?.length > 0) {
      checkPage(30);
      y += 4;
      doc.setFontSize(10);
      setColor(C.muted);
      doc.setFont('helvetica', 'normal');
      doc.text('Distraction Timing:', margin, y);
      y += 7;

      distractionAnalytics.timing.forEach(t => {
        checkPage(8);
        drawKeyValue(`${t.name}`, `${t.count} distraction${t.count !== 1 ? 's' : ''}`);
      });
    }

    drawSeparator();
  }

  // ─────────────────────────────────
  // TASK-LEVEL DETAIL
  // ─────────────────────────────────
  if (taskSummary?.tasks?.length > 0) {
    drawSectionTitle('Task Detail');

    taskSummary.tasks.forEach(t => {
      checkPage(22);

      doc.setFontSize(11);
      setColor(C.white);
      doc.setFont('helvetica', 'bold');
      doc.text(t.title, margin, y);
      y += 5;

      doc.setFontSize(9);
      setColor(C.muted);
      doc.setFont('helvetica', 'normal');
      const meta = [
        `${t.category}`,
        `${fmtDuration(t.time)}`,
        `${t.sessions} session${t.sessions !== 1 ? 's' : ''}`,
        `${t.breaks} break${t.breaks !== 1 ? 's' : ''}`,
        `${t.distractions} distraction${t.distractions !== 1 ? 's' : ''}`,
      ].join('  •  ');
      doc.text(meta, margin, y);
      y += 9;
    });

    drawSeparator();
  }

  // ─────────────────────────────────
  // DAILY BEHAVIOR DATA (Bar chart data as table)
  // ─────────────────────────────────
  if (chartData?.data?.length > 0) {
    drawSectionTitle(`Daily Breakdown — ${chartData.periodLabel || ''}`);

    // Header
    checkPage(12);
    doc.setFontSize(9);
    setColor(C.muted);
    doc.setFont('helvetica', 'bold');
    doc.text('Day', margin, y);
    doc.text('Focus (hrs)', margin + 40, y);
    doc.text('Distractions', margin + 75, y);
    doc.text('Breaks', margin + 110, y);
    y += 6;

    chartData.data.forEach(d => {
      checkPage(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      setColor(C.white);
      doc.text(d.fullLabel || d.label || '—', margin, y);

      setColor(C.secondary);
      doc.text(String(d.hours ?? '0'), margin + 40, y);

      setColor((d.distractions || 0) > 0 ? C.red : C.muted);
      doc.text(String(d.distractions ?? '0'), margin + 75, y);

      setColor((d.breaks || 0) > 0 ? C.amber : C.muted);
      doc.text(String(d.breaks ?? '0'), margin + 110, y);
      y += 7;
    });

    drawSeparator();
  }

  // ─────────────────────────────────
  // INSIGHT FOOTER
  // ─────────────────────────────────
  checkPage(40);
  setFill(C.surfaceLight);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');

  doc.setFontSize(10);
  setColor(C.muted);
  doc.setFont('helvetica', 'normal');
  doc.text('Takeaway', margin + 8, y + 8);

  doc.setFontSize(11);
  setColor(C.white);
  doc.setFont('helvetica', 'italic');

  // Generate a smart insight
  let insight = 'Keep pushing. Consistency is the strategy.';
  if (advancedMetrics) {
    const eff = advancedMetrics.focusEfficiency;
    const peak = advancedMetrics.peakProductivityZone;
    const friction = advancedMetrics.totalFriction;

    if (friction === 0) {
      insight = 'Zero friction events. Absolute focus. This is your peak.';
    } else if (eff >= 2) {
      insight = `Strong efficiency at ${eff} hrs/friction. ${peak} is your power zone.`;
    } else if (eff >= 1) {
      insight = `Decent flow, but friction is creeping in. Protect your ${peak} window.`;
    } else {
      insight = `High friction detected. Consider shorter sessions and blocking ${peak} distractions.`;
    }
  }
  
  const splitInsight = doc.splitTextToSize(`"${insight}"`, contentW - 16);
  doc.text(splitInsight, margin + 8, y + 16);
  y += 36;

  // ── Footer ──
  checkPage(15);
  doc.setFontSize(8);
  setColor(C.muted);
  doc.setFont('helvetica', 'normal');
  const footer = `Generated by Pulse  •  ${new Date().toLocaleString()}`;
  doc.text(footer, W / 2 - doc.getTextWidth(footer) / 2, H - 10);

  // ── Save ──
  const filename = `Pulse_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// ─── Export Button Component ───
export default function ExportReport({
  overview,
  chartData,
  taskSummary,
  categorySummary,
  advancedMetrics,
  distractionAnalytics,
  chartView,
}) {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    setGenerating(true);
    try {
      generateReport({
        overview,
        chartData,
        taskSummary,
        categorySummary,
        advancedMetrics,
        distractionAnalytics,
        chartView,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setTimeout(() => setGenerating(false), 500);
    }
  };

  return (
    <button
      id="export-report-btn"
      className="btn btn-primary"
      onClick={handleExport}
      disabled={generating}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '10px 20px',
        fontSize: 'var(--font-sm)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        opacity: generating ? 0.6 : 1,
        cursor: generating ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={{ fontSize: '16px' }}>📄</span>
      {generating ? 'Generating...' : 'Export Report'}
    </button>
  );
}
