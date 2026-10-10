const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Student = require('../models/Student');
const Setting = require('../models/Setting');

const targetRooms = [
  // Floor 1: 4 rooms (13 beds)
  { roomNumber: '101', floor: 1, block: 'Floor 1', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '102', floor: 1, block: 'Floor 1', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '103', floor: 1, block: 'Floor 1', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '104', floor: 1, block: 'Floor 1', capacity: 4, roomType: 'Four Bed', monthlyFee: 10000 },

  // Floor 2: 4 rooms (13 beds)
  { roomNumber: '201', floor: 2, block: 'Floor 2', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '202', floor: 2, block: 'Floor 2', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '203', floor: 2, block: 'Floor 2', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '204', floor: 2, block: 'Floor 2', capacity: 4, roomType: 'Four Bed', monthlyFee: 10000 },

  // Floor 3: 4 rooms (14 beds)
  { roomNumber: '301', floor: 3, block: 'Floor 3', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '302', floor: 3, block: 'Floor 3', capacity: 3, roomType: 'Triple', monthlyFee: 10000 },
  { roomNumber: '303', floor: 3, block: 'Floor 3', capacity: 4, roomType: 'Four Bed', monthlyFee: 10000 },
  { roomNumber: '304', floor: 3, block: 'Floor 3', capacity: 4, roomType: 'Four Bed', monthlyFee: 10000 },
];

async function migrate() {
  try {
    console.log('[MIGRATION] 🚀 Starting 3-Floor 12-Room 40-Bed Migration...');
    await connectDB();

    // 1. Ensure Setting has maxStudentCapacity = 40
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({ maxStudentCapacity: 40 });
    } else {
      setting.maxStudentCapacity = 40;
      await setting.save();
    }
    console.log('[MIGRATION] ✅ Setting updated with maxStudentCapacity = 40');

    // 2. Iterate over all 12 target rooms
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const conf of targetRooms) {
      let room = await Room.findOne({ roomNumber: conf.roomNumber });
      if (!room) {
        room = await Room.create({
          roomNumber: conf.roomNumber,
          floor: conf.floor,
          block: `Floor ${conf.floor}`,
          capacity: conf.capacity,
          roomType: conf.roomType,
          monthlyFee: conf.monthlyFee,
          currentOccupants: 0,
          availableBeds: conf.capacity,
          status: 'Available',
          amenities: ['Attached Bath', 'Study Desk', 'Built-in Cupboard', 'High-Speed Wi-Fi', 'Ceiling Fan'],
        });
        console.log(`[MIGRATION] ➕ Created new Room ${conf.roomNumber} (Floor ${conf.floor}, Cap ${conf.capacity})`);
      } else {
        // Ensure floor and block and minimum capacity are updated
        room.floor = conf.floor;
        room.block = `Floor ${conf.floor}`;
        if (room.capacity < conf.capacity) {
          room.capacity = conf.capacity;
          room.roomType = conf.roomType;
        }
        await room.save();
        console.log(`[MIGRATION] 🔄 Updated existing Room ${conf.roomNumber} (Floor ${conf.floor}, Cap ${room.capacity})`);
      }

      // Ensure beds exist up to room.capacity
      const existingBeds = await Bed.find({ room: room._id }).sort({ bedNumber: 1 });
      const currentBedCount = existingBeds.length;

      if (currentBedCount < room.capacity) {
        const bedsToCreate = [];
        for (let i = currentBedCount; i < room.capacity; i++) {
          bedsToCreate.push({
            bedNumber: `Bed ${alphabet[i] || i + 1}`,
            room: room._id,
            status: 'Available',
            currentStudent: null,
            monthlyRent: room.monthlyFee,
          });
        }
        if (bedsToCreate.length > 0) {
          await Bed.insertMany(bedsToCreate);
          console.log(`[MIGRATION]    ➕ Added ${bedsToCreate.length} beds to Room ${room.roomNumber}`);
        }
      }

      // Recalculate room occupancy
      const occupiedBeds = await Bed.countDocuments({ room: room._id, status: 'Occupied' });
      const totalBeds = await Bed.countDocuments({ room: room._id });
      room.currentOccupants = occupiedBeds;
      room.availableBeds = Math.max(0, (room.capacity || totalBeds) - occupiedBeds);

      if (room.currentOccupants === 0) {
        room.status = 'Available';
      } else if (room.currentOccupants >= room.capacity) {
        room.status = 'Full';
      } else {
        room.status = 'Partially Occupied';
      }
      await room.save();
    }

    // 3. Fix any student CNIC/phone formatting and ensure consistency
    const students = await Student.find();
    console.log(`[MIGRATION] Checking ${students.length} existing student records...`);
    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      let changed = false;

      // Ensure CNIC exists and has valid format
      if (!stu.cnic || !/^\d{5}-?\d{7}-?\d{1}$/.test(stu.cnic.trim())) {
        const paddedIdx = String(i + 1).padStart(7, '0');
        stu.cnic = `54400-${paddedIdx}-1`;
        changed = true;
      }

      // Ensure phone exists and has valid format
      if (!stu.phone) {
        const paddedIdx = String(i + 1).padStart(7, '0');
        stu.phone = `0300-${paddedIdx}`;
        changed = true;
      }

      // Ensure profilePhoto & profilePicture sync
      if (!stu.profilePhoto && stu.profilePicture) {
        stu.profilePhoto = stu.profilePicture;
        changed = true;
      } else if (!stu.profilePicture && stu.profilePhoto) {
        stu.profilePicture = stu.profilePhoto;
        changed = true;
      }

      // Ensure student floor matches room floor
      if (stu.room) {
        const room = await Room.findById(stu.room);
        if (room && stu.floor !== room.floor) {
          stu.floor = room.floor;
          stu.block = `Floor ${room.floor}`;
          changed = true;
        }
      }

      if (changed) {
        await stu.save();
      }
    }

    // 4. Print Summary
    const allRooms = await Room.find().sort({ roomNumber: 1 });
    let totalCap = 0;
    let totalOcc = 0;
    allRooms.forEach(r => {
      totalCap += r.capacity;
      totalOcc += r.currentOccupants;
    });

    console.log('\n[MIGRATION] ========================================');
    console.log(`[MIGRATION] Total Rooms in Database: ${allRooms.length}`);
    console.log(`[MIGRATION] Total Hostel Bed Capacity: ${totalCap}`);
    console.log(`[MIGRATION] Total Occupants: ${totalOcc}`);
    console.log(`[MIGRATION] Available Beds: ${totalCap - totalOcc}`);
    console.log('[MIGRATION] Floors & Rooms Breakdown:');
    [1, 2, 3].forEach(f => {
      const fRooms = allRooms.filter(r => r.floor === f);
      console.log(`  Floor ${f}: ${fRooms.map(r => `${r.roomNumber} (${r.currentOccupants}/${r.capacity} beds, ${r.status})`).join(' | ')}`);
    });
    console.log('[MIGRATION] ========================================');
    console.log('[MIGRATION] ✨ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION_ERROR]', err);
    process.exit(1);
  }
}

migrate();
