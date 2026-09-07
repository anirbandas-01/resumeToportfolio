const express = require('express');
const router = express.Router();
const { getPublicPortfolio, listPortfolios, toggleLike } = require('../controllers/portfolioController');
const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth');


router.get('/', optionalAuth, listPortfolios);
router.get('/:username', optionalAuth, getPublicPortfolio);
router.post('/:username/like', requireAuth, toggleLike);

module.exports = router;