const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Student = require('../models/Student');
const Admission = require('../models/Admission');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Visitor = require('../models/Visitor');
const Complaint = require('../models/Complaint');
const Staff = require('../models/Staff');
const Salary = require('../models/Salary');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');
const Setting = require('../models/Setting');
const { connectDB, disconnectDB } = require('../config/db');

const seedDataInternal = async () => {
  console.log('[SEED] Clearing existing records for Royal Hostel Khuzdar...');
  await Promise.all([
    User.deleteMany(),
    Room.deleteMany(),
    Bed.deleteMany(),
    Student.deleteMany(),
    Admission.deleteMany(),
    Fee.deleteMany(),
    Payment.deleteMany(),
    Attendance.deleteMany(),
    LeaveRequest.deleteMany(),
    Visitor.deleteMany(),
    Complaint.deleteMany(),
    Staff.deleteMany(),
    Salary.deleteMany(),
    Expense.deleteMany(),
    Inventory.deleteMany(),
    Announcement.deleteMany(),
    ActivityLog.deleteMany(),
    Setting.deleteMany(),
  ]);

  console.log('[SEED] Seeding Admin and Staff Users...');
  const users = await User.create([
    {
      name: 'Hostel Administrator',
      email: 'admin@hostel.com',
      password: 'admin123',
      role: 'admin',
      phone: '+92 333 7891234',
    },
    {
      name: 'Super Admin Hanif',
      email: 'superadmin@hostel.com',
      password: 'admin123',
      role: 'superadmin',
      phone: '+92 300 9876541',
    },
    {
      name: 'Muhammad Asghar (Hostel Warden)',
      email: 'warden@hostel.com',
      password: 'admin123',
      role: 'warden',
      phone: '+92 345 1122334',
    },
    {
      name: 'Abdul Qadir (Accountant)',
      email: 'accountant@hostel.com',
      password: 'admin123',
      role: 'accountant',
      phone: '+92 334 5566778',
    },
    {
      name: 'Bilal Zehri (Receptionist)',
      email: 'receptionist@hostel.com',
      password: 'admin123',
      role: 'receptionist',
      phone: '+92 312 9988776',
    },
    {
      name: 'Mir Jan Baloch (Security)',
      email: 'security@hostel.com',
      password: 'admin123',
      role: 'security',
      phone: '+92 301 7766554',
    },
  ]);

  const superAdmin = users[1];
  const admin = users[0];
  const warden = users[2];
  const accountant = users[3];

  console.log('[SEED] Seeding Official Hostel Settings for Royal Hostel Khuzdar...');
  await Setting.create({
    hostelName: 'Royal Hostel Khuzdar',
    hostelTagline: 'Premier Student Residence & Academic Living',
    logoUrl: '',
    address: 'College Road, Khuzdar, Balochistan, Pakistan',
    phone: '+92 848 412345',
    emergencyPhone: '+92 333 7891234',
    email: 'admin@royalhostelkhuzdar.com',
    currency: 'PKR',
    academicYear: '2026-2027',
    rulesAndRegulations:
      '1. Hostel gate closes strictly at 10:00 PM.\n2. Digital resident ID card is mandatory for entry.\n3. Visitors are permitted in the reception lobby only.\n4. Smoking, drugs, and unauthorized appliances are strictly prohibited.\n5. Keep rooms clean and respect quiet hours after 10:30 PM.',
    idCardValidityMonths: 12,
    defaultMonthlyFee: 10000,
  });

  console.log('[SEED] Seeding 10 Hostel Rooms across Blocks...');
  const roomConfigs = [
    { roomNumber: '101', block: 'Block A', floor: 1, roomType: 'Single', capacity: 1, monthlyFee: 10000 },
    { roomNumber: '102', block: 'Block A', floor: 1, roomType: 'Double', capacity: 2, monthlyFee: 10000 },
    { roomNumber: '103', block: 'Block A', floor: 1, roomType: 'Double', capacity: 2, monthlyFee: 10000 },
    { roomNumber: '104', block: 'Block A', floor: 1, roomType: 'Triple', capacity: 3, monthlyFee: 10000 },
    { roomNumber: '201', block: 'Block B', floor: 2, roomType: 'Double', capacity: 2, monthlyFee: 10000 },
    { roomNumber: '202', block: 'Block B', floor: 2, roomType: 'Triple', capacity: 3, monthlyFee: 10000 },
    { roomNumber: '203', block: 'Block B', floor: 2, roomType: 'Four Bed', capacity: 4, monthlyFee: 10000 },
    { roomNumber: '301', block: 'Block C', floor: 3, roomType: 'Double', capacity: 2, monthlyFee: 10000 },
    { roomNumber: '302', block: 'Block C', floor: 3, roomType: 'Four Bed', capacity: 4, monthlyFee: 10000 },
    { roomNumber: '303', block: 'Block C', floor: 3, roomType: 'Triple', capacity: 3, monthlyFee: 10000 },
  ];

  const createdRooms = [];
  const createdBeds = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (const conf of roomConfigs) {
    const room = await Room.create({
      ...conf,
      currentOccupants: 0,
      availableBeds: conf.capacity,
      status: 'Available',
      amenities: ['Attached Bath', 'Study Desk', 'Built-in Cupboard', 'High-Speed Wi-Fi', 'Ceiling Fan'],
    });
    createdRooms.push(room);

    for (let i = 0; i < conf.capacity; i++) {
      const bed = await Bed.create({
        bedNumber: `Bed ${alphabet[i]}`,
        room: room._id,
        status: 'Available',
        currentStudent: null,
        monthlyRent: conf.monthlyFee,
      });
      createdBeds.push(bed);
    }
  }

  console.log('[SEED] Seeding 20 Realistic Demo Students in Khuzdar...');
  const studentDataList = [
    {
      fullName: 'Hamza Tariq Baloch',
      fatherName: 'Tariq Mehmood Baloch',
      cnic: '52202-1234567-1',
      dob: new Date('2003-05-14'),
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+92 333 7890101',
      email: 'hamza.baloch@buetk.edu.pk',
      address: 'Near Jhalawan Complex, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Civil Engineering',
      department: 'Civil Engineering',
      semester: '6th Semester',
      rollNumber: '21-CE-04',
      emergencyContactName: 'Tariq Mehmood Baloch',
      relationship: 'Father',
      emergencyPhone: '+92 333 4455661',
      profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Shoaib Ahmed Mengal',
      fatherName: 'Nadir Khan Mengal',
      cnic: '52202-2345678-3',
      dob: new Date('2004-02-18'),
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+92 334 7890102',
      email: 'shoaib.mengal@buetk.edu.pk',
      address: 'Wadh Road, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Mechanical Engineering',
      department: 'Mechanical Engineering',
      semester: '4th Semester',
      rollNumber: '22-ME-18',
      emergencyContactName: 'Nadir Khan Mengal',
      relationship: 'Father',
      emergencyPhone: '+92 334 4455662',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Zubair Ali Zehri',
      fatherName: 'Ali Muhammad Zehri',
      cnic: '52202-3456789-5',
      dob: new Date('2002-11-20'),
      gender: 'Male',
      bloodGroup: 'A+',
      phone: '+92 335 7890103',
      email: 'zubair.zehri@buetk.edu.pk',
      address: 'Zehri Town, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Computer Science',
      department: 'Computer Systems',
      semester: '8th Semester',
      rollNumber: '20-CS-32',
      emergencyContactName: 'Ali Muhammad Zehri',
      relationship: 'Father',
      emergencyPhone: '+92 335 4455663',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Farhan Bizenjo',
      fatherName: 'Ghulam Rasool Bizenjo',
      cnic: '52202-4567890-7',
      dob: new Date('2003-08-09'),
      gender: 'Male',
      bloodGroup: 'AB+',
      phone: '+92 336 7890104',
      email: 'farhan.bizenjo@gmail.com',
      address: 'Main Bazar, Nal, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Govt Degree College Khuzdar',
      collegeContact: '+92 848 412211',
      degree: 'BS Economics',
      department: 'Social Sciences',
      semester: '5th Semester',
      rollNumber: 'GDC-ECO-22',
      emergencyContactName: 'Ghulam Rasool Bizenjo',
      relationship: 'Father',
      emergencyPhone: '+92 336 4455664',
      profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Kamran Sasoli',
      fatherName: 'Muhammad Hashim Sasoli',
      cnic: '52202-5678901-9',
      dob: new Date('2004-06-25'),
      gender: 'Male',
      bloodGroup: 'O-',
      phone: '+92 331 7890105',
      email: 'kamran.sasoli@buetk.edu.pk',
      address: 'Sasol Road, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Electrical Engineering',
      department: 'Electrical Engineering',
      semester: '3rd Semester',
      rollNumber: '23-EE-15',
      emergencyContactName: 'Muhammad Hashim Sasoli',
      relationship: 'Father',
      emergencyPhone: '+92 331 4455665',
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Bilal Khan Umrani',
      fatherName: 'Sardar Khan Umrani',
      cnic: '52202-6789012-1',
      dob: new Date('2003-09-12'),
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+92 332 7890106',
      email: 'bilal.umrani@gmail.com',
      address: 'Umrani Mohallah, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Lasbela University (UoB Khuzdar)',
      collegeContact: '+92 848 412555',
      degree: 'BS English Literature',
      department: 'Humanities',
      semester: '4th Semester',
      rollNumber: 'LUA-ENG-44',
      emergencyContactName: 'Sardar Khan Umrani',
      relationship: 'Father',
      emergencyPhone: '+92 332 4455666',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Waleed Gichki',
      fatherName: 'Aslam Gichki',
      cnic: '52202-7890123-3',
      dob: new Date('2002-12-05'),
      gender: 'Male',
      bloodGroup: 'A-',
      phone: '+92 333 7890107',
      email: 'waleed.gichki@buetk.edu.pk',
      address: 'Airport Road, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Electronic Engineering',
      department: 'Electronics',
      semester: '7th Semester',
      rollNumber: '21-EL-09',
      emergencyContactName: 'Aslam Gichki',
      relationship: 'Father',
      emergencyPhone: '+92 333 4455667',
      profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Naveed Jamali',
      fatherName: 'Jan Muhammad Jamali',
      cnic: '52202-8901234-5',
      dob: new Date('2003-03-22'),
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+92 334 7890108',
      email: 'naveed.jamali@gmail.com',
      address: 'Sultan Ibrahim Road, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Govt Degree College Khuzdar',
      collegeContact: '+92 848 412211',
      degree: 'BS Mathematics',
      department: 'Basic Sciences',
      semester: '5th Semester',
      rollNumber: 'GDC-MATH-11',
      emergencyContactName: 'Jan Muhammad Jamali',
      relationship: 'Father',
      emergencyPhone: '+92 334 4455668',
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Arsalan Rind',
      fatherName: 'Nawab Khan Rind',
      cnic: '52202-9012345-7',
      dob: new Date('2004-07-19'),
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+92 335 7890109',
      email: 'arsalan.rind@buetk.edu.pk',
      address: 'Rind Colony, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Civil Engineering',
      department: 'Civil Engineering',
      semester: '2nd Semester',
      rollNumber: '24-CE-28',
      emergencyContactName: 'Nawab Khan Rind',
      relationship: 'Father',
      emergencyPhone: '+92 335 4455669',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Danish Marri',
      fatherName: 'Sher Muhammad Marri',
      cnic: '52202-0123456-9',
      dob: new Date('2003-10-10'),
      gender: 'Male',
      bloodGroup: 'A+',
      phone: '+92 336 7890110',
      email: 'danish.marri@buetk.edu.pk',
      address: 'Chakar Road, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Computer Science',
      department: 'Computing',
      semester: '6th Semester',
      rollNumber: '21-CS-51',
      emergencyContactName: 'Sher Muhammad Marri',
      relationship: 'Father',
      emergencyPhone: '+92 336 4455670',
      profilePhoto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Junaid Raisani',
      fatherName: 'Akhtar Raisani',
      cnic: '52202-1122334-1',
      dob: new Date('2002-04-15'),
      gender: 'Male',
      bloodGroup: 'AB-',
      phone: '+92 331 7890111',
      email: 'junaid.raisani@buetk.edu.pk',
      address: 'Raisani Street, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Mining Engineering',
      department: 'Mining',
      semester: '8th Semester',
      rollNumber: '20-MN-07',
      emergencyContactName: 'Akhtar Raisani',
      relationship: 'Father',
      emergencyPhone: '+92 331 4455671',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Taimoor Bugti',
      fatherName: 'Mir Hazar Bugti',
      cnic: '52202-2233445-3',
      dob: new Date('2004-01-30'),
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+92 332 7890112',
      email: 'taimoor.bugti@gmail.com',
      address: 'Jhalawan Medical Complex Road',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Govt Degree College Khuzdar',
      collegeContact: '+92 848 412211',
      degree: 'BS Political Science',
      department: 'Social Sciences',
      semester: '3rd Semester',
      rollNumber: 'GDC-POL-19',
      emergencyContactName: 'Mir Hazar Bugti',
      relationship: 'Father',
      emergencyPhone: '+92 332 4455672',
      profilePhoto: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Adnan Shahwani',
      fatherName: 'Noor Muhammad Shahwani',
      cnic: '52202-3344556-5',
      dob: new Date('2003-11-18'),
      gender: 'Male',
      bloodGroup: 'B-',
      phone: '+92 333 7890113',
      email: 'adnan.shahwani@buetk.edu.pk',
      address: 'Shahwani Mohallah, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Electrical Engineering',
      department: 'Electrical Engineering',
      semester: '5th Semester',
      rollNumber: '22-EE-31',
      emergencyContactName: 'Noor Muhammad Shahwani',
      relationship: 'Father',
      emergencyPhone: '+92 333 4455673',
      profilePhoto: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Saqib Lehri',
      fatherName: 'Abdul Samad Lehri',
      cnic: '52202-4455667-7',
      dob: new Date('2004-05-08'),
      gender: 'Male',
      bloodGroup: 'A+',
      phone: '+92 334 7890114',
      email: 'saqib.lehri@gmail.com',
      address: 'Bolan Medical Road, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Jhalawan Medical College Khuzdar',
      collegeContact: '+92 848 412890',
      degree: 'MBBS (2nd Year)',
      department: 'Medicine',
      semester: '2nd Year',
      rollNumber: 'JMC-MBBS-65',
      emergencyContactName: 'Abdul Samad Lehri',
      relationship: 'Father',
      emergencyPhone: '+92 334 4455674',
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Paid',
    },
    {
      fullName: 'Irfan Bangulzai',
      fatherName: 'Karim Bakhsh Bangulzai',
      cnic: '52202-5566778-9',
      dob: new Date('2003-07-27'),
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+92 335 7890115',
      email: 'irfan.bangulzai@buetk.edu.pk',
      address: 'Civil Lines, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Mechanical Engineering',
      department: 'Mechanical Engineering',
      semester: '4th Semester',
      rollNumber: '22-ME-40',
      emergencyContactName: 'Karim Bakhsh Bangulzai',
      relationship: 'Father',
      emergencyPhone: '+92 335 4455675',
      profilePhoto: 'https://images.unsplash.com/photo-1520409364224-63400dfe26e5?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Partial',
    },
    {
      fullName: 'Shahzaib Kurd',
      fatherName: 'Faqeer Muhammad Kurd',
      cnic: '52202-6677889-1',
      dob: new Date('2002-10-14'),
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+92 336 7890116',
      email: 'shahzaib.kurd@gmail.com',
      address: 'Kurd Street, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Govt Degree College Khuzdar',
      collegeContact: '+92 848 412211',
      degree: 'BS Chemistry',
      department: 'Natural Sciences',
      semester: '6th Semester',
      rollNumber: 'GDC-CHM-05',
      emergencyContactName: 'Faqeer Muhammad Kurd',
      relationship: 'Father',
      emergencyPhone: '+92 336 4455676',
      profilePhoto: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Partial',
    },
    {
      fullName: 'Yasir Alizai',
      fatherName: 'Ghulam Qadir Alizai',
      cnic: '52202-7788990-3',
      dob: new Date('2004-03-01'),
      gender: 'Male',
      bloodGroup: 'A+',
      phone: '+92 331 7890117',
      email: 'yasir.alizai@buetk.edu.pk',
      address: 'Cantt Area, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Computer Science',
      department: 'Computing',
      semester: '2nd Semester',
      rollNumber: '24-CS-12',
      emergencyContactName: 'Ghulam Qadir Alizai',
      relationship: 'Father',
      emergencyPhone: '+92 331 4455677',
      profilePhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Partial',
    },
    {
      fullName: 'Muzammil Tareen',
      fatherName: 'Abdul Rehman Tareen',
      cnic: '52202-8899001-5',
      dob: new Date('2003-06-16'),
      gender: 'Male',
      bloodGroup: 'AB+',
      phone: '+92 332 7890118',
      email: 'muzammil.tareen@gmail.com',
      address: 'Model Town, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Lasbela University (UoB Khuzdar)',
      collegeContact: '+92 848 412555',
      degree: 'BBA (Hons)',
      department: 'Management Sciences',
      semester: '4th Semester',
      rollNumber: 'LUA-BBA-30',
      emergencyContactName: 'Abdul Rehman Tareen',
      relationship: 'Father',
      emergencyPhone: '+92 332 4455678',
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Unpaid',
    },
    {
      fullName: 'Shahmeer Ghalib',
      fatherName: 'Ghalib Hussain Baloch',
      cnic: '52202-9900112-7',
      dob: new Date('2004-09-05'),
      gender: 'Male',
      bloodGroup: 'O-',
      phone: '+92 333 7890119',
      email: 'shahmeer.ghalib@buetk.edu.pk',
      address: 'Old Bazar, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'BUET Khuzdar',
      collegeContact: '+92 848 550123',
      degree: 'BS Civil Engineering',
      department: 'Civil Engineering',
      semester: '1st Semester',
      rollNumber: '24-CE-55',
      emergencyContactName: 'Ghalib Hussain Baloch',
      relationship: 'Father',
      emergencyPhone: '+92 333 4455679',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Unpaid',
    },
    {
      fullName: 'Asfand Yar Badini',
      fatherName: 'Habibullah Badini',
      cnic: '52202-0011223-9',
      dob: new Date('2002-08-20'),
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+92 334 7890120',
      email: 'asfand.badini@gmail.com',
      address: 'Badini Street, Khuzdar',
      city: 'Khuzdar',
      province: 'Balochistan',
      institution: 'Govt Degree College Khuzdar',
      collegeContact: '+92 848 412211',
      degree: 'BS Urdu Literature',
      department: 'Languages',
      semester: '7th Semester',
      rollNumber: 'GDC-URD-12',
      emergencyContactName: 'Habibullah Badini',
      relationship: 'Father',
      emergencyPhone: '+92 334 4455680',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      monthlyFee: 10000,
      feeStatus: 'Unpaid',
    },
  ];

  const createdStudents = [];

  for (let i = 0; i < studentDataList.length; i++) {
    const sData = studentDataList[i];
    const targetBed = createdBeds[i]; // First 20 beds for 20 students
    const targetRoom = createdRooms.find((r) => r._id.equals(targetBed.room));

    const seqStr = String(i + 1).padStart(4, '0');
    const stuId = `STU-2026-${seqStr}`;
    const admId = `HOST-2026-${seqStr}`;

    const student = await Student.create({
      studentId: stuId,
      admissionNumber: admId,
      fullName: sData.fullName,
      fatherName: sData.fatherName,
      cnic: sData.cnic,
      dob: sData.dob,
      gender: sData.gender,
      bloodGroup: sData.bloodGroup,
      phone: sData.phone,
      email: sData.email,
      address: sData.address,
      city: sData.city,
      province: sData.province,
      nationality: 'Pakistani',
      institution: sData.institution,
      collegeContact: sData.collegeContact,
      degree: sData.degree,
      department: sData.department,
      semester: sData.semester,
      rollNumber: sData.rollNumber,
      hostelName: 'Royal Hostel Khuzdar',
      admissionDate: new Date('2026-01-15'),
      monthlyFee: sData.monthlyFee,
      feeStatus: sData.feeStatus,
      paymentDate: sData.feeStatus === 'Paid' ? new Date('2026-10-05') : sData.feeStatus === 'Partial' ? new Date('2026-10-06') : null,
      room: targetRoom._id,
      bed: targetBed._id,
      floor: targetRoom.floor,
      block: targetRoom.block,
      studentStatus: 'Active',
      profilePhoto: sData.profilePhoto,
      emergencyContactName: sData.emergencyContactName,
      relationship: sData.relationship,
      emergencyPhone: sData.emergencyPhone,
      notes: `Resident of Royal Hostel Khuzdar in ${targetRoom.roomNumber}`,
    });

    // Update Bed and Room references
    targetBed.status = 'Occupied';
    targetBed.currentStudent = student._id;
    await targetBed.save();

    targetRoom.currentOccupants += 1;
    targetRoom.availableBeds -= 1;
    targetRoom.status = targetRoom.availableBeds === 0 ? 'Full' : 'Available';
    await targetRoom.save();

    createdStudents.push(student);
  }

  // Seed demo Student login user linked to resident profile
  if (createdStudents.length > 0) {
    await User.create({
      name: createdStudents[0].fullName,
      email: 'student@hostel.com',
      password: 'admin123',
      role: 'student',
      studentRef: createdStudents[0]._id,
      phone: createdStudents[0].phone,
    });
    console.log('[SEED] ✅ Seeded resident student user account (student@hostel.com / admin123)');
  }

  console.log('[SEED] Seeding 10 Royal Hostel Khuzdar Staff Members with Specific Responsibilities...');
  const staffConfigs = [
    {
      staffId: 'STF-2026-0001',
      name: 'Muhammad Asghar',
      fatherName: 'Haji Asghar Khan',
      cnic: '52202-1111222-1',
      phone: '+92 345 1122334',
      email: 'asghar.manager@royalhostelkhuzdar.com',
      designation: 'Hostel Manager',
      job: 'Hostel Manager',
      department: 'Hostel Administration',
      role: 'Warden',
      salary: 65000,
      status: 'Active',
      address: 'Main Town, Khuzdar',
      notes: 'Oversees daily hostel administration, resident discipline, and operations.',
    },
    {
      staffId: 'STF-2026-0002',
      name: 'Abdul Qadir',
      fatherName: 'Ghulam Qadir',
      cnic: '52202-2222333-2',
      phone: '+92 334 5566778',
      email: 'qadir.finance@royalhostelkhuzdar.com',
      designation: 'Accountant',
      job: 'Accountant',
      department: 'Finance',
      role: 'Accountant',
      salary: 45000,
      status: 'Active',
      address: 'Karkh Road, Khuzdar',
      notes: 'Manages student fee vouchers, resident dues, and monthly expenditure audits.',
    },
    {
      staffId: 'STF-2026-0003',
      name: 'Ghulam Rasool',
      fatherName: 'Rasool Bakhsh',
      cnic: '52202-3333444-3',
      phone: '+92 331 4433551',
      email: 'rasool.cook@royalhostelkhuzdar.com',
      designation: 'Cook',
      job: 'Cook',
      department: 'Mess & Dining',
      role: 'Staff',
      salary: 35000,
      status: 'Active',
      address: 'Bazar Road, Khuzdar',
      notes: 'Head chef preparing nutritious breakfast, lunch, and dinner for resident students.',
    },
    {
      staffId: 'STF-2026-0004',
      name: 'Niaz Ahmed',
      fatherName: 'Ahmed Din',
      cnic: '52202-4444555-4',
      phone: '+92 332 6677889',
      email: 'niaz.kitchen@royalhostelkhuzdar.com',
      designation: 'Assistant Cook',
      job: 'Assistant Cook',
      department: 'Mess & Dining',
      role: 'Staff',
      salary: 28000,
      status: 'Active',
      address: 'Gabol Colony, Khuzdar',
      notes: 'Kitchen preparation, food service, and dining hall sanitation support.',
    },
    {
      staffId: 'STF-2026-0005',
      name: 'Mir Jan Baloch',
      fatherName: 'Murad Baloch',
      cnic: '52202-5555666-5',
      phone: '+92 301 7766554',
      email: 'mirjan.guard@royalhostelkhuzdar.com',
      designation: 'Security Guard',
      job: 'Security Guard',
      department: 'Security',
      role: 'Security',
      salary: 30000,
      status: 'Active',
      address: 'Nal Road, Khuzdar',
      notes: 'Day shift gate entry control, visitor verification, and perimeter security.',
    },
    {
      staffId: 'STF-2026-0006',
      name: 'Dad Muhammad',
      fatherName: 'Yousaf Khan',
      cnic: '52202-6666777-6',
      phone: '+92 302 8877665',
      email: 'dad.guard@royalhostelkhuzdar.com',
      designation: 'Security Guard',
      job: 'Security Guard',
      department: 'Security',
      role: 'Security',
      salary: 30000,
      status: 'Active',
      address: 'Khad Kocha, Khuzdar',
      notes: 'Night shift gate vigilance, night patrol, and strict curfew enforcement.',
    },
    {
      staffId: 'STF-2026-0007',
      name: 'Babu Lal',
      fatherName: 'Kishan Lal',
      cnic: '52202-7777888-7',
      phone: '+92 313 1122998',
      email: 'babulal.cleaner@royalhostelkhuzdar.com',
      designation: 'Cleaner',
      job: 'Cleaner',
      department: 'Housekeeping',
      role: 'Staff',
      salary: 25000,
      status: 'Active',
      address: 'Lal Colony, Khuzdar',
      notes: 'Daily sanitation of corridors, common washrooms, dining area, and staircases.',
    },
    {
      staffId: 'STF-2026-0008',
      name: 'Tariq Mengal',
      fatherName: 'Fateh Mengal',
      cnic: '52202-8888999-8',
      phone: '+92 314 3344556',
      email: 'tariq.maintenance@royalhostelkhuzdar.com',
      designation: 'Electrician/Maintenance Worker',
      job: 'Electrician/Maintenance Worker',
      department: 'Maintenance',
      role: 'Staff',
      salary: 32000,
      status: 'Active',
      address: 'Power Grid Road, Khuzdar',
      notes: 'Electrical wiring, UPS/generator maintenance, plumbing, and general hardware repairs.',
    },
    {
      staffId: 'STF-2026-0009',
      name: 'Bilal Zehri',
      fatherName: 'Wali Muhammad Zehri',
      cnic: '52202-9999000-9',
      phone: '+92 312 9988776',
      email: 'bilal.reception@royalhostelkhuzdar.com',
      designation: 'Receptionist',
      job: 'Receptionist',
      department: 'Front Desk',
      role: 'Receptionist',
      salary: 30000,
      status: 'Active',
      address: 'Civil Lines, Khuzdar',
      notes: 'Resident inquiry handling, new student registration assistance, and gate visitor register.',
    },
    {
      staffId: 'STF-2026-0010',
      name: 'Sanaullah',
      fatherName: 'Khuda Bakhsh',
      cnic: '52202-1010202-0',
      phone: '+92 315 5544332',
      email: 'sanaullah.helper@royalhostelkhuzdar.com',
      designation: 'General Helper',
      job: 'General Helper',
      department: 'Support Staff',
      role: 'Staff',
      salary: 22000,
      status: 'Active',
      address: 'Chakar Bazar, Khuzdar',
      notes: 'Water supply monitoring, luggage assistance, inventory shifting, and errand runs.',
    },
  ];

  const createdStaff = await Staff.create(staffConfigs);

  console.log('[SEED] Seeding Monthly Staff Salary Records for October 2026...');
  // Total Monthly Staff Salary Expense: 65k+45k+35k+28k+30k+30k+25k+32k+30k+22k = PKR 342,000
  const currentMonthName = 'October 2026';
  const currentYearNum = 2026;

  for (let i = 0; i < createdStaff.length; i++) {
    const st = createdStaff[i];
    const seq = String(i + 1).padStart(4, '0');
    const salaryId = `SAL-2026-${seq}`;

    // Demo payment state: 7 fully paid, 2 partial, 1 pending
    let paidAmt = st.salary;
    let paymentStatus = 'Paid';
    if (i === 7) { // Electrician partial
      paidAmt = 20000;
      paymentStatus = 'Partial';
    } else if (i === 8) { // Receptionist partial
      paidAmt = 15000;
      paymentStatus = 'Partial';
    } else if (i === 9) { // General Helper unpaid
      paidAmt = 0;
      paymentStatus = 'Unpaid';
    }

    const pendingAmt = Math.max(0, st.salary - paidAmt);

    await Salary.create({
      salaryId,
      staff: st._id,
      staffName: st.name,
      job: st.job || st.designation,
      monthlySalary: st.salary,
      paidAmount: paidAmt,
      pendingAmount: pendingAmt,
      month: currentMonthName,
      year: currentYearNum,
      paymentDate: paidAmt > 0 ? new Date('2026-10-02') : null,
      paymentStatus,
      paymentMethod: 'Bank Transfer',
      notes: `Monthly payroll compensation for ${st.job}`,
      paidBy: accountant._id,
    });
  }

  console.log('[SEED] Seeding Realistic Hostel Expenses for October 2026...');
  const expenseList = [
    {
      expenseId: 'EXP-2026-0001',
      category: 'Food',
      description: 'Monthly grocery, rice, pulses, and spices for hostel mess kitchen',
      amount: 65000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-02'),
      paidBy: 'Hostel Manager',
      paymentMethod: 'Cash',
      notes: 'Purchased wholesale from Khuzdar Main Market',
    },
    {
      expenseId: 'EXP-2026-0002',
      category: 'Electricity',
      description: 'QESCO Commercial electricity bill for Royal Hostel campus',
      amount: 48000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-04'),
      paidBy: 'Abdul Qadir (Accountant)',
      paymentMethod: 'Bank Transfer',
      notes: 'Paid online via National Bank Khuzdar branch',
    },
    {
      expenseId: 'EXP-2026-0003',
      category: 'Gas',
      description: 'SSGC pipeline commercial gas bill for kitchen and water heating',
      amount: 14000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-05'),
      paidBy: 'Abdul Qadir (Accountant)',
      paymentMethod: 'Online',
      notes: 'Paid on due date',
    },
    {
      expenseId: 'EXP-2026-0004',
      category: 'Water',
      description: 'Weekly water tanker supply for underground storage reservoir',
      amount: 8000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-03'),
      paidBy: 'Sanaullah (General Helper)',
      paymentMethod: 'Cash',
      notes: '4 tankers supplied by Khuzdar Municipal Water Supply',
    },
    {
      expenseId: 'EXP-2026-0005',
      category: 'Internet',
      description: 'PTCL Enterprise 100 Mbps Dedicated Optical Fiber connection',
      amount: 12000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-01'),
      paidBy: 'Hostel Manager',
      paymentMethod: 'Online',
      notes: 'Includes router rental & bandwidth package',
    },
    {
      expenseId: 'EXP-2026-0006',
      category: 'Maintenance',
      description: 'Replacement of washroom taps, flush valves, and plumbing fittings',
      amount: 15000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-06'),
      paidBy: 'Tariq Mengal (Electrician)',
      paymentMethod: 'Cash',
      notes: 'Block B washrooms general overhaul',
    },
    {
      expenseId: 'EXP-2026-0007',
      category: 'Cleaning Supplies',
      description: 'Phenyl, detergents, mop buckets, disinfectants, and garbage bags',
      amount: 9500,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-03'),
      paidBy: 'Babu Lal (Cleaner)',
      paymentMethod: 'Cash',
      notes: 'Full month housekeeping inventory stock',
    },
    {
      expenseId: 'EXP-2026-0008',
      category: 'Laundry',
      description: 'Hostel bed linens, curtains, and dining tablecloth commercial wash',
      amount: 7000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-04'),
      paidBy: 'Sanaullah (General Helper)',
      paymentMethod: 'Cash',
      notes: 'Bi-weekly laundry batch',
    },
    {
      expenseId: 'EXP-2026-0009',
      category: 'Rent',
      description: 'Hostel campus building monthly lease payment',
      amount: 85000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-01'),
      paidBy: 'Hostel Administration',
      paymentMethod: 'Bank Transfer',
      notes: 'Lease contract agreement month 10 installment',
    },
    {
      expenseId: 'EXP-2026-0010',
      category: 'Security',
      description: 'CCTV surveillance camera servicing and backup DVR hard drive check',
      amount: 6000,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-05'),
      paidBy: 'Mir Jan Baloch (Security)',
      paymentMethod: 'Cash',
      notes: 'Monthly security hardware inspection',
    },
    {
      expenseId: 'EXP-2026-0011',
      category: 'Stationery',
      description: 'Printing paper, visitor log registers, toner, and receipt vouchers',
      amount: 3500,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-02'),
      paidBy: 'Bilal Zehri (Receptionist)',
      paymentMethod: 'Cash',
      notes: 'Official administration stationery',
    },
    {
      expenseId: 'EXP-2026-0012',
      category: 'Repairs',
      description: 'Standby diesel generator oil filter, fan belt, and battery servicing',
      amount: 8500,
      month: currentMonthName,
      year: currentYearNum,
      date: new Date('2026-10-07'),
      paidBy: 'Tariq Mengal (Electrician)',
      paymentMethod: 'Cash',
      notes: 'Standby generator pre-winter maintenance check',
    },
  ];

  await Expense.create(expenseList);

  console.log('[SEED] Seeding 20 Student Fee Invoices & Payment Records for October 2026...');
  // Standard fee: PKR 10,000.
  // 20 students x 10,000 = PKR 200,000 expected monthly income.
  // 14 students paid full (PKR 140,000)
  // 3 students paid partial (e.g. 5,000 each = PKR 15,000)
  // 3 students unpaid (PKR 0)
  // Total collected = PKR 155,000. Pending = PKR 45,000.
  for (let i = 0; i < createdStudents.length; i++) {
    const stu = createdStudents[i];
    const seq = String(i + 1).padStart(4, '0');
    const invoiceNumber = `INV-2026-${seq}`;
    const feeAmount = stu.monthlyFee || 10000;

    let paid = feeAmount;
    let status = 'Paid';
    if (i >= 14 && i < 17) {
      paid = 5000;
      status = 'Partial';
    } else if (i >= 17) {
      paid = 0;
      status = 'Pending';
    }

    const remaining = feeAmount - paid;

    const feeInvoice = await Fee.create({
      invoiceNumber,
      student: stu._id,
      month: 'Oct',
      year: 2026,
      feeType: 'Hostel Fee',
      amount: feeAmount,
      discount: 0,
      fine: 0,
      total: feeAmount,
      paidAmount: paid,
      remainingAmount: remaining,
      dueDate: new Date('2026-10-10'),
      paymentDate: paid > 0 ? new Date('2026-10-05') : null,
      paymentMethod: i % 2 === 0 ? 'Bank Transfer' : 'Cash',
      status,
      notes: `Standard monthly hostel fee for ${stu.fullName} (Room ${stu.room?.roomNumber || '101'})`,
      createdBy: accountant._id,
    });

    if (paid > 0) {
      await Payment.create({
        receiptNumber: `REC-2026-${seq}`,
        fee: feeInvoice._id,
        student: stu._id,
        amount: paid,
        paymentDate: new Date('2026-10-05'),
        paymentMethod: feeInvoice.paymentMethod,
        transactionId: `TXN-RH-${202600 + i}`,
        receivedBy: accountant._id,
        notes: `Received monthly hostel payment for ${currentMonthName}`,
      });
    }
  }

  console.log('[SEED] Seeding Attendance Records for Today...');
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < createdStudents.length; i++) {
    const stu = createdStudents[i];
    let attStatus = 'Present';
    if (i === 18) attStatus = 'Absent';
    else if (i === 19) attStatus = 'Leave';
    else if (i === 15) attStatus = 'Late';

    await Attendance.create({
      student: stu._id,
      date: today,
      status: attStatus,
      checkInTime: new Date(),
      markedBy: warden._id,
      notes: attStatus === 'Present' ? 'On time' : attStatus === 'Late' ? 'Library research' : '',
    });
  }

  console.log('[SEED] Seeding Gate Visitors...');
  await Visitor.create({
    visitorName: 'Haji Asghar Khan',
    cnic: '52202-9876543-1',
    phone: '+92 333 4455661',
    student: createdStudents[0]._id,
    relationship: 'Father',
    visitDate: today,
    checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    purpose: 'Delivered winter jacket and university books',
    status: 'Active',
    registeredBy: users[4]._id,
  });

  await Visitor.create({
    visitorName: 'Nadir Khan Mengal',
    cnic: '52202-8765432-2',
    phone: '+92 334 4455662',
    student: createdStudents[1]._id,
    relationship: 'Father',
    visitDate: today,
    checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    checkOutTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    purpose: 'Monthly student allowance delivery',
    status: 'Checked Out',
    registeredBy: users[4]._id,
  });

  console.log('[SEED] Seeding Maintenance Complaints...');
  await Complaint.create({
    complaintId: 'CMP-2026-0001',
    student: createdStudents[0]._id,
    category: 'Internet / Wi-Fi',
    description: 'Block A 1st Floor Wi-Fi access point rebooted due to power fluctuation.',
    priority: 'High',
    status: 'Resolved',
    resolution: 'UPS line connected to access point by Tariq Mengal.',
    resolvedDate: new Date(),
    assignedStaff: createdStaff[7]._id,
    createdBy: admin._id,
  });

  await Complaint.create({
    complaintId: 'CMP-2026-0002',
    student: createdStudents[4]._id,
    category: 'Electrical',
    description: 'Room 201 study desk light bulb socket needs replacement.',
    priority: 'Medium',
    status: 'In Progress',
    assignedStaff: createdStaff[7]._id,
    createdBy: admin._id,
  });

  console.log('[SEED] Seeding Announcements...');
  await Announcement.create([
    {
      title: 'Welcome to Royal Hostel Khuzdar',
      message: 'All residents are advised to ensure their Student Hostel Smart Cards are updated. Gate curfew is strictly 10:00 PM.',
      audience: 'All',
      priority: 'Important',
      status: 'Active',
      createdBy: superAdmin._id,
    },
    {
      title: 'Mess Committee Weekly Review',
      message: 'The weekly dinner menu discussion will be held with student floor representatives in the main dining hall tonight at 8:30 PM.',
      audience: 'Students',
      priority: 'Normal',
      status: 'Active',
      createdBy: warden._id,
    },
  ]);

  console.log('[SEED] Seeding Activity Log...');
  await ActivityLog.create([
    {
      userName: 'Super Admin Hanif',
      userRole: 'Super Admin',
      action: 'SYSTEM_UPGRADED',
      module: 'System',
      recordId: 'RH-2026-INIT',
      details: {
        hostel: 'Royal Hostel Khuzdar',
        totalStudents: 20,
        totalStaff: 10,
        standardFee: 10000,
        message: 'Royal Hostel Khuzdar full operational ecosystem initialized successfully.',
      },
    },
  ]);

  console.log('✅ ROYAL HOSTEL KHUZDAR DATABASE SEEDING COMPLETED SUCCESSFULLY!');
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDataInternal();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = { seedDataInternal };
