const Admission = require('../models/Admission');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Fee = require('../models/Fee');
const { generateAdmissionNumber, generateInvoiceNumber } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get all admission records
// @route   GET /api/admissions
// @access  Private
const getAdmissions = async (req, res, next) => {
  try {
    const admissions = await Admission.find()
      .populate('student', 'studentId fullName phone email profilePhoto cnic')
      .populate('room', 'roomNumber block floor roomType')
      .populate('bed', 'bedNumber')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      data: admissions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process formal admission
// @route   POST /api/admissions
// @access  Private (Admin, Super Admin, Receptionist)
const createAdmission = async (req, res, next) => {
  try {
    const {
      studentId,
      bedId,
      monthlyFee = 15000,
      securityDeposit = 10000,
      admissionDate = new Date(),
      notes = '',
      createInitialInvoice = true,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const bed = await Bed.findById(bedId).populate('room');
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} is already occupied!`,
      });
    }

    const admissionNumber = await generateAdmissionNumber();

    const admission = await Admission.create({
      admissionNumber,
      student: student._id,
      room: bed.room._id,
      bed: bed._id,
      admissionDate,
      monthlyFee,
      securityDeposit,
      status: 'Active',
      notes,
      createdBy: req.user._id,
    });

    // Update bed
    bed.status = 'Occupied';
    bed.currentStudent = student._id;
    await bed.save();

    // Update student
    student.admissionNumber = admissionNumber;
    student.admissionDate = admissionDate;
    student.room = bed.room._id;
    student.bed = bed._id;
    student.block = bed.room.block;
    student.floor = bed.room.floor;
    student.studentStatus = 'Active';
    await student.save();

    // Recalculate room occupancy
    const room = await Room.findById(bed.room._id);
    if (room) {
      const occupiedBeds = await Bed.countDocuments({ room: room._id, status: 'Occupied' });
      room.currentOccupants = occupiedBeds;
      room.availableBeds = Math.max(0, room.capacity - occupiedBeds);
      room.status = room.availableBeds === 0 ? 'Full' : 'Available';
      await room.save();
    }

    // Optionally create first initial monthly invoice
    if (createInitialInvoice) {
      const currentMonth = new Date().toLocaleString('default', { month: 'short' });
      const currentYear = new Date().getFullYear();
      const invoiceNumber = await generateInvoiceNumber();

      const totalFee = Number(monthlyFee) + Number(securityDeposit);

      await Fee.create({
        invoiceNumber,
        student: student._id,
        month: currentMonth,
        year: currentYear,
        feeType: 'Hostel Fee',
        amount: Number(monthlyFee),
        discount: 0,
        fine: 0,
        total: totalFee,
        paidAmount: 0,
        remainingAmount: totalFee,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'Pending',
        notes: `Initial Admission Fee (Hostel: ${monthlyFee} + Security: ${securityDeposit})`,
        createdBy: req.user._id,
      });
    }

    await logActivity({
      req,
      action: 'ADMISSION_PROCESSED',
      module: 'Admission',
      recordId: admission._id,
      details: {
        admissionNumber,
        studentName: student.fullName,
        studentId: student.studentId,
        roomNumber: bed.room.roomNumber,
        bedNumber: bed.bedNumber,
      },
    });

    res.status(201).json({
      success: true,
      message: `Admission ${admissionNumber} successfully processed for ${student.fullName}.`,
      data: admission,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdmissions,
  createAdmission,
};
