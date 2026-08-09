const User = require('../models/Users');
const Resume = require('../models/Resume');

async function getPublicPortfolio(req, res){
    try {
        const user = await User.findOne({ username: req.params.username }).select('-passwordHash');

        if(!user){
            return res.status(404).json({ error: 'Portfolio not found' });
        }

        const resume = await Resume.findOne({ userId: user._id, isPublished: true });

        if(!resume) {
            return res.status(404).json({ error: 'This portfolio is not published yet' });
        }

        res.json({
            username: user.username,
            parsedData: resume.parsedData,
            theme: resume.theme,
        });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong' });
    }
}



module.exports = { getPublicPortfolio };