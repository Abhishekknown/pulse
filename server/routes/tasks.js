const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const DayLog = require('../models/DayLog');

// Helper: update DayLog
async function updateDayLog(date, focusDuration) {
  const dateStr = date.toISOString().split('T')[0];
  await DayLog.findOneAndUpdate(
    { date: dateStr },
    { $inc: { focusTime: focusDuration, sessionCount: 1 } },
    { upsert: true, new: true }
  );
}

// POST /api/tasks/start — Start a new session
router.post('/start', async (req, res) => {
  try {
    const runningTask = await Task.findOne({ status: 'running' });
    if (runningTask) {
      return res.status(400).json({
        message: 'A session is already running. Stop it first.',
        activeTask: runningTask
      });
    }

    const { title, category, sessionType, pomodoroCount } = req.body;
    const task = await Task.create({
      title,
      category,
      startTime: new Date(),
      sessionType: sessionType || 'focus',
      pomodoroCount: pomodoroCount || 1,
      status: 'running'
    });

    const populated = await task.populate('category');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/tasks/:id/stop — Stop session
router.put('/:id/stop', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'running') {
      return res.status(400).json({ message: 'Task is not running' });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - task.startTime) / 1000);

    task.endTime = endTime;
    task.duration = duration;
    task.status = 'completed';
    task.comment = req.body.comment || '';
    task.note = req.body.note || '';

    await task.save();

    // Update DayLog for focus sessions
    if (task.sessionType === 'focus') {
      await updateDayLog(task.startTime, duration);
    }

    const populated = await task.populate('category');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/tasks/active — Get currently running session
router.get('/active', async (req, res) => {
  try {
    const task = await Task.findOne({ status: 'running' })
      .populate('category')
      .populate('discomfortLogs');
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/tasks — Get all tasks (with optional date/range filter)
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, sessionType, limit } = req.query;
    let filter = {};

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: start, $lte: end };
    }

    if (sessionType) filter.sessionType = sessionType;

    let query = Task.find(filter)
      .populate('category')
      .populate('discomfortLogs')
      .sort({ startTime: -1 });

    if (limit) query = query.limit(parseInt(limit));

    const tasks = await query;
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tasks/manual — Manual entry
router.post('/manual', async (req, res) => {
  try {
    const { title, category, startTime, endTime, sessionType, comment } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / 1000);

    if (duration <= 0) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const task = await Task.create({
      title,
      category,
      startTime: start,
      endTime: end,
      duration,
      sessionType: sessionType || 'focus',
      comment: comment || '',
      status: 'manual'
    });

    // Update DayLog for focus sessions
    if ((sessionType || 'focus') === 'focus') {
      await updateDayLog(start, duration);
    }

    const populated = await task.populate('category');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/tasks/:id — Edit task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, category, startTime, endTime, sessionType, comment, note } = req.body;
    if (title) task.title = title;
    if (category) task.category = category;
    if (sessionType) task.sessionType = sessionType;
    if (comment !== undefined) task.comment = comment;
    if (note !== undefined) task.note = note;

    if (startTime) task.startTime = new Date(startTime);
    if (endTime) {
      task.endTime = new Date(endTime);
      task.duration = Math.round((task.endTime - task.startTime) / 1000);
    }

    await task.save();
    const populated = await task.populate('category');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/tasks/:id — Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const Discomfort = require('../models/Discomfort');
    await Discomfort.deleteMany({ taskId: req.params.id });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
