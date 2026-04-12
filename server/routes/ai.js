const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const Discomfort = require('../models/Discomfort');

// Simple in-memory cache
let insightsCache = {
  data: null,
  timestamp: null,
  expiresAt: null
};
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

router.get('/insights', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        message: 'AI integration unavailable. Please configure GEMINI_API_KEY in the backend.',
        error: true
      });
    }

    // Check cache first
    const now = Date.now();
    if (insightsCache.data && insightsCache.expiresAt > now) {
      return res.json({ insights: insightsCache.data, cached: true });
    }

    // Get 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const tasks = await Task.find({
      status: { $in: ['completed', 'manual'] },
      startTime: { $gte: sevenDaysAgo }
    }).populate('category');

    const discomforts = await Discomfort.find({
      timestamp: { $gte: sevenDaysAgo }
    }).populate('taskId');

    // Summarize
    let focusHours = 0;
    tasks.forEach(t => focusHours += (t.duration || 0));
    focusHours = (focusHours / 3600).toFixed(1);
    
    let breaks = 0;
    let distractions = 0;
    discomforts.forEach(d => {
      if (d.actionTaken === 'took_break') breaks++;
      else distractions++;
    });

    const contextData = `
User Abhishek's Last 7 Days Productivity Data:
- Total completed tasks: ${tasks.length}
- Total focus time: ${focusHours} hours
- Total breaks taken: ${breaks}
- Total distractions or given in urges: ${distractions}
- Recent task categories worked on: ${[...new Set(tasks.map(t => t.category?.name || 'Uncategorized'))].join(', ')}
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are Abhishek's highly analytical yet friendly personal productivity butler. Analyze the last 7 days of data.
Data:
${contextData}

Respond strictly with three distinct bullet points. Keep it highly concise and UI-friendly (max 2 sentences per point). 
Do NOT use Markdown headers like # or ##. 
Provide the response exactly in this list format with the emojis replacing any bullets:
🟢 Well Done: [Analyze what went good based on the data]
🔴 Friction: [Analyze what went wrong or identifies an issue based on the data]
💡 Next Step: [Provide an actionable tip to fix or improve based on the Friction]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Update cache
    insightsCache = {
      data: text,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };

    res.json({ insights: text });

  } catch (err) {
    console.error('Gemini API Error:', err);
    
    // If we hit a rate limit but have old data, return the old data with a note
    if ((err.status === 429 || err.message.includes('quota')) && insightsCache.data) {
      return res.json({ 
        insights: insightsCache.data, 
        note: 'Rate limit hit. Showing cached insights.',
        cached: true 
      });
    }

    // Instead of a 500 crash, return a 200 with a clear error flag and message
    // so the frontend can display it without crashing.
    res.json({ 
      error: true, 
      message: 'Gemini API limit reached. AI insights will return when quota resets.',
      details: err.message
    });
  }
});

module.exports = router;
