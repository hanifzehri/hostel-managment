const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs with search and filtering
// @route   GET /api/activity-logs
// @access  Private (Admin, Super Admin)
const getActivityLogs = async (req, res, next) => {
  try {
    const { module, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (module && module !== 'All') query.module = module;

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ action: searchRegex }, { userName: searchRegex }, { recordId: searchRegex }];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ActivityLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivityLogs };
