const express = require('express');
const path = require('path');
const metricsService = require('../services/metricsService');

const router = express.Router();

// API endpoint to get dashboard metrics
router.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await metricsService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Serve static files from the dashboard directory
router.use(express.static(path.join(__dirname, '../../public/dashboard')));

// Serve the dashboard HTML page for any unmatched routes
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

module.exports = router; 