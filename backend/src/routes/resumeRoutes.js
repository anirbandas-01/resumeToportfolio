const express = require('express');
const router = express.Router();
const  requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/uploadConfig');
const { uploadResume, parseResume, getResume, updateResume } = require('../controllers/resumeController');


router.post('/upload', requireAuth, upload.single('resume'), uploadResume);
router.post('/:id/parse', requireAuth, parseResume);
router.get('/:id', requireAuth, getResume);
router.put('/:id', requireAuth, updateResume);

module.exports = router;