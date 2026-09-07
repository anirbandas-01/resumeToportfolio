const express = require('express');
const router = express.Router();
const { signup, login, getMe, setUsername, changePassword } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/username', requireAuth, setUsername);
router.put('/password', requireAuth, changePassword);

module.exports = router;