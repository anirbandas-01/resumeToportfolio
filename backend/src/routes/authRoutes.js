const express = require('express');
const router = express.Router();
const { signup, login, getMe, setUsername } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/signup', signup);
router.get('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/username', requireAuth, setUsername);

module.exports = router;