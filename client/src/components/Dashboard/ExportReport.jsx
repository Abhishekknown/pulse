import { useState } from 'react';
import { jsPDF } from 'jspdf';

// ─── Dark Theme Palette ───
const C = {
  bg:      [13, 13, 13],
  card:    [22, 22, 22],
  cardAlt: [18, 18, 18],
  white:   [255, 255, 255],
  sec:     [161, 161, 161],
  muted:   [100, 100, 100],
  line:    [42, 42, 42],
  green:   [74, 222, 128],
  amber:   [250, 204, 21],
  blue:    [96, 165, 250],
  red:     [239, 68, 68],
  purple:  [168, 130, 255],
  cyan:    [34, 211, 238],
  pink:    [251, 113, 133],
  orange:  [251, 146, 60],
};

const catColors = [C.blue, C.green, C.amber, C.purple, C.cyan, C.pink, C.orange, C.red];

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
  const m = 10;
  const cw = W - m * 2; // 190

  const setC = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const setF = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setD = (c) => doc.setDrawColor(c[0], c[1], c[2]);

  // ── Background ──
  setF(C.bg); doc.rect(0, 0, W, H, 'F');

  let y = m;

  // ═══════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════
  // Pulse logo circle
  setF(C.white);
  doc.circle(m + 5, y + 5, 4, 'F');
  setC(C.bg);
  doc.setFont('times', 'bold'); doc.setFontSize(7);
  doc.text('P', m + 3.8, y + 6.4);

  // Title
  doc.setFont('times', 'italic'); doc.setFontSize(24);
  setC(C.white);
  doc.text('Performance Report', m + 14, y + 7);

  // Date
  y += 12;
  setF(C.line); doc.rect(m, y, cw, 0.3, 'F');
  y += 3;
  doc.setFont('times', 'normal'); doc.setFontSize(8);
  setC(C.muted);
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  doc.text(dateStr, W / 2, y, { align: 'center' });
  y += 5;

  // ═══════════════════════════════════════════
  // OVERVIEW — 3 metric cards side by side
  // ═══════════════════════════════════════════
  const drawSection = (x, sy, w, h, title) => {
    setF(C.card); setD(C.line);
    doc.roundedRect(x, sy, w, h, 2, 2, 'FD');
    if (title) {
      doc.setFont('times', 'bold'); doc.setFontSize(10);
      setC(C.white);
      doc.text(title, x + 5, sy + 6);
    }
  };

  // Overview wrapper
  drawSection(m, y, cw, 22, 'Overview');
  const ov = [
    { val: `${overview?.totalFocusHours ?? 0}`, unit: 'HOURS', sub: 'FOCUSED' },
    { val: `${overview?.totalSessions ?? 0}`, unit: 'TOTAL', sub: 'SESSIONS' },
    { val: `${overview?.streak ?? 0}`, unit: 'DAY', sub: 'STREAK' },
  ];
  const ovCardW = (cw - 16) / 3;

  ov.forEach((item, i) => {
    const cx = m + 5 + i * (ovCardW + 3);
    const cy = y + 9;

    // Card bg
    setF(C.cardAlt); setD(C.line);
    doc.roundedRect(cx, cy, ovCardW, 11, 1.5, 1.5, 'FD');

    // Value
    doc.setFont('times', 'bold'); doc.setFontSize(18);
    setC(C.white);
    doc.text(item.val, cx + 5, cy + 7);

    // Labels
    doc.setFont('times', 'bold'); doc.setFontSize(6.5);
    setC(C.sec);
    const labelX = cx + 5 + doc.getTextWidth(item.val) * (18/doc.internal.getFontSize()) + 6;
    doc.text(item.unit, cx + ovCardW - 4, cy + 4.5, { align: 'right' });
    doc.text(item.sub, cx + ovCardW - 4, cy + 8, { align: 'right' });
  });

  y += 25;

  // ═══════════════════════════════════════════
  // ADVANCED METRICS
  // ═══════════════════════════════════════════
  if (advancedMetrics) {
    drawSection(m, y, cw, 30, 'Advanced Metrics');
    let ty = y + 10;

    const metrics = [
      { icon: '⚡', label: 'Efficiency Ratio', val: `${advancedMetrics.focusEfficiency}`, unit: 'hrs/friction' },
      { icon: '🌙', label: 'Peak Zone', val: advancedMetrics.peakProductivityZone || 'N/A', unit: '' },
      { icon: '📊', label: 'Session Density', val: `${advancedMetrics.sessionDensity}`, unit: 'sessions' },
      { icon: '⚠', label: 'Total Friction', val: `${advancedMetrics.totalFriction}`, unit: 'events' },
    ];

    metrics.forEach((met, i) => {
      doc.setFont('times', 'normal'); doc.setFontSize(8);
      setC(C.sec);
      doc.text(met.label, m + 8, ty);

      doc.setFont('times', 'bold'); doc.setFontSize(12);
      setC(C.white);
      doc.text(met.val, m + 55, ty);

      doc.setFont('times', 'normal'); doc.setFontSize(7);
      setC(C.muted);
      doc.text(met.unit, m + 55 + doc.getTextWidth(met.val) * (12 / 7) + 2, ty);

      ty += 5;
    });

    // Right side — category % list
    if (categorySummary?.categories?.length > 0) {
      const cats = categorySummary.categories;
      const total = categorySummary.totalTime || 1;
      let ry = y + 10;

      cats.slice(0, 5).forEach((cat, i) => {
        const pct = ((cat.time / total) * 100).toFixed(0);
        const color = catColors[i % catColors.length];

        // Colored square
        setF(color);
        doc.rect(m + 120, ry - 2.5, 3, 3, 'F');

        doc.setFont('times', 'bold'); doc.setFontSize(9);
        setC(C.white);
        doc.text(`${pct}%`, m + 126, ry);

        ry += 5;
      });
    }

    y += 33;
  }

  // ═══════════════════════════════════════════
  // TWO-COLUMN BODY
  // ═══════════════════════════════════════════
  const gap = 4;
  const halfW = (cw - gap) / 2;
  const lx = m;
  const rx = m + halfW + gap;
  let ly = y, ry = y;

  // ── Helper: table header ──
  const drawTableHeader = (x, ty, w, cols, labels) => {
    setF(C.line); doc.rect(x + 3, ty, w - 6, 0.2, 'F');
    ty += 3;
    doc.setFont('times', 'bold'); doc.setFontSize(6);
    setC(C.muted);
    let cx = x + 4;
    labels.forEach((label, i) => {
      if (i === labels.length - 1) {
        doc.text(label, x + w - 4, ty, { align: 'right' });
      } else {
        doc.text(label, cx, ty);
      }
      cx += cols[i];
    });
    return ty + 3;
  };

  // ═══════════════════════════════════════════
  // LEFT: FOCUS CATEGORIES
  // ═══════════════════════════════════════════
  if (categorySummary?.categories?.length > 0) {
    const cats = categorySummary.categories;
    const total = categorySummary.totalTime || 1;
    const rowH = 5;
    const boxH = 10 + cats.length * rowH + 2;

    drawSection(lx, ly, halfW, boxH, 'Focus Categories');

    // Table header
    let ty = ly + 8;
    doc.setFont('times', 'bold'); doc.setFontSize(6);
    setC(C.muted);
    doc.text('CATEGORY', lx + 10, ty);
    doc.text('TIME', lx + 42, ty);
    doc.text('SESSIONS', lx + 58, ty);
    doc.text('%', lx + halfW - 4, ty, { align: 'right' });

    setF(C.line); doc.rect(lx + 4, ty + 1, halfW - 8, 0.2, 'F');
    ty += 4;

    cats.forEach((cat, i) => {
      const pct = ((cat.time / total) * 100).toFixed(0);
      const color = catColors[i % catColors.length];

      // Colored indicator
      setF(color);
      doc.roundedRect(lx + 5, ty - 2.5, 3, 3, 0.5, 0.5, 'F');

      doc.setFont('times', 'normal'); doc.setFontSize(7.5);
      setC(C.white);
      doc.text((cat.name || '—').substring(0, 16), lx + 10, ty);

      setC(C.sec);
      doc.text(fmtDur(cat.time), lx + 42, ty);
      doc.text(String(cat.sessions), lx + 62, ty);

      doc.setFont('times', 'bold');
      setC(C.white);
      doc.text(`${pct}%`, lx + halfW - 4, ty, { align: 'right' });

      ty += rowH;
    });

    ly += boxH + 3;
  }

  // ═══════════════════════════════════════════
  // LEFT: TASKS
  // ═══════════════════════════════════════════
  if (taskSummary?.tasks?.length > 0) {
    const tasks = taskSummary.tasks.slice(0, 10);
    const rowH = 5;
    const boxH = 10 + tasks.length * rowH + 2;

    drawSection(lx, ly, halfW, boxH, 'Tasks');

    let ty = ly + 8;
    doc.setFont('times', 'bold'); doc.setFontSize(6);
    setC(C.muted);
    doc.text('TASK', lx + 10, ty);
    doc.text('TIME', lx + 46, ty);
    doc.text('DIST.', lx + halfW - 4, ty, { align: 'right' });

    setF(C.line); doc.rect(lx + 4, ty + 1, halfW - 8, 0.2, 'F');
    ty += 4;

    tasks.forEach((t, i) => {
      const color = catColors[i % catColors.length];

      // Colored indicator
      setF(color);
      doc.roundedRect(lx + 5, ty - 2.5, 3, 3, 0.5, 0.5, 'F');

      doc.setFont('times', 'normal'); doc.setFontSize(7);
      setC(C.white);
      doc.text((t.title || '—').substring(0, 14), lx + 10, ty);

      setC(C.muted); doc.setFontSize(6.5);
      doc.text((t.category || '').substring(0, 10), lx + 34, ty);

      setC(C.sec); doc.setFontSize(7);
      doc.text(fmtDur(t.time), lx + 51, ty);

      setC(t.distractions > 0 ? C.red : C.muted);
      doc.setFont('times', 'bold');
      doc.text(String(t.distractions), lx + halfW - 4, ty, { align: 'right' });

      ty += rowH;
    });

    ly += boxH + 3;
  }

  // ═══════════════════════════════════════════
  // RIGHT: DISTRACTION ANALYSIS
  // ═══════════════════════════════════════════
  if (distractionAnalytics?.tasks?.length > 0) {
    const items = distractionAnalytics.tasks;
    const rowH = 5;
    const boxH = 18 + items.length * rowH + 2;

    drawSection(rx, ry, halfW, boxH, 'Distraction Analysis');

    let ty = ry + 9;
    doc.setFont('times', 'bold'); doc.setFontSize(7);
    setC(C.sec);
    doc.text('DISTRACTIONS BY CATEGORY', rx + 5, ty);
    ty += 1;

    doc.setFont('times', 'bold'); doc.setFontSize(6);
    setC(C.muted);
    doc.text('DIST.', rx + halfW - 4, ty + 2, { align: 'right' });
    setF(C.line); doc.rect(rx + 4, ty + 3, halfW - 8, 0.2, 'F');
    ty += 6;

    items.forEach((t, i) => {
      const color = catColors[i % catColors.length];

      // Colored square
      setF(color);
      doc.roundedRect(rx + 5, ty - 2.5, 3, 3, 0.5, 0.5, 'F');

      doc.setFont('times', 'normal'); doc.setFontSize(7.5);
      setC(C.white);
      doc.text((t.title || '—').substring(0, 22), rx + 10, ty);

      doc.setFont('times', 'bold'); doc.setFontSize(9);
      setC(t.distractions > 0 ? C.white : C.muted);
      doc.text(String(t.distractions), rx + halfW - 4, ty, { align: 'right' });

      ty += rowH;
    });

    ry += boxH + 3;
  }

  // ═══════════════════════════════════════════
  // RIGHT: DAILY LOG
  // ═══════════════════════════════════════════
  if (chartData?.data?.length > 0) {
    const days = chartData.data.slice(0, 10);
    const rowH = 4.5;
    const boxH = 12 + days.length * rowH + 2;
    const periodLabel = chartData.periodLabel || '';

    drawSection(rx, ry, halfW, boxH, '');

    let ty = ry + 5;
    doc.setFont('times', 'bold'); doc.setFontSize(10);
    setC(C.white);
    doc.text('Daily Log', rx + 5, ty);

    doc.setFont('times', 'normal'); doc.setFontSize(7);
    setC(C.muted);
    doc.text(`- ${periodLabel}`, rx + 5 + doc.getTextWidth('Daily Log '), ty);

    ty += 4;
    doc.setFont('times', 'bold'); doc.setFontSize(6);
    setC(C.muted);
    doc.text('DAY', rx + 5, ty);
    doc.text('HRS', rx + 28, ty);
    doc.text('DIST.', rx + 42, ty);
    doc.text('BREAKS', rx + halfW - 4, ty, { align: 'right' });

    setF(C.line); doc.rect(rx + 4, ty + 1, halfW - 8, 0.2, 'F');
    ty += 4;

    days.forEach((d, i) => {
      // Alternating row bg
      if (i % 2 === 0) {
        setF(C.cardAlt);
        doc.rect(rx + 3, ty - 3, halfW - 6, rowH, 'F');
      }

      doc.setFont('times', 'normal'); doc.setFontSize(7);
      setC(C.white);
      doc.text((d.fullLabel || d.label || '—').substring(0, 10), rx + 5, ty);

      setC(C.sec);
      doc.text(String(d.hours ?? '0'), rx + 28, ty);

      setC((d.distractions || 0) > 0 ? C.red : C.muted);
      doc.text(String(d.distractions ?? '0'), rx + 42, ty);

      setC((d.breaks || 0) > 0 ? C.amber : C.muted);
      doc.text(String(d.breaks ?? '0'), rx + halfW - 4, ty, { align: 'right' });

      ty += rowH;
    });

    ry += boxH + 3;
  }

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  setF(C.line); doc.rect(m, H - 14, cw, 0.3, 'F');

  doc.setFont('times', 'italic'); doc.setFontSize(7);
  setC(C.muted);
  doc.text(`Generated by Pulse  ·  ${new Date().toLocaleString()}`, W / 2, H - 10, { align: 'center' });

  doc.save(`Pulse_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Button Component ───
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
