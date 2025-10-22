const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Seminario de Sistemas 1 - Proyecto Final' });
});

module.exports = router;