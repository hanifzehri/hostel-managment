const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorize('superadmin', 'admin', 'warden', 'receptionist'), getRooms)
  .post(authorize('superadmin', 'admin'), createRoom);

router
  .route('/:id')
  .get(authorize('superadmin', 'admin', 'warden', 'receptionist'), getRoomById)
  .put(authorize('superadmin', 'admin'), updateRoom)
  .delete(authorize('superadmin', 'admin'), deleteRoom);

module.exports = router;
