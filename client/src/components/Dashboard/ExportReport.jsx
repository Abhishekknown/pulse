import { useState } from 'react';
import { jsPDF } from 'jspdf';

// ─── Design Tokens (mm) ───
const SP = { micro: 2, sm: 3, md: 4, lg: 6, xl: 8, section: 10 };
const CLR = {
  bg:    [13, 13, 13],
  white: [255, 255, 255],
  sec:   [161, 161, 161],
  muted: [107, 107, 107],
  line:  [31, 31, 31],
  dot:   [96, 165, 250],    // blue
  dots: [[96,165,250],[74,222,128],[250,204,21],[168,130,255],[34,211,238],[251,113,133],[251,146,60],[239,68,68]],
};

function fmtDur(s) {
  if (!s || s <= 0) return '0s';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function generateReport({ overview, chartData, taskSummary, categorySummary, advancedMetrics, distractionAnalytics }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const mx = 16, my = 12;       // margins
  const cw = W - mx * 2;        // content width ~178
  const leftW = cw * 0.58;      // ~60% left column
  const rightX = mx + leftW + SP.xl;
  const rightW = cw - leftW - SP.xl; // ~40% right column

  const sc = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const sf = (c) => doc.setFillColor(c[0], c[1], c[2]);

  // Background
  sf(CLR.bg); doc.rect(0, 0, W, H, 'F');

  let y = my;

  // ─── Separator line ───
  const drawLine = (ly) => {
    sf(CLR.line); doc.rect(mx, ly, cw, 0.3, 'F');
  };

  // ═══════════════════════════════════════════════
  // TITLE
  // ═══════════════════════════════════════════════
  doc.setFont('times', 'normal'); doc.setFontSize(22);
  sc(CLR.white);
  doc.text('Performance Report', mx, y + 6);
  y += 10;

  // Date
  doc.setFont('times', 'normal'); doc.setFontSize(9);
  sc(CLR.muted);
  doc.text(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), mx, y);
  y += SP.lg;

  drawLine(y); y += SP.xl;

  // ═══════════════════════════════════════════════
  // KEY METRICS — Big numbers, horizontal
  // ═══════════════════════════════════════════════
  const metrics = [
    { val: `${overview?.totalFocusHours ?? 0}`, label: 'Hours Focused' },
    { val: `${overview?.totalSessions ?? 0}`, label: 'Total Sessions' },
    { val: `${overview?.daysAccessed ?? 0}`, label: 'Days Active' },
    { val: `${overview?.streak ?? 0}`, label: 'Day Streak' },
  ];
  const metricW = cw / metrics.length;

  metrics.forEach((m, i) => {
    const cx = mx + i * metricW;

    // Big number
    doc.setFont('times', 'bold'); doc.setFontSize(28);
    sc(CLR.white);
    doc.text(m.val, cx, y + 7);

    // Label below
    doc.setFont('times', 'normal'); doc.setFontSize(9);
    sc(CLR.muted);
    doc.text(m.label, cx, y + 12);
  });
  y += 18;

  drawLine(y); y += SP.section;

  // ═══════════════════════════════════════════════
  // ADVANCED METRICS — ledger rows
  // ═══════════════════════════════════════════════
  if (advancedMetrics) {
    // Section title
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    sc(CLR.sec);
    doc.text('ADVANCED METRICS', mx, y);
    y += SP.lg;

    const advRows = [
      ['Efficiency Ratio', `${advancedMetrics.focusEfficiency}`, 'hrs / friction'],
      ['Peak Productivity Zone', advancedMetrics.peakProductivityZone || 'None', ''],
      ['Session Density', `${advancedMetrics.sessionDensity}`, 'sessions'],
      ['Total Friction', `${advancedMetrics.totalFriction}`, 'events'],
    ];

    advRows.forEach(([label, val, unit]) => {
      // Label
      doc.setFont('times', 'normal'); doc.setFontSize(10);
      sc(CLR.muted);
      doc.text(label, mx, y);

      // Value — right aligned to left column
      doc.setFont('times', 'bold'); doc.setFontSize(14);
      sc(CLR.white);
      const valW = doc.getTextWidth(val);
      doc.text(val, mx + leftW - valW - (unit ? doc.getTextWidth(' ' + unit) * (9/14) + 2 : 0), y);

      // Unit
      if (unit) {
        doc.setFont('times', 'normal'); doc.setFontSize(9);
        sc(CLR.muted);
        doc.text(unit, mx + leftW - doc.getTextWidth(unit), y);
      }

      y += SP.md + 1;
    });

    y += SP.sm;
    drawLine(y); y += SP.section;
  }

  // ═══════════════════════════════════════════════
  // TWO-COLUMN SECTION
  // ═══════════════════════════════════════════════
  const colStartY = y;
  let ly = y, ry = y;

  // ─── LEFT: FOCUS CATEGORIES ───
  if (categorySummary?.categories?.length > 0) {
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    sc(CLR.sec);
    doc.text('FOCUS CATEGORIES', mx, ly);
    ly += SP.lg;

    const cats = categorySummary.categories;
    const total = categorySummary.totalTime || 1;

    cats.forEach((cat, i) => {
      const pct = ((cat.time / total) * 100).toFixed(0);
      const dotClr = CLR.dots[i % CLR.dots.length];

      // Colored dot
      sf(dotClr); doc.circle(mx + 1.5, ly - 1, 1.2, 'F');

      // Name
      doc.setFont('times', 'normal'); doc.setFontSize(10);
      sc(CLR.white);
      doc.text((cat.name || '—').substring(0, 18), mx + 5, ly);

      // Time — aligned
      doc.setFontSize(10); sc(CLR.sec);
      doc.text(fmtDur(cat.time), mx + 52, ly);

      // Sessions
      sc(CLR.muted); doc.setFontSize(9);
      doc.text(`${cat.sessions}`, mx + 78, ly);

      // Percentage — bold, right edge
      doc.setFont('times', 'bold'); doc.setFontSize(11);
      sc(CLR.white);
      doc.text(`${pct}%`, mx + leftW - 2, ly, { align: 'right' });

      ly += SP.md + SP.micro;
    });

    ly += SP.lg;

    // Subtle separator for next section
    sf(CLR.line); doc.rect(mx, ly, leftW, 0.2, 'F');
    ly += SP.xl;
  }

  // ─── LEFT: TASKS ───
  if (taskSummary?.tasks?.length > 0) {
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    sc(CLR.sec);
    doc.text('TASKS', mx, ly);
    ly += SP.lg;

    const tasks = taskSummary.tasks.slice(0, 10);

    tasks.forEach((t, i) => {
      const dotClr = CLR.dots[i % CLR.dots.length];

      // Dot
      sf(dotClr); doc.circle(mx + 1.5, ly - 1, 1.2, 'F');

      // Task name
      doc.setFont('times', 'normal'); doc.setFontSize(9.5);
      sc(CLR.white);
      doc.text((t.title || '—').substring(0, 16), mx + 5, ly);

      // Category (muted)
      doc.setFontSize(8); sc(CLR.muted);
      doc.text((t.category || '').substring(0, 12), mx + 40, ly);

      // Time
      doc.setFontSize(9.5); sc(CLR.sec);
      doc.text(fmtDur(t.time), mx + 62, ly);

      // Distractions — right edge
      doc.setFont('times', 'bold'); doc.setFontSize(10);
      sc(t.distractions > 0 ? CLR.dots[7] : CLR.muted); // red if > 0
      doc.text(String(t.distractions), mx + leftW - 2, ly, { align: 'right' });

      ly += SP.md + SP.micro;
    });

    ly += SP.lg;
  }

  // ─── RIGHT: DISTRACTION ANALYSIS ───
  if (distractionAnalytics?.tasks?.length > 0) {
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    sc(CLR.sec);
    doc.text('DISTRACTIONS', rightX, ry);
    ry += SP.lg;

    distractionAnalytics.tasks.forEach((t, i) => {
      const dotClr = CLR.dots[i % CLR.dots.length];

      // Dot
      sf(dotClr); doc.circle(rightX + 1.5, ry - 1, 1.2, 'F');

      // Category name
      doc.setFont('times', 'normal'); doc.setFontSize(10);
      sc(CLR.white);
      doc.text((t.title || '—').substring(0, 18), rightX + 5, ry);

      // Count — right aligned, bold
      doc.setFont('times', 'bold'); doc.setFontSize(12);
      sc(t.distractions > 0 ? CLR.white : CLR.muted);
      doc.text(String(t.distractions), rightX + rightW, ry, { align: 'right' });

      ry += SP.md + SP.micro;
    });

    ry += SP.lg;

    // Separator
    sf(CLR.line); doc.rect(rightX, ry, rightW, 0.2, 'F');
    ry += SP.xl;
  }

  // ─── RIGHT: DAILY LOG ───
  if (chartData?.data?.length > 0) {
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    sc(CLR.sec);
    doc.text('DAILY LOG', rightX, ry);

    // Period label
    if (chartData.periodLabel) {
      doc.setFontSize(8); sc(CLR.muted);
      doc.text(chartData.periodLabel, rightX + doc.getTextWidth('DAILY LOG') * (11/8) + 4, ry);
    }
    ry += SP.lg;

    // Column headers
    doc.setFont('times', 'normal'); doc.setFontSize(7);
    sc(CLR.muted);
    doc.text('DAY', rightX, ry);
    doc.text('HRS', rightX + 25, ry);
    doc.text('DIST', rightX + 38, ry);
    doc.text('BRK', rightX + rightW, ry, { align: 'right' });
    ry += SP.sm;

    sf(CLR.line); doc.rect(rightX, ry, rightW, 0.15, 'F');
    ry += SP.sm;

    chartData.data.slice(0, 12).forEach((d) => {
      doc.setFont('times', 'normal'); doc.setFontSize(9);
      sc(CLR.white);
      doc.text((d.fullLabel || d.label || '—').substring(0, 10), rightX, ry);

      sc(CLR.sec);
      doc.text(String(d.hours ?? '0'), rightX + 25, ry);

      sc((d.distractions || 0) > 0 ? CLR.dots[7] : CLR.muted);
      doc.text(String(d.distractions ?? '0'), rightX + 38, ry);

      sc((d.breaks || 0) > 0 ? CLR.dots[2] : CLR.muted);
      doc.text(String(d.breaks ?? '0'), rightX + rightW, ry, { align: 'right' });

      ry += SP.md;
    });

    ry += SP.lg;
  }

  // ═══════════════════════════════════════════════
  // BOTTOM SECTION — Full width, after columns
  // ═══════════════════════════════════════════════
  y = Math.max(ly, ry) + SP.sm;

  // Only draw if we have room
  if (y < H - 30) {
    drawLine(y); y += SP.xl;

    // Timing analysis as a horizontal band
    if (distractionAnalytics?.timing?.length > 0) {
      doc.setFont('times', 'normal'); doc.setFontSize(11);
      sc(CLR.sec);
      doc.text('DISTRACTION TIMING', mx, y);
      y += SP.lg;

      const timings = distractionAnalytics.timing;
      const timingW = cw / Math.max(timings.length, 1);

      timings.forEach((t, i) => {
        const tx = mx + i * timingW;

        doc.setFont('times', 'bold'); doc.setFontSize(16);
        sc(CLR.white);
        doc.text(String(t.count), tx, y + 4);

        doc.setFont('times', 'normal'); doc.setFontSize(8);
        sc(CLR.muted);
        doc.text(t.name, tx, y + 8);
      });

      y += 14;
    }
  }

  // ═══════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════
  drawLine(H - 16);

  doc.setFont('times', 'italic'); doc.setFontSize(8);
  sc(CLR.muted);
  doc.text(`Pulse  ·  ${new Date().toLocaleString()}`, mx, H - 11);

  doc.save(`Pulse_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Button ───
export default function ExportReport({ overview, chartData, taskSummary, categorySummary, advancedMetrics, distractionAnalytics, chartView }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    setGenerating(true);
    try {
      generateReport({ overview, chartData, taskSummary, categorySummary, advancedMetrics, distractionAnalytics, chartView });
    } catch (err) { console.error('PDF generation failed:', err); }
    finally { setTimeout(() => setGenerating(false), 500); }
  };

  return (
    <button
      id="export-report-btn"
      className="btn btn-primary"
      onClick={handleExport}
      disabled={generating}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 600,
        letterSpacing: '0.02em',
        opacity: generating ? 0.6 : 1, cursor: generating ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={{ fontSize: '16px' }}>📄</span>
      {generating ? 'Generating...' : 'Export Report'}
    </button>
  );
}
