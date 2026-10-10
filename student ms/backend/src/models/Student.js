const mongoose = require('mongoose');
const crypto = require('crypto');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'application/pdf' },
  uploadedAt: { type: Date, default: Date.now },
});

const StudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC / B-Form is mandatory'],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          return /^\d{5}-?\d{7}-?\d{1}$/.test(v.trim());
        },
        message: 'Invalid CNIC format. CNIC must be 13 digits (e.g. 54400-1234567-1).',
      },
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    phone: {
      type: String,
      required: [true, 'Contact number is mandatory'],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          const clean = v.replace(/[\s-]/g, '');
          return /^(\+92|0)?3\d{9}$/.test(clean) || /^\+?\d{10,15}$/.test(clean);
        },
        message: 'Invalid contact number format. Please provide a valid mobile number (e.g. 0300-1234567).',
      },
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Permanent address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    province: {
      type: String,
      default: 'Punjab',
      trim: true,
    },
    nationality: {
      type: String,
      default: 'Pakistani',
      trim: true,
    },

    // Education
    institution: {
      type: String,
      required: [true, 'Institution / University is required'],
      trim: true,
    },
    collegeContact: {
      type: String,
      trim: true,
      default: '+92 848 412300',
    },
    degree: {
      type: String,
      required: [true, 'Degree / Class is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'Computer Science',
      trim: true,
    },
    semester: {
      type: String,
      default: '1st Semester',
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },

    // Hostel Information
    hostelName: {
      type: String,
      default: 'Royal Hostel Khuzdar',
      trim: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    monthlyFee: {
      type: Number,
      default: 10000,
      min: 0,
    },
    feeStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid', 'Overdue'],
      default: 'Unpaid',
    },
    paymentDate: {
      type: Date,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
    },
    floor: {
      type: Number,
      default: 1,
    },
    block: {
      type: String,
      default: 'Block A',
    },
    studentStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Checked Out', 'Suspended', 'Pending'],
      default: 'Active',
    },
    checkInDate: {
      type: Date,
      default: Date.now,
    },
    expectedCheckOutDate: {
      type: Date,
    },
    actualCheckOutDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },

    // Emergency Contact
    emergencyContactName: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      default: 'Father',
    },
    emergencyPhone: {
      type: String,
      required: [true, 'Emergency phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyAddress: {
      type: String,
      trim: true,
      default: '',
    },

    // Documents
    documents: [DocumentSchema],

    // Verification token used for safe public QR code profile verification
    verificationToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto generate verification token prior to save if absent
StudentSchema.pre('save', function () {
  if (!this.verificationToken) {
    this.verificationToken = crypto.randomBytes(16).toString('hex');
  }
  if (this.profilePicture && !this.profilePhoto) {
    this.profilePhoto = this.profilePicture;
  }
  if (this.profilePhoto && !this.profilePicture) {
    this.profilePicture = this.profilePhoto;
  }
});

// Indexes for efficient search, filtering, and constraint enforcement
StudentSchema.index({ studentStatus: 1, block: 1, floor: 1 });
StudentSchema.index({ cnic: 1 }, { unique: true });
StudentSchema.index({ phone: 1 });
StudentSchema.index({ fullName: 'text', studentId: 'text', cnic: 'text', phone: 'text' });

module.exports = mongoose.model('Student', StudentSchema);
