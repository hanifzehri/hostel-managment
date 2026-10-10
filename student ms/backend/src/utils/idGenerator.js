const Student = require('../models/Student');
const Admission = require('../models/Admission');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Staff = require('../models/Staff');

const generateSequentialId = async (prefix, Model, fieldName = 'studentId') => {
  const currentYear = new Date().getFullYear();
  const searchPattern = new RegExp(`^${prefix}-${currentYear}-(\\d{4})$`);

  const latestRecord = await Model.findOne({
    [fieldName]: { $regex: searchPattern },
  }).sort({ [fieldName]: -1 });

  let nextSequence = 1;
  if (latestRecord && latestRecord[fieldName]) {
    const match = latestRecord[fieldName].match(searchPattern);
    if (match && match[1]) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}-${currentYear}-${paddedSequence}`;
};

const generateStudentId = () => generateSequentialId('STU', Student, 'studentId');

const generateAdmissionNumber = async () => {
  const currentYear = new Date().getFullYear();
  const searchPattern = new RegExp(`^HOST-${currentYear}-(\\d{4})$`);

  const [studentRec, admissionRec] = await Promise.all([
    Student.findOne({ admissionNumber: { $regex: searchPattern } }).sort({ admissionNumber: -1 }),
    Admission.findOne({ admissionNumber: { $regex: searchPattern } }).sort({ admissionNumber: -1 }),
  ]);

  let maxSeq = 0;
  if (studentRec && studentRec.admissionNumber) {
    const m = studentRec.admissionNumber.match(searchPattern);
    if (m && m[1]) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  if (admissionRec && admissionRec.admissionNumber) {
    const m = admissionRec.admissionNumber.match(searchPattern);
    if (m && m[1]) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }

  const nextSequence = maxSeq + 1;
  return `HOST-${currentYear}-${String(nextSequence).padStart(4, '0')}`;
};

const Expense = require('../models/Expense');
const Salary = require('../models/Salary');

const generateInvoiceNumber = () => generateSequentialId('INV', Fee, 'invoiceNumber');
const generateReceiptNumber = () => generateSequentialId('REC', Payment, 'receiptNumber');
const generateComplaintId = () => generateSequentialId('CMP', Complaint, 'complaintId');
const generateStaffId = () => generateSequentialId('STF', Staff, 'staffId');
const generateExpenseId = () => generateSequentialId('EXP', Expense, 'expenseId');
const generateSalaryId = () => generateSequentialId('SAL', Salary, 'salaryId');

module.exports = {
  generateStudentId,
  generateAdmissionNumber,
  generateInvoiceNumber,
  generateReceiptNumber,
  generateComplaintId,
  generateStaffId,
  generateExpenseId,
  generateSalaryId,
};
