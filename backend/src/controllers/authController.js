const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');



function generateToken(userId){
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
}

async function signup(req, res){
    try {
        const { username, email, password } = req.body;

        if(!username || !email || !password){
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({ username, email, passwordHash });

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong during signup' });
    }
}




async function login(req, res){
    try {
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong during login'});
    }
}


async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong' });
    }
}

async function setUsername(req, res){
   
  try {
    const { username } = req.body;
    
    if(!username || !/^[a-z0-9-]{3,30}$/.test(username)) {
        return res.status(400).json({
            error: 'Username must be 3-30 characters: lowercase letters, numbers, hyphens only',
        });
    }

    const taken = await User.findOne({ username, _id: { $ne: req.user.id }});
    if(taken) {
        return res.status(409).json({ error: 'That username is already taken' });
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { username },
        { new: true }
    ).select('-passwordHash');

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}


module.exports = { signup, login, getMe, setUsername, changePassword };