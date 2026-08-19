const multer = require('multer');

const storage = multer.memoryStorage();

function imageFileFilter(req, file, cb){
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if(allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
         cb(new Error('Only JPEG, PNG, or WEBP images are allowed'), false);
    }
}

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — plenty for a profile photo
});

module.exports = uploadImage;