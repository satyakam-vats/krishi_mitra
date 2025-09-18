const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { name, email, password, phone, farmDetails, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'A user with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      farmDetails,
      location,
    });

    await user.save();
    await user.updateLoginInfo();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration Failed',
      message: 'Unable to register user',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account Disabled',
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      });
    }

    await user.updateLoginInfo();
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: 'Unable to login',
    });
  }
});

// @route   GET /api/auth/validate
// @desc    Validate JWT token
// @access  Private
router.get('/validate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token is invalid or user is inactive',
      });
    }

    res.json({
      message: 'Token is valid',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      error: 'Validation Failed',
      message: 'Unable to validate token',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
  body('farmDetails.size').optional().isNumeric().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found',
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'phone', 'location', 'farmDetails', 'preferences'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(user, updates);
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: 'Unable to update profile',
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid Password',
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Password Change Failed',
      message: 'Unable to change password',
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found',
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({
      error: 'Deactivation Failed',
      message: 'Unable to deactivate account',
    });
  }
});

module.exports = router;
