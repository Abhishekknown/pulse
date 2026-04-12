const express = require('express');
const router = express.Router();
const Discomfort = require('../models/Discomfort');

// POST /api/discomforts — Log discomfort
router.post('/', async (req, res) => {
  try {
    const { taskId, type, intensity, trigger, actionTaken, note } = req.body;
    const discomfort = await Discomfort.create({
      taskId,
      type,
      intensity,
      trigger: trigger || 'unknown',
      actionTaken: actionTaken || 'ignored',
      note: note || '',
      timestamp: new Date()
    });

    res.status(201).json(discomfort);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/discomforts — Get all (with optional taskId/date filter)
router.get('/', async (req, res) => {
  try {
    const { taskId, date } = req.query;
    let filter = {};

    if (taskId) filter.taskId = taskId;
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.timestamp = { $gte: dayStart, $lte: dayEnd };
    }

    const discomforts = await Discomfort.find(filter)
      .populate('taskId')
      .sort({ timestamp: -1 });

    res.json(discomforts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/discomforts/:id — Delete log
router.delete('/:id', async (req, res) => {
  try {
    const discomfort = await Discomfort.findByIdAndDelete(req.params.id);
    if (!discomfort) return res.status(404).json({ message: 'Discomfort log not found' });
    res.json({ message: 'Discomfort log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
