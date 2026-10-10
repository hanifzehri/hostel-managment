const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const { logActivity } = require('../utils/auditLogger');

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('studentRef');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();

    await logActivity({
      req,
      user,
      action: 'USER_LOGIN',
      module: 'Auth',
      recordId: user._id,
      details: { email: user.email, role: user.role },
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        student: user.studentRef || null,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('studentRef');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        student: user.studentRef || null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    await logActivity({
      req,
      user,
      action: 'PROFILE_UPDATED',
      module: 'Auth',
      recordId: user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      req,
      user,
      action: 'PASSWORD_CHANGED',
      module: 'Auth',
      recordId: user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request password recovery with expiring single-use token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address.',
      });
    }

    // Get reset token (expiring in 1 hour, single use)
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await logActivity({
      req,
      action: 'PASSWORD_RESET_REQUESTED',
      module: 'Auth',
      recordId: user._id,
      details: { email: user.email },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully. Valid for 1 hour.',
      resetToken, // Provided directly for seamless verification and testing
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using single-use expiring token
// @route   POST /api/auth/reset-password/:token or POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const rawToken = req.params.token || req.body.token;
    const { password } = req.body;

    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Hash token to compare with database
    const resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    // Set new password and clear single-use token
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await logActivity({
      req,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'Auth',
      recordId: user._id,
      details: { email: user.email },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You may now log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user / destroy session
// @route   POST /api/auth/logout
// @access  Public / Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully. Session terminated.',
  });
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
