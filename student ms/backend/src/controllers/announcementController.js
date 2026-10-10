const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Admin, Super Admin, Warden)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, audience = 'All', priority = 'Normal' } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      audience,
      priority,
      status: 'Active',
      createdBy: req.user._id,
    });

    // Also dispatch a system notification
    await Notification.create({
      title: `Notice: ${title}`,
      message,
      type: 'system',
      link: '/announcements',
    });

    await logActivity({
      req,
      action: 'ANNOUNCEMENT_POSTED',
      module: 'Announcement',
      recordId: announcement._id,
      details: { title, priority, audience },
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin, Super Admin)
const deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
