const express = require('express');
const router = express.Router();
const { getPublicPortfolio } = require('../controllers/portfolioController');

router.get('/:username', getPublicPortfolio);

module.exports = router;