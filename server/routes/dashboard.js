const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Discomfort = require('../models/Discomfort');
const DayLog = require('../models/DayLog');

// ── GET /api/dashboard/overview — All-time metrics ──
router.get('/overview', async (req, res) => {
  try {
    // Total focused time (all focus sessions ever)
    const focusSessions = await Task.find({
      sessionType: 'focus',
      status: { $in: ['completed', 'manual'] }
    });
    const totalFocusTime = focusSessions.reduce((s, t) => s + (t.duration || 0), 0);

    // Days accessed
    const dayLogs = await DayLog.find().sort({ date: -1 });
    const daysAccessed = dayLogs.length;

    // Current streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const dates = dayLogs.map(d => d.date).sort().reverse();

    if (dates.length > 0) {
      let checkDate = new Date(today);
      // If today doesn't have a log yet, start from yesterday
      if (dates[0] !== today) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      for (let i = 0; i < dates.length; i++) {
        const expected = checkDate.toISOString().split('T')[0];
        if (dates.includes(expected)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Total sessions
    const totalSessions = focusSessions.length;

    res.json({
      totalFocusTime,
      totalFocusHours: +(totalFocusTime / 3600).toFixed(1),
      daysAccessed,
      streak,
      totalSessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/dashboard/chart?view=week|month|year&date= — Bar chart data ──
router.get('/chart', async (req, res) => {
  try {
    const view = req.query.view || 'day';
    const refDate = req.query.date ? new Date(req.query.date.split('-')[0], req.query.date.split('-')[1] - 1, req.query.date.split('-')[2]) : new Date();
    
    let startDate, endDate, labels = [];

    // Helper to generate day labels
    const genDays = (start, end) => {
      let current = new Date(start);
      current.setHours(0, 0, 0, 0);
      const res = [];
      while(current <= end) {
        let startDay = new Date(current);
        let endDay = new Date(current);
        endDay.setHours(23, 59, 59, 999);
        res.push({
          startDate: startDay.toISOString(),
          endDate: endDay.toISOString(),
          label: current.toLocaleDateString('en-US', { weekday: 'short' }),
          fullLabel: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        current.setDate(current.getDate() + 1);
      }
      return res;
    };

    // Helper to generate week labels
    const genWeeks = (start, end) => {
      let current = new Date(start);
      current.setHours(0, 0, 0, 0);
      const res = [];
      let weekNum = 1;
      while(current <= end) {
        let startDay = new Date(current);
        let actEnd = new Date(current);
        actEnd.setDate(current.getDate() + 6);
        actEnd.setHours(23, 59, 59, 999);
        if (actEnd > end) actEnd = new Date(end);
        
        res.push({
          startDate: startDay.toISOString(),
          endDate: actEnd.toISOString(),
          label: `W${weekNum}`,
          fullLabel: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        });
        current = new Date(actEnd);
        current.setMilliseconds(current.getMilliseconds() + 1);
        weekNum++;
      }
      return res;
    };

    if (view === 'day') {
      // Show hours of the specific day
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      
      let current = new Date(startDate);
      while(current <= endDate) {
        let nxt = new Date(current);
        nxt.setHours(current.getHours() + 1);
        labels.push({
          startDate: current.toISOString(),
          endDate: nxt.toISOString(),
          label: current.getHours() + ':00',
          fullLabel: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + current.getHours() + ':00'
        });
        current = nxt;
      }

    } else if (view === 'week') {
      // Show days of the current week (Mon-Sun)
      const day = refDate.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate = new Date(refDate);
      startDate.setDate(refDate.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      labels = genDays(startDate, endDate);

    } else if (view === 'month') {
      // Show days of the current month
      startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      labels = genDays(startDate, endDate);
      labels.forEach(l => {
         const d = new Date(l.startDate);
         l.label = d.getDate().toString();
      });
    } else if (view === 'custom') {
      const [sy, sm, sd] = req.query.customStart.split('-');
      startDate = new Date(sy, sm - 1, sd);
      startDate.setHours(0, 0, 0, 0);
      const [ey, em, ed] = req.query.customEnd.split('-');
      endDate = new Date(ey, em - 1, ed);
      endDate.setHours(23, 59, 59, 999);
      
      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 14) {
        labels = genDays(startDate, endDate);
      } else if (diffDays <= 90) {
        labels = genWeeks(startDate, endDate);
      } else {
        // Group by months for > 90 days
        let current = new Date(startDate);
        current.setDate(1); // align to start of month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        while(current <= endDate) {
          let mStart = new Date(current);
          let mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          if (mStart < startDate) mStart = new Date(startDate);
          if (mEnd > endDate) mEnd = new Date(endDate);
          
          labels.push({
            startDate: mStart.toISOString(),
            endDate: mEnd.toISOString(),
            label: monthNames[mStart.getMonth()],
            fullLabel: monthNames[mStart.getMonth()] + ' ' + mStart.getFullYear()
          });
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        }
      }
    }

    // Fetch all focus sessions in the range
    const sessions = await Task.find({
      sessionType: 'focus',
      status: { $in: ['completed', 'manual'] },
      startTime: { $gte: startDate, $lte: endDate }
    }).populate('category');

    const discomforts = await Discomfort.find({
      timestamp: { $gte: startDate, $lte: endDate }
    });

    // Build chart data
    const chartData = labels.map(labelObj => {
      const pStart = new Date(labelObj.startDate).getTime();
      const pEnd = new Date(labelObj.endDate).getTime();
      const periodSessions = sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= pStart && t < pEnd;
      });
      const periodDiscomforts = discomforts.filter(d => {
        const t = new Date(d.timestamp).getTime();
        return t >= pStart && t < pEnd;
      });

      const totalSeconds = periodSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const hours = +(totalSeconds / 3600).toFixed(2);

      const breaks = periodDiscomforts.filter(d => d.actionTaken === 'took_break').length;
      const distractions = periodDiscomforts.filter(d => d.type === 'distraction' || d.actionTaken === 'gave_in' || d.actionTaken === 'switched_task').length;

      // Group by category for stacked bars
      const byCategory = {};
      periodSessions.forEach(s => {
        const catName = s.category?.name || 'Uncategorized';
        const catColor = s.category?.color || '#6c757d';
        if (!byCategory[catName]) {
          byCategory[catName] = { time: 0, color: catColor };
        }
        byCategory[catName].time += (s.duration || 0);
      });

      return {
        label: labelObj.label,
        fullLabel: labelObj.fullLabel,
        hours,
        breaks,
        distractions,
        totalSeconds,
        categories: byCategory
      };
    });

    let periodLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    res.json({ 
      view, 
      periodLabel, 
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0],
      data: chartData 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/dashboard/category-summary — Time per category ──
router.get('/category-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {
      sessionType: 'focus',
      status: { $in: ['completed', 'manual'] }
    };

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: s, $lte: e };
    }

    const sessions = await Task.find(filter).populate('category');

    const categorySummary = {};
    sessions.forEach(s => {
      const catId = s.category?._id?.toString() || 'uncategorized';
      const catName = s.category?.name || 'Uncategorized';
      const catColor = s.category?.color || '#6c757d';
      if (!categorySummary[catId]) {
        categorySummary[catId] = { name: catName, color: catColor, time: 0, sessions: 0 };
      }
      categorySummary[catId].time += (s.duration || 0);
      categorySummary[catId].sessions += 1;
    });

    const result = Object.values(categorySummary).sort((a, b) => b.time - a.time);
    const totalTime = result.reduce((s, c) => s + c.time, 0);

    res.json({ categories: result, totalTime });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/dashboard/task-summary — Time per task ──
router.get('/task-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {
      sessionType: 'focus',
      status: { $in: ['completed', 'manual'] }
    };

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: s, $lte: e };
    }

    const sessions = await Task.find(filter).populate('category');
    const sessionIds = sessions.map(s => s._id);
    const discomforts = await Discomfort.find({ taskId: { $in: sessionIds } });

    const taskSummary = {};
    sessions.forEach(s => {
      const key = s.title;
      if (!taskSummary[key]) {
        taskSummary[key] = {
          title: s.title,
          category: s.category?.name || 'Uncategorized',
          categoryColor: s.category?.color || '#6c757d',
          time: 0,
          sessions: 0,
          breaks: 0,
          distractions: 0
        };
      }
      taskSummary[key].time += (s.duration || 0);
      taskSummary[key].sessions += 1;
      
      const sDiscomforts = discomforts.filter(d => d.taskId.equals(s._id));
      taskSummary[key].breaks += sDiscomforts.filter(d => d.actionTaken === 'took_break').length;
      taskSummary[key].distractions += sDiscomforts.filter(d => d.type === 'distraction' || d.actionTaken === 'gave_in' || d.actionTaken === 'switched_task').length;
    });

    const result = Object.values(taskSummary).sort((a, b) => b.time - a.time);
    const totalTime = result.reduce((s, t) => s + t.time, 0);

    res.json({ tasks: result, totalTime });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/dashboard/focus-logs — Paginated focus logs ──
router.get('/focus-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { status: { $in: ['completed', 'manual'] } };

    const total = await Task.countDocuments(filter);
    const logs = await Task.find(filter)
      .populate('category')
      .populate('discomfortLogs')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      logs,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Keep legacy endpoints for compatibility
router.get('/summary', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      startTime: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'running' }
    }).populate('category');

    const totalTime = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const focusTime = tasks.filter(t => t.sessionType === 'focus')
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    res.json({
      date,
      totalTime,
      focusTime,
      taskCount: tasks.length,
      focusSessionCount: tasks.filter(t => t.sessionType === 'focus').length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      startTime: { $gte: dayStart, $lte: dayEnd }
    }).populate('category').populate('discomfortLogs').sort({ startTime: 1 });

    const discomforts = await Discomfort.find({
      timestamp: { $gte: dayStart, $lte: dayEnd }
    });

    res.json({ tasks, discomforts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ── GET /api/dashboard/advanced-metrics ──
router.get('/advanced-metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { sessionType: 'focus', status: { $in: ['completed', 'manual'] } };
    
    let startD, endD;
    if (startDate && endDate) {
      startD = new Date(startDate);
      startD.setHours(0, 0, 0, 0);
      endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: startD, $lte: endD };
    }
    
    const sessions = await Task.find(filter);
    
    const discomfortFilter = {};
    if (startD && endD) {
      discomfortFilter.timestamp = { $gte: startD, $lte: endD };
    }
    const discomforts = await Discomfort.find(discomfortFilter);
    
    // Focus Efficiency Ratio
    const totalSeconds = sessions.reduce((s, t) => s + (t.duration || 0), 0);
    const hoursFocused = +(totalSeconds / 3600).toFixed(2);
    const totalFriction = discomforts.filter(d => d.actionTaken === 'took_break' || d.type === 'distraction' || d.actionTaken === 'gave_in' || d.actionTaken === 'switched_task').length;
    const focusEfficiency = totalFriction === 0 ? hoursFocused : +(hoursFocused / totalFriction).toFixed(2);
    
    // Session Density
    const sessionDensity = sessions.length;
    
    // Peak Productivity Time
    const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    sessions.forEach(s => {
      const hr = s.startTime.getHours();
      let bucket = 'Night';
      if (hr >= 5 && hr < 12) bucket = 'Morning';
      else if (hr >= 12 && hr < 17) bucket = 'Afternoon';
      else if (hr >= 17 && hr < 22) bucket = 'Evening';
      buckets[bucket] += (s.duration || 0);
    });
    
    const peakBucket = Object.keys(buckets).reduce((a, b) => buckets[a] > buckets[b] ? a : b);
    
    res.json({
      focusEfficiency,
      totalFriction,
      sessionDensity,
      peakProductivityZone: buckets[peakBucket] > 0 ? peakBucket : 'None',
      peakBucketHours: +(buckets[peakBucket] / 3600).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/dashboard/distraction-analytics ──
router.get('/distraction-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { sessionType: 'focus', status: { $in: ['completed', 'manual'] } };
    
    if (startDate && endDate) {
      const startD = new Date(startDate);
      startD.setHours(0, 0, 0, 0);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: startD, $lte: endD };
    }
    
    const sessions = await Task.find(filter);
    const sessionIds = sessions.map(s => s._id);

    const discomforts = await Discomfort.find({ taskId: { $in: sessionIds } }).populate('taskId');
    
    // Distractions Per Task
    const tasksMap = {};
    
    sessions.forEach(s => {
       if (!tasksMap[s.title]) tasksMap[s.title] = { title: s.title, distractions: 0, breaks: 0, time: 0 };
       tasksMap[s.title].time += (s.duration || 0);
    });

    discomforts.forEach(d => {
      if (!d.taskId) return;
      const title = d.taskId.title || 'Unknown';
      if (!tasksMap[title]) tasksMap[title] = { title, distractions: 0, breaks: 0, time: d.taskId.duration || 0 };
      
      if (d.actionTaken === 'took_break') {
        tasksMap[title].breaks++;
      } else if (d.type === 'distraction' || d.actionTaken === 'gave_in' || d.actionTaken === 'switched_task') {
        tasksMap[title].distractions++;
      }
    });

    // Timing Analysis (Morning/Afternoon/Evening/Night)
    const timing = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    discomforts.forEach(d => {
      const isDistraction = d.type === 'distraction' || d.actionTaken === 'gave_in' || d.actionTaken === 'switched_task';
      if (isDistraction) {
        const hr = d.timestamp.getHours();
        let bucket = 'Night';
        if (hr >= 5 && hr < 12) bucket = 'Morning';
        else if (hr >= 12 && hr < 17) bucket = 'Afternoon';
        else if (hr >= 17 && hr < 22) bucket = 'Evening';
        timing[bucket]++;
      }
    });
    
    const timingArray = Object.keys(timing).map(k => ({ name: k, count: timing[k] }));

    res.json({
      tasks: Object.values(tasksMap).sort((a,b) => b.distractions - a.distractions),
      timing: timingArray
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
