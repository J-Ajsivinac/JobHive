const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ 
        message: 'HireVision API - AWS Cloud Innovation',
        version: '1.0.0',
        project: 'Seminario de Sistemas 1 - Proyecto Final',
        status: 'running',
        endpoints: {
            users: '/users',
            jobs: '/jobs'
        }
    });
});

router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;