import { useState } from 'react';
import { jsPDF } from 'jspdf';

// ─── Color Palette (Dark Theme) ───
const C = {
  bg: [13, 13, 13],
  surface: [26, 26, 26],
  white: [255, 255, 255],
  secondary: [161, 161, 161],
  muted: [107, 107, 107],
  green: [74, 222, 128],
  amber: [250, 204, 21],
  blue: [96, 165, 250],
  red: [239, 68, 68],
  line: [40, 40, 40],
};

function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// ─── ONE-PAGE NEWSPAPER LAYOUT ───
function generateReport({ overview, chartData, taskSummary, categorySummary, advancedMetrics, distractionAnalytics, chartView }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const m = 10; // margin
  const cw = W - m * 2; // content width = 190
  const col = cw / 2; // column width = 95
  const colGap = 4;
  const leftX = m;
  const rightX = m + col + colGap;
  const rightW = col - colGap;

  const setC = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setF = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  // ── Background ──
  setF(C.bg);
  doc.rect(0, 0, W, H, 'F');

  let y = m;

  // ═══════════════════════════════════════════
  // MASTHEAD
  // ═══════════════════════════════════════════
  setC(C.white);
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.text('Performance Report', W / 2, y + 6, { align: 'center' });
  y += 10;

  // Thin rule
  setF(C.white);
  doc.rect(m, y, cw, 0.4, 'F');
  y += 3;

  // Date line
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  setC(C.muted);
  const dateLine = `PULSE  ·  ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
  doc.text(dateLine, W / 2, y, { align: 'center' });
  y += 2;

  // Double rule
  setF(C.white);
  doc.rect(m, y, cw, 0.2, 'F');
  y += 0.8;
  doc.rect(m, y, cw, 0.6, 'F');
  y += 3;

  // ═══════════════════════════════════════════
  // HERO ROW — 3 big numbers
  // ═══════════════════════════════════════════
  const heroStats = [
    { val: `${overview?.totalFocusHours ?? 0}`, label: 'HOURS FOCUSED' },
    { val: `${overview?.totalSessions ?? 0}`, label: 'TOTAL SESSIONS' },
    { val: `${overview?.streak ?? 0}`, label: 'DAY STREAK' },
  ];
  const heroW = cw / heroStats.length;

  heroStats.forEach((s, i) => {
    const cx = m + i * heroW + heroW / 2;
    doc.setFont('times', 'bold');
    doc.setFontSize(32);
    setC(C.white);
    doc.text(s.val, cx, y + 8, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(6);
    setC(C.muted);
    doc.text(s.label, cx, y + 12, { align: 'center' });
  });
  y += 16;

  // Rule
  setF(C.line);
  doc.rect(m, y, cw, 0.3, 'F');
  y += 4;

  // ═══════════════════════════════════════════
  // TWO-COLUMN LAYOUT STARTS
  // ═══════════════════════════════════════════
  let ly = y; // left column Y
  let ry = y; // right column Y

  // ─── Helper: draw a bordered box with title ───
  const drawBox = (x, bY, w, h, title) => {
    setF(C.surface);
    doc.rect(x, bY, w, h, 'F');
    doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
    doc.rect(x, bY, w, h, 'S');
    if (title) {
      doc.setFont('times', 'bold');
      doc.setFontSize(7);
      setC(C.muted);
      doc.text(title.toUpperCase(), x + 3, bY + 4);
    }
  };

  // ─── Helper: draw a table row ───
  const tableRow = (x, rowY, cols, values, bold = false, valueColors = null) => {
    doc.setFont('times', bold ? 'bold' : 'normal');
    doc.setFontSize(7);
    let cx = x + 2;
    values.forEach((v, i) => {
      setC(valueColors?.[i] || (bold ? C.white : C.secondary));
      const colW = cols[i];
      if (i === values.length - 1) {
        doc.text(String(v), cx + colW - 2, rowY, { align: 'right' });
      } else {
        doc.text(String(v), cx, rowY);
      }
      cx += colW;
    });
  };

  // ═══════════════════════════════════════════
  // LEFT COLUMN
  // ═══════════════════════════════════════════

  // ── ADVANCED METRICS BOX ──
  if (advancedMetrics) {
    const boxH = 28;
    drawBox(leftX, ly, col, boxH, 'Advanced Metrics');
    let ty = ly + 8;
    const rows = [
      ['Efficiency Ratio', advancedMetrics.focusEfficiency, 'hrs/friction'],
      ['Peak Zone', advancedMetrics.peakProductivityZone || 'N/A', ''],
      ['Session Density', advancedMetrics.sessionDensity, 'sessions'],
      ['Total Friction', advancedMetrics.totalFriction, 'events'],
    ];
    rows.forEach(([label, val, unit]) => {
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      setC(C.secondary);
      doc.text(label, leftX + 3, ty);
      doc.setFont('times', 'bold');
      setC(C.white);
      const valStr = `${val}${unit ? ' ' + unit : ''}`;
      doc.text(valStr, leftX + col - 3, ty, { align: 'right' });
      ty += 5;
    });
    ly += boxH + 3;
  }

  // ── CATEGORY BREAKDOWN TABLE ──
  if (categorySummary?.categories?.length > 0) {
    const cats = categorySummary.categories;
    const totalTime = categorySummary.totalTime || 1;
    const rowH = 4.5;
    const boxH = 7 + cats.length * rowH + 2;
    drawBox(leftX, ly, col, boxH, 'Categories');

    let ty = ly + 8;
    // Header
    doc.setFont('times', 'bold');
    doc.setFontSize(6);
    setC(C.muted);
    doc.text('NAME', leftX + 3, ty);
    doc.text('TIME', leftX + 50, ty);
    doc.text('SESSIONS', leftX + 68, ty);
    doc.text('%', leftX + col - 3, ty, { align: 'right' });
    ty += 1;
    setF(C.line);
    doc.rect(leftX + 2, ty, col - 4, 0.2, 'F');
    ty += 3;

    cats.forEach(cat => {
      const pct = ((cat.time / totalTime) * 100).toFixed(0);
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      setC(C.white);
      doc.text((cat.name || '—').substring(0, 18), leftX + 3, ty);
      setC(C.secondary);
      doc.text(fmtDuration(cat.time), leftX + 50, ty);
      doc.text(String(cat.sessions), leftX + 68, ty);
      doc.text(`${pct}%`, leftX + col - 3, ty, { align: 'right' });
      ty += rowH;
    });

    ly += boxH + 3;
  }

  // ── TASK DETAIL TABLE ──
  if (taskSummary?.tasks?.length > 0) {
    const tasks = taskSummary.tasks.slice(0, 12); // max 12 tasks to fit
    const rowH = 4.5;
    const boxH = 7 + tasks.length * rowH + 2;
    drawBox(leftX, ly, col, boxH, 'Tasks');

    let ty = ly + 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(6);
    setC(C.muted);
    doc.text('TASK', leftX + 3, ty);
    doc.text('CATEGORY', leftX + 38, ty);
    doc.text('TIME', leftX + 62, ty);
    doc.text('DIST.', leftX + col - 3, ty, { align: 'right' });
    ty += 1;
    setF(C.line);
    doc.rect(leftX + 2, ty, col - 4, 0.2, 'F');
    ty += 3;

    tasks.forEach(t => {
      doc.setFont('times', 'normal');
      doc.setFontSize(6.5);
      setC(C.white);
      doc.text((t.title || '—').substring(0, 16), leftX + 3, ty);
      setC(C.muted);
      doc.text((t.category || '—').substring(0, 10), leftX + 38, ty);
      setC(C.secondary);
      doc.text(fmtDuration(t.time), leftX + 62, ty);
      setC(t.distractions > 0 ? C.red : C.muted);
      doc.text(String(t.distractions), leftX + col - 3, ty, { align: 'right' });
      ty += rowH;
    });

    ly += boxH + 3;
  }

  // ═══════════════════════════════════════════
  // RIGHT COLUMN
  // ═══════════════════════════════════════════

  // ── DISTRACTION ANALYSIS BOX ──
  if (distractionAnalytics?.tasks?.length > 0) {
    const items = distractionAnalytics.tasks;
    const rowH = 4.5;
    const boxH = 7 + items.length * rowH + 2;
    drawBox(rightX, ry, rightW, boxH, 'Distractions by Category');

    let ty = ry + 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(6);
    setC(C.muted);
    doc.text('CATEGORY', rightX + 3, ty);
    doc.text('BREAKS', rightX + 50, ty);
    doc.text('DIST.', rightX + rightW - 3, ty, { align: 'right' });
    ty += 1;
    setF(C.line);
    doc.rect(rightX + 2, ty, rightW - 4, 0.2, 'F');
    ty += 3;

    items.forEach(t => {
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      setC(C.white);
      doc.text((t.title || '—').substring(0, 22), rightX + 3, ty);
      setC(t.breaks > 0 ? C.amber : C.muted);
      doc.text(String(t.breaks), rightX + 50, ty);
      setC(t.distractions > 0 ? C.red : C.muted);
      doc.text(String(t.distractions), rightX + rightW - 3, ty, { align: 'right' });
      ty += rowH;
    });

    ry += boxH + 3;
  }

  // ── TIMING ANALYSIS BOX ──
  if (distractionAnalytics?.timing?.length > 0) {
    const timings = distractionAnalytics.timing;
    const rowH = 4.5;
    const boxH = 7 + timings.length * rowH + 2;
    drawBox(rightX, ry, rightW, boxH, 'Distraction Timing');

    let ty = ry + 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(6);
    setC(C.muted);
    doc.text('WINDOW', rightX + 3, ty);
    doc.text('COUNT', rightX + rightW - 3, ty, { align: 'right' });
    ty += 1;
    setF(C.line);
    doc.rect(rightX + 2, ty, rightW - 4, 0.2, 'F');
    ty += 3;

    timings.forEach(t => {
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      setC(C.white);
      doc.text(t.name || '—', rightX + 3, ty);
      setC(C.secondary);
      doc.text(String(t.count), rightX + rightW - 3, ty, { align: 'right' });
      ty += rowH;
    });

    ry += boxH + 3;
  }

  // ── DAILY BREAKDOWN TABLE ──
  if (chartData?.data?.length > 0) {
    const days = chartData.data.slice(0, 14); // max 14 days
    const rowH = 4.2;
    const boxH = 7 + days.length * rowH + 2;
    drawBox(rightX, ry, rightW, boxH, `Daily Log · ${chartData.periodLabel || ''}`);

    let ty = ry + 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(6);
    setC(C.muted);
    doc.text('DAY', rightX + 3, ty);
    doc.text('HRS', rightX + 35, ty);
    doc.text('DIST.', rightX + 52, ty);
    doc.text('BREAKS', rightX + rightW - 3, ty, { align: 'right' });
    ty += 1;
    setF(C.line);
    doc.rect(rightX + 2, ty, rightW - 4, 0.2, 'F');
    ty += 3;

    days.forEach(d => {
      doc.setFont('times', 'normal');
      doc.setFontSize(6.5);
      setC(C.white);
      doc.text(d.fullLabel || d.label || '—', rightX + 3, ty);
      setC(C.secondary);
      doc.text(String(d.hours ?? '0'), rightX + 35, ty);
      setC((d.distractions || 0) > 0 ? C.red : C.muted);
      doc.text(String(d.distractions ?? '0'), rightX + 52, ty);
      setC((d.breaks || 0) > 0 ? C.amber : C.muted);
      doc.text(String(d.breaks ?? '0'), rightX + rightW - 3, ty, { align: 'right' });
      ty += rowH;
    });

    ry += boxH + 3;
  }

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  setF(C.white);
  doc.rect(m, H - 14, cw, 0.2, 'F');
  doc.rect(m, H - 13.6, cw, 0.5, 'F');

  doc.setFont('times', 'italic');
  doc.setFontSize(7);
  setC(C.muted);
  doc.text(`Generated by Pulse  ·  ${new Date().toLocaleString()}`, W / 2, H - 10, { align: 'center' });

  // ── Save ──
  doc.save(`Pulse_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Export Button ───
export default function ExportReport({ overview, chartData, taskSummary, categorySummary, advancedMetrics, distractionAnalytics, chartView }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    setGenerating(true);
    try {
      generateReport({ overview, chartData, taskSummary, categorySummary, advancedMetrics, distractionAnalytics, chartView });
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
