const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Default categories to seed
const defaultCategories = [
  { name: 'Work', color: '#6366f1', type: 'productive' },
  { name: 'Study', color: '#06b6d4', type: 'productive' },
  { name: 'Exercise', color: '#10b981', type: 'productive' },
  { name: 'Social Media', color: '#f43f5e', type: 'unproductive' },
  { name: 'Entertainment', color: '#f59e0b', type: 'unproductive' },
  { name: 'Break', color: '#8b5cf6', type: 'productive' },
  { name: 'Coding', color: '#0ea5e9', type: 'productive' },
  { name: 'Reading', color: '#14b8a6', type: 'productive' }
];

// Seed categories if none exist
const seedCategories = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(defaultCategories);
    console.log('📁 Default categories seeded');
  }
};

// GET /api/categories — Get all categories
router.get('/', async (req, res) => {
  try {
    await seedCategories();
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/categories — Create category
router.post('/', async (req, res) => {
  try {
    const { name, color, type } = req.body;
    const category = await Category.create({ name, color, type });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/categories/:id — Update category
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/categories/:id — Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
