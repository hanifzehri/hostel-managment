const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ req, user, action, module, recordId = '', details = {} }) => {
  try {
    const actor = user || (req && req.user);
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
      : '';

    await ActivityLog.create({
      user: actor ? actor._id : null,
      userName: actor ? actor.name : 'System / Guest',
      userRole: actor ? actor.role : 'System',
      action,
      module,
      recordId: String(recordId),
      details,
      ipAddress: String(ipAddress),
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error.message);
  }
};

module.exports = { logActivity };
