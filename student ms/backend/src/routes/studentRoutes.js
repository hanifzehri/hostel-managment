const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  verifyStudent,
  uploadStudentDocument,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public verification for QR Code scanner
router.get('/verify/:identifier', verifyStudent);

// Protected routes
router.use(protect);

router
  .route('/')
  .get(authorize('superadmin', 'admin', 'warden', 'receptionist', 'accountant'), getStudents)
  .post(authorize('superadmin', 'admin', 'receptionist'), createStudent);

router
  .route('/:id')
  .get(getStudentById)
  .put(authorize('superadmin', 'admin', 'receptionist'), updateStudent)
  .delete(authorize('superadmin', 'admin'), deleteStudent);

router.post(
  '/:id/documents',
  authorize('superadmin', 'admin', 'receptionist'),
  upload.single('file'),
  uploadStudentDocument
);

module.exports = router;
