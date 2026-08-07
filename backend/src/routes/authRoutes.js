const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/signup', signup);
router.get('/login', login);
router.get('/me', requireAuth, getMe);

module.exports = router;