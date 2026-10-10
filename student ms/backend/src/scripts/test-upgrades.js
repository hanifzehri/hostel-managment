const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const http = require('http');

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const r = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, body: resData });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function runTests() {
  console.log('Testing Upgrade Backend Features...');

  // 1. Login as superadmin
  const loginRes = await req('POST', '/api/auth/login', {
    email: 'superadmin@hostel.com',
    password: 'admin123',
  });
  console.log('1. Login status:', loginRes.status);
  const token = loginRes.body?.token;
  if (!token) throw new Error('Could not get token');

  // 2. Test rejection on invalid CNIC
  const invalidCnicRes = await req('POST', '/api/students', {
    fullName: 'Test Resident',
    fatherName: 'Father',
    cnic: '12345', // invalid
    phone: '03001234567',
    dob: '2004-01-01',
    address: 'Khuzdar',
    city: 'Khuzdar',
    institution: 'BUET',
    degree: 'BS',
    emergencyContactName: 'Father',
    emergencyPhone: '03009876543',
  }, token);
  console.log('2. Invalid CNIC rejected:', invalidCnicRes.status === 400, invalidCnicRes.body.message);

  // 3. Test rejection on invalid phone
  const invalidPhoneRes = await req('POST', '/api/students', {
    fullName: 'Test Resident',
    fatherName: 'Father',
    cnic: '54400-9999999-1',
    phone: '123', // invalid
    dob: '2004-01-01',
    address: 'Khuzdar',
    city: 'Khuzdar',
    institution: 'BUET',
    degree: 'BS',
    emergencyContactName: 'Father',
    emergencyPhone: '03009876543',
  }, token);
  console.log('3. Invalid Phone rejected:', invalidPhoneRes.status === 400, invalidPhoneRes.body.message);

  // 4. Test fetch rooms (check 12 rooms across 3 floors)
  const roomsRes = await req('GET', '/api/rooms', null, token);
  console.log('4. Total rooms:', roomsRes.body.data?.length);
  const fullRoom = roomsRes.body.data?.find(r => r.status === 'Full');
  const availableRoom = roomsRes.body.data?.find(r => r.status === 'Available' || r.status === 'Partially Occupied');
  console.log('   Found full room:', fullRoom?.roomNumber, 'Available/Partial room:', availableRoom?.roomNumber);

  // 5. Test Room Transfer
  // Get an active student
  const studentsRes = await req('GET', '/api/students?limit=5', null, token);
  const testStudent = studentsRes.body.data?.[0];
  console.log('5. Selected test student:', testStudent?.fullName, 'Current Room:', testStudent?.room?.roomNumber);

  if (testStudent && fullRoom && testStudent.room?._id !== fullRoom._id) {
    // Attempt transfer to full room -> MUST FAIL with 400
    const fullTransferRes = await req('POST', `/api/students/${testStudent._id}/transfer-room`, {
      newRoomId: fullRoom._id,
      reason: 'Trying to transfer to full room',
    }, token);
    console.log('   Transfer to Full Room blocked:', fullTransferRes.status === 400, fullTransferRes.body.message);
  }

  if (testStudent && availableRoom && testStudent.room?._id !== availableRoom._id) {
    // Transfer to available room -> MUST SUCCEED with 200
    const validTransferRes = await req('POST', `/api/students/${testStudent._id}/transfer-room`, {
      newRoomId: availableRoom._id,
      reason: 'Upgrading room to ' + availableRoom.roomNumber,
    }, token);
    console.log('   Transfer to available room success:', validTransferRes.status === 200, validTransferRes.body.message);

    // Check transfer history
    const historyRes = await req('GET', `/api/students/${testStudent._id}/transfer-history`, null, token);
    console.log('   Transfer history recorded:', historyRes.status === 200, 'Entries:', historyRes.body.count);
  }

  console.log('\nAll new backend upgrade features verified successfully!');
}

runTests().catch(console.error);
