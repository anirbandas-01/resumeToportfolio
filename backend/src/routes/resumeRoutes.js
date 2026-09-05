const express = require('express');
const router = express.Router();
const  requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/uploadConfig');
const uploadImage = require('../middleware/imageUploadConfig');
const { uploadResume, parseResume, getResume, getMyResume, updateResume, togglePublish, uploadProfileImage } = require('../controllers/resumeController');


router.post('/upload', requireAuth, upload.single('resume'), uploadResume);
router.get('/mine', requireAuth, getMyResume);
router.post('/:id/parse', requireAuth, parseResume);
router.get('/:id', requireAuth, getResume);
router.put('/:id', requireAuth, updateResume);
router.patch('/:id/publish', requireAuth, togglePublish); 
router.post('/:id/image', requireAuth, uploadImage.single('image'), uploadProfileImage);

module.exports = router;