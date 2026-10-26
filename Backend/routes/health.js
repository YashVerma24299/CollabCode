const express = require('express');
const router = express.Router();

/**
 * @route   GET /health
 * @desc    System uptime, memory usage, and operational status check
 * @access  Public
 */
router.get('/health', (req, res) => {
  const memory = process.memoryUsage();
  
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    system: {
      memoryUsedMB: (memory.heapUsed / 1024 / 1024).toFixed(2),
      memoryTotalMB: (memory.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (memory.rss / 1024 / 1024).toFixed(2)
    }
  };

  try {
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
