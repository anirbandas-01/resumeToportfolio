require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();


//middleware
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: "Backend is running"
    });
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const resumeRoutes = require('./routes/resumeRoutes');
app.use('/api/resume', resumeRoutes);


/* const requireAuth = require('./middleware/requireAuth');
app.get('/api/protected-test', requireAuth, (req, res)=> {
    res.json({ message: `Hello user ${req.user.id}, you are authenticated` });
}); */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on PORT:${PORT}`);
});