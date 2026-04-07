const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/email');
const router = express.Router();

const createOtp = () => `${crypto.randomInt(100000, 999999)}`;
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// Register and send OTP
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingVerifiedUser = await User.findOne({
      $or: [{ username }, { email: normalizedEmail }],
      isVerified: true,
    });

    if (existingVerifiedUser) {
      return res.status(400).json({ message: 'Username or email is already registered.' });
    }

    let user = await User.findOne({
      $or: [{ username }, { email: normalizedEmail }],
    });

    const otp = createOtp();
    const otpCode = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (user) {
      user.username = username;
      user.email = normalizedEmail;
      user.password = password;
      user.role = role || 'user';
      user.isVerified = false;
      user.otpCode = otpCode;
      user.otpExpiresAt = otpExpiresAt;
      user.otpPurpose = 'register';
    } else {
      user = new User({
        username,
        email: normalizedEmail,
        password,
        role,
        isVerified: false,
        otpCode,
        otpExpiresAt,
        otpPurpose: 'register',
      });
    }

    await user.save();
    const otpResult = await sendOtpEmail({ to: normalizedEmail, otp, username });

    res.status(201).json({
      message: otpResult.message,
      delivery: otpResult.delivery,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpPurpose !== 'register') {
      return res.status(400).json({ message: 'This OTP is not valid for registration verification.' });
    }

    if (user.otpCode !== hashOtp(otp)) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpPurpose = null;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const otp = createOtp();
    user.otpCode = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = 'register';
    await user.save();

    const otpResult = await sendOtpEmail({ to: user.email, otp, username: user.username });

    res.json({
      message: otpResult.message,
      delivery: otpResult.delivery,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login-otp/request', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const otp = createOtp();
    user.otpCode = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = 'login';
    await user.save();

    const otpResult = await sendOtpEmail({ to: user.email, otp, username: user.username });

    res.json({
      message: otpResult.message,
      delivery: otpResult.delivery,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login-otp/verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpPurpose !== 'login') {
      return res.status(400).json({ message: 'This OTP is not valid for login.' });
    }

    if (user.otpCode !== hashOtp(otp)) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpPurpose = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role: user.role, id: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login with email and password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate a token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return the token, role, and user ID
    res.json({ token, role: user.role, id: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
