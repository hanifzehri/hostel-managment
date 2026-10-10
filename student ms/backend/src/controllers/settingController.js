const Setting = require('../models/Setting');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get system settings (creates default if missing)
// @route   GET /api/settings
// @access  Public (or Private)
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin, Super Admin)
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    Object.assign(settings, req.body);
    await settings.save();

    await logActivity({
      req,
      action: 'SETTINGS_UPDATED',
      module: 'Settings',
      recordId: settings._id,
      details: { hostelName: settings.hostelName },
    });

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
