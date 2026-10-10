const Staff = require('../models/Staff');
const { generateStaffId } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private
const getStaff = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role && role !== 'All') query.role = role;
    if (status && status !== 'All') query.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { staffId: searchRegex },
        { cnic: searchRegex },
        { phone: searchRegex },
        { designation: searchRegex },
        { job: searchRegex },
      ];
    }

    const staff = await Staff.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create staff member
// @route   POST /api/staff
// @access  Private (Admin, Super Admin)
const createStaff = async (req, res, next) => {
  try {
    const staffData = { ...req.body };
    if (!staffData.staffId) {
      staffData.staffId = await generateStaffId();
    }

    const existing = await Staff.findOne({
      $or: [{ staffId: staffData.staffId }, { cnic: staffData.cnic }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.staffId === staffData.staffId
          ? 'Staff ID already in use.'
          : 'CNIC already registered for another staff member.',
      });
    }

    const staffMember = await Staff.create(staffData);

    await logActivity({
      req,
      action: 'STAFF_CREATED',
      module: 'Staff',
      recordId: staffMember._id,
      details: {
        staffId: staffMember.staffId,
        name: staffMember.name,
        role: staffMember.role,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff member registered successfully.',
      data: staffMember,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin, Super Admin)
const updateStaff = async (req, res, next) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    Object.assign(staffMember, req.body);
    await staffMember.save();

    await logActivity({
      req,
      action: 'STAFF_UPDATED',
      module: 'Staff',
      recordId: staffMember._id,
      details: { name: staffMember.name },
    });

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully.',
      data: staffMember,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate staff member
// @route   DELETE /api/staff/:id
// @access  Private (Admin, Super Admin)
const deleteStaff = async (req, res, next) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    staffMember.status = 'Resigned';
    await staffMember.save();

    await logActivity({
      req,
      action: 'STAFF_DEACTIVATED',
      module: 'Staff',
      recordId: staffMember._id,
      details: { name: staffMember.name },
    });

    res.status(200).json({
      success: true,
      message: 'Staff member deactivated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
};
