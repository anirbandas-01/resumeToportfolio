const User = require('../models/Users');
const Resume = require('../models/Resume');

async function getPublicPortfolio(req, res){
    try {
        const user = await User.findOne({ username: req.params.username }).select('-passwordHash');

        if(!user){
            return res.status(404).json({ error: 'Portfolio not found' });
        }

        const resume = await Resume.findOne({ userId: user._id, isPublished: true }).sort({ updatedAt: -1 });

        if(!resume) {
            return res.status(404).json({ error: 'This portfolio is not published yet' });
        }

        // Count a view unless the owner is looking at their own portfolio.
        // Note: this is a simple counter, not deduped by visitor — repeat
        // visits from the same person each count separately.
        const isOwner = req.user && String(req.user.id) === String(user._id);
        if (!isOwner) {
            resume.viewCount += 1;
            await resume.save();
        }

        res.json({
            username: user.username,
            parsedData: resume.parsedData,
            profileImageUrl: resume.profileImageUrl,
            theme: resume.theme,
            viewCount: resume.viewCount,
            likeCount: resume.likedBy.length,
            isLikedByMe: req.user ? resume.likedBy.some((id) => String(id) === String(req.user.id)) : false,
            isOwner,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

// Public discovery feed: published portfolios, newest-liked first.
// Excludes the viewer's own portfolio if they're logged in.
async function listPortfolios(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 12;

        const filter = { isPublished: true };
        if (req.user) {
            filter.userId = { $ne: req.user.id };
        }

        const resumes = await Resume.find(filter)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'username');

        const portfolios = resumes
            .filter((r) => r.userId) // guard against orphaned resumes
            .map((r) => ({
                username: r.userId.username,
                name: r.parsedData?.name || r.userId.username,
                profileImageUrl: r.profileImageUrl,
                theme: r.theme,
                likeCount: r.likedBy.length,
                viewCount: r.viewCount,
                isLikedByMe: req.user
                    ? r.likedBy.some((id) => String(id) === String(req.user.id))
                    : false,
            }));

        res.json({ portfolios, page });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

// Toggle a like on someone else's published portfolio.
async function toggleLike(req, res) {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: 'Portfolio not found' });
        }

        if (String(user._id) === String(req.user.id)) {
            return res.status(400).json({ error: "You can't like your own portfolio" });
        }

        const resume = await Resume.findOne({ userId: user._id, isPublished: true });
        if (!resume) {
            return res.status(404).json({ error: 'This portfolio is not published' });
        }

        const alreadyLiked = resume.likedBy.some((id) => String(id) === String(req.user.id));
        if (alreadyLiked) {
            resume.likedBy = resume.likedBy.filter((id) => String(id) !== String(req.user.id));
        } else {
            resume.likedBy.push(req.user.id);
        }
        await resume.save();

        res.json({ liked: !alreadyLiked, likeCount: resume.likedBy.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

module.exports = { getPublicPortfolio, listPortfolios, toggleLike };