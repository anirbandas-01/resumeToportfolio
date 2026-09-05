require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');

cloudinary.api.ping()
  .then(res => console.log('SUCCESS:', res))
  .catch(err => console.log('FAILED:', err));