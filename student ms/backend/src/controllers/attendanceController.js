const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get attendance for a specific date (defaults to today)
// @route   GET /api/attendance
// @access  Private
const getDailyAttendance = async (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0], block, floor } = req.query;

    const studentQuery = { studentStatus: 'Active' };
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      studentQuery._id = req.user.studentRef;
    }
    if (block && block !== 'All') studentQuery.block = block;
    if (floor && floor !== 'All') studentQuery.floor = Number(floor);

    const activeStudents = await Student.find(studentQuery)
      .populate('room', 'roomNumber block floor')
      .populate('bed', 'bedNumber')
      .sort({ 'room.roomNumber': 1, fullName: 1 });

    const attendanceRecords = await Attendance.find({ date });
    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      attendanceMap[String(record.student)] = record;
    });

    const studentListWithAttendance = activeStudents.map((s) => {
      const record = attendanceMap[String(s._id)];
      return {
        student: s,
        attendanceStatus: record ? record.status : 'Not Marked',
        remarks: record ? record.remarks : '',
        recordId: record ? record._id : null,
      };
    });

    const stats = {
      totalStudents: activeStudents.length,
      present: attendanceRecords.filter((a) => a.status === 'Present').length,
      absent: attendanceRecords.filter((a) => a.status === 'Absent').length,
      late: attendanceRecords.filter((a) => a.status === 'Late').length,
      leave: attendanceRecords.filter((a) => a.status === 'Leave').length,
      unmarked: Math.max(0, activeStudents.length - attendanceRecords.length),
    };

    res.status(200).json({
      success: true,
      date,
      stats,
      data: studentListWithAttendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark attendance for single student
// @route   POST /api/attendance/mark
// @access  Private (Admin, Super Admin, Warden)
const markAttendance = async (req, res, next) => {
  try {
    const { studentId, date = new Date().toISOString().split('T')[0], status, remarks = '' } = req.body;

    if (!studentId || !status) {
      return res.status(400).json({ success: false, message: 'Student ID and status are required.' });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, date },
      {
        student: studentId,
        date,
        status,
        remarks,
        markedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk mark attendance for multiple students
// @route   POST /api/attendance/bulk-mark
// @access  Private (Admin, Super Admin, Warden)
const markBulkAttendance = async (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0], records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Records array is required.' });
    }

    const bulkOps = records.map((item) => ({
      updateOne: {
        filter: { student: item.studentId, date },
        update: {
          $set: {
            student: item.studentId,
            date,
            status: item.status,
            remarks: item.remarks || '',
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    await logActivity({
      req,
      action: 'BULK_ATTENDANCE_MARKED',
      module: 'Attendance',
      details: { date, count: records.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${records.length} students on ${date}.`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance matrix for a month
// @route   GET /api/attendance/monthly-matrix
// @access  Private
const getMonthlyMatrix = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    const paddedMonth = String(month).padStart(2, '0');
    const datePrefix = `${year}-${paddedMonth}`;

    const studentQuery = { studentStatus: 'Active' };
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      studentQuery._id = req.user.studentRef;
    }

    const activeStudents = await Student.find(studentQuery)
      .select('studentId fullName block room')
      .populate('room', 'roomNumber');

    const monthlyRecords = await Attendance.find({
      date: { $regex: `^${datePrefix}` },
    });

    res.status(200).json({
      success: true,
      year: Number(year),
      month: Number(month),
      totalStudents: activeStudents.length,
      records: monthlyRecords,
      students: activeStudents,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyAttendance,
  markAttendance,
  markBulkAttendance,
  getMonthlyMatrix,
};
