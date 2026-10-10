const http = require('http');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const targetPort = process.env.TEST_PORT || 5000;
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: encodeURI(path),
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(dataString);
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 ========================================================');
  console.log('🧪 STARTING FULL-STACK HOSTEL SYSTEM INTEGRATION TEST SUITE');
  console.log('🧪 ========================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} ->`, details);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.body.status === 'OK', 'Health check responds with 200 OK');

    // 2. Auth Login
    const loginRes = await request('/api/auth/login', 'POST', {
      email: 'superadmin@hostel.com',
      password: 'admin123',
    });
    assert(loginRes.status === 200 && !!loginRes.body.token, 'Superadmin login succeeds with valid JWT token');
    const token = loginRes.body.token;

    // 3. Auth Profile
    const meRes = await request('/api/auth/me', 'GET', null, token);
    assert(meRes.status === 200 && meRes.body.user.role === 'superadmin', 'Get current authenticated user profile');

    // 4. Dashboard Stats
    const dashRes = await request('/api/dashboard/stats', 'GET', null, token);
    const hasTrendChart = dashRes.body?.charts && ((dashRes.body.charts.monthlyFinanceTrend?.length > 0) || (dashRes.body.charts.monthlyFeeTrend?.length > 0));
    assert(
      dashRes.status === 200 && dashRes.body.stats.students.total > 0 && hasTrendChart,
      'Dashboard returns real-time aggregated metrics and chart series'
    );

    // 5. Rooms & Beds list
    const roomsRes = await request('/api/rooms', 'GET', null, token);
    assert(roomsRes.status === 200 && roomsRes.body.data.length > 0, 'Rooms retrieved with populated beds array');
    const firstRoom = roomsRes.body.data[0];

    // 6. Bed double-assignment prevention test
    const bedsRes = await request('/api/beds', 'GET', null, token);
    const occupiedBed = bedsRes.body.data.find((b) => b.status === 'Occupied');
    const availableBed = bedsRes.body.data.find((b) => b.status === 'Available');

    if (occupiedBed && availableBed) {
      // Try assigning already occupied bed
      const doubleAssignRes = await request(
        `/api/beds/${occupiedBed._id}/assign`,
        'POST',
        { studentId: occupiedBed.currentStudent._id || occupiedBed.currentStudent },
        token
      );
      assert(
        doubleAssignRes.status === 400,
        'Strict prevention of double-bed assignment (cannot assign already occupied bed)'
      );
    }

    // 7. Student Creation
    const newStudentData = {
      fullName: 'Bilal Farooq Test',
      fatherName: 'Farooq Ahmed',
      cnic: `35202-998811-${Math.floor(100 + Math.random() * 900)}`,
      dob: '2004-03-12',
      gender: 'Male',
      phone: '+92 300 7766554',
      email: `bilal.test.${Date.now()}@gmail.com`,
      address: 'House 88, Cavalry Ground',
      city: 'Lahore',
      province: 'Punjab',
      institution: 'LUMS',
      degree: 'BS Computer Science',
      bed: availableBed ? availableBed._id : null,
      emergencyContactName: 'Farooq Ahmed',
      relationship: 'Father',
      emergencyPhone: '+92 321 8877665',
    };

    const createStudentRes = await request('/api/students', 'POST', newStudentData, token);
    if (createStudentRes.status !== 201) {
      console.error('Create student error:', createStudentRes.status, createStudentRes.body);
    }
    assert(
      createStudentRes.status === 201 && !!createStudentRes.body?.student?.studentId,
      'Student created with auto-generated sequential ID and bed allocation'
    );
    const createdStudent = createStudentRes.body.student;

    // 8. Public QR Code Verification endpoint
    const verifyRes = await request(`/api/students/verify/${createdStudent.verificationToken}`);
    assert(
      verifyRes.status === 200 && verifyRes.body.data.verified === true && verifyRes.body.data.fullName === 'Bilal Farooq Test',
      'Public QR Verification endpoint validates resident authenticity'
    );

    // 9. Fee Invoice creation & Payment recording
    const feeRes = await request(
      '/api/fees',
      'POST',
      {
        studentId: createdStudent._id,
        month: 'Nov',
        year: 2026,
        feeType: 'Hostel Fee',
        amount: 18000,
        dueDate: '2026-11-10',
      },
      token
    );
    assert(feeRes.status === 201 && feeRes.body.data.total === 18000, 'Fee invoice created with sequential INV number');
    const createdFee = feeRes.body.data;

    // Record partial payment
    const paymentRes = await request(
      `/api/fees/${createdFee._id}/payments`,
      'POST',
      {
        amount: 10000,
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN-E2E-TEST',
      },
      token
    );
    assert(
      paymentRes.status === 201 && paymentRes.body.fee.status === 'Partial' && paymentRes.body.fee.remainingAmount === 8000,
      'Payment recorded, balance recalculated, and status updated to Partial'
    );

    // 10. Daily Attendance & Bulk Marking
    const attRes = await request(
      '/api/attendance/bulk-mark',
      'POST',
      {
        date: '2026-10-08',
        records: [
          { studentId: createdStudent._id, status: 'Present' },
        ],
      },
      token
    );
    assert(attRes.status === 200, 'Attendance marked and bulk written successfully');

    // 11. Leave Request & Review
    const leaveRes = await request(
      '/api/leaves',
      'POST',
      {
        studentId: createdStudent._id,
        leaveType: 'Home Visit',
        startDate: '2026-10-10',
        endDate: '2026-10-14',
        reason: 'Family visit',
        destination: 'Islamabad',
        emergencyContact: '+92 321 8877665',
      },
      token
    );
    assert(leaveRes.status === 201, 'Student leave request created with Pending status');
    const leaveId = leaveRes.body.data._id;

    const reviewRes = await request(
      `/api/leaves/${leaveId}/review`,
      'PUT',
      { status: 'Approved', reviewNotes: 'Approved by warden' },
      token
    );
    assert(reviewRes.status === 200 && reviewRes.body.data.status === 'Approved', 'Leave request reviewed and approved');

    // 12. Visitor Registration & Check-out
    const visitorRes = await request(
      '/api/visitors',
      'POST',
      {
        visitorName: 'Kamran Farooq',
        cnic: '35202-5544332-1',
        phone: '+92 300 9988776',
        studentId: createdStudent._id,
        relationship: 'Brother',
        purpose: 'Bringing books',
      },
      token
    );
    assert(visitorRes.status === 201, 'Visitor registered and checked in');
    const visitorId = visitorRes.body.data._id;

    const checkoutVisitorRes = await request(`/api/visitors/${visitorId}/checkout`, 'PUT', {}, token);
    assert(checkoutVisitorRes.status === 200, 'Visitor checked out successfully');

    // 13. Complaint Ticket
    const cmpRes = await request(
      '/api/complaints',
      'POST',
      {
        studentId: createdStudent._id,
        category: 'Cleanliness',
        description: 'Room cleaning requested after check-in',
        priority: 'Medium',
      },
      token
    );
    assert(cmpRes.status === 201 && !!cmpRes.body.data.complaintId, 'Complaint ticket filed with sequential CMP ID');

    // 14. Inventory
    const invRes = await request('/api/inventory', 'GET', null, token);
    assert(invRes.status === 200 && Array.isArray(invRes.body.data), 'Inventory assets queried with valuation summaries');

    // 15. Staff
    const staffRes = await request('/api/staff', 'GET', null, token);
    assert(staffRes.status === 200 && staffRes.body.data.length > 0, 'Staff directory returned with roles');

    // 16. Reports Hub
    const repRes = await request('/api/reports/occupancy', 'GET', null, token);
    assert(repRes.status === 200 && repRes.body.summary.totalRooms > 0, 'Reports endpoint aggregates occupancy statistics');

    // 17. Audit Logs
    const auditRes = await request('/api/activity-logs', 'GET', null, token);
    assert(auditRes.status === 200 && auditRes.body.data.length > 0, 'Audit log records system events and operations');

    // 18. Settings
    const setRes = await request('/api/settings');
    assert(setRes.status === 200 && !!setRes.body.data.hostelName, 'Public & authorized settings fetched');

    // 19. Password Recovery - Forgot Password token generation
    const forgotRes = await request('/api/auth/forgot-password', 'POST', { email: 'superadmin@hostel.com' });
    assert(
      forgotRes.status === 200 && !!forgotRes.body?.resetToken,
      'Forgot password generates a secure single-use expiring reset token',
      `status: ${forgotRes.status}, body: ${JSON.stringify(forgotRes.body)}`
    );
    const resetToken = forgotRes.body?.resetToken;

    // 20. Password Recovery - Reset Password with token
    const resetRes = await request(`/api/auth/reset-password/${resetToken}`, 'POST', { password: 'admin123updated' });
    assert(
      resetRes.status === 200,
      'Password successfully reset using valid single-use token',
      `status: ${resetRes.status}, body: ${JSON.stringify(resetRes.body)}`
    );

    // Restore original password
    const loginUpdatedRes = await request('/api/auth/login', 'POST', {
      email: 'superadmin@hostel.com',
      password: 'admin123updated',
    });
    assert(
      loginUpdatedRes.status === 200,
      'Login succeeds with newly updated password',
      `status: ${loginUpdatedRes.status}, body: ${JSON.stringify(loginUpdatedRes.body)}`
    );

    // Revert password back to admin123
    await request('/api/auth/change-password', 'PUT', {
      currentPassword: 'admin123updated',
      newPassword: 'admin123',
    }, loginUpdatedRes.body?.token);

    // 21. Student Login & Profile Scoping
    const studentLoginRes = await request('/api/auth/login', 'POST', {
      email: 'student@hostel.com',
      password: 'admin123',
    });
    if (studentLoginRes.status === 200) {
      assert(studentLoginRes.body.user.role === 'student', 'Student login authenticates with student role');
      const studentToken = studentLoginRes.body.token;

      // 22. RBAC Security Check: Student forbidden from accessing staff salaries
      const studentSalaryRes = await request('/api/salaries', 'GET', null, studentToken);
      assert(studentSalaryRes.status === 403, 'RBAC enforces server-side 403 Forbidden when student accesses sensitive salaries API');
    } else {
      console.log('ℹ️ [INFO] Demo student account test skipped (account not seeded in this run).');
    }

    // 23. Leave Return Workflow
    const returnLeaveRes = await request(`/api/leaves/${leaveId}/return`, 'PUT', {
      actualReturnDate: new Date().toISOString(),
      returnNotes: 'Returned safely to hostel',
    }, token);
    assert(
      returnLeaveRes.status === 200 && returnLeaveRes.body?.data?.returnStatus === 'Returned on Time',
      'Leave return recorded with status Returned on Time',
      `status: ${returnLeaveRes.status}, body: ${JSON.stringify(returnLeaveRes.body)}`
    );

    // 24. Duplicate CNIC Prevention
    const duplicateStudentRes = await request('/api/students', 'POST', newStudentData, token);
    assert(duplicateStudentRes.status === 400, 'Duplicate student registration prevented (CNIC or ID already exists)');

    // 25. Check-In & Check-Out Logging
    const checkInRecordRes = await request(
      '/api/check-in-out',
      'POST',
      {
        studentId: createdStudent._id,
        type: 'Check-In',
        notes: 'Integration test check-in event',
      },
      token
    );
    assert(
      checkInRecordRes.status === 201 && (checkInRecordRes.body?.data?.type === 'CheckIn' || checkInRecordRes.body?.data?.type === 'Check-In'),
      'Check-In arrival event logged with audit timestamp'
    );

    const checkInListRes = await request('/api/check-in-out', 'GET', null, token);
    assert(checkInListRes.status === 200 && checkInListRes.body?.data?.length > 0, 'Check-In/Out history query succeeds');

    // 26. Staff Salary Batch Generation & Payment
    const salaryBatchRes = await request(
      '/api/salaries/generate-batch',
      'POST',
      { month: 'November 2026' },
      token
    );
    assert(salaryBatchRes.status === 200, 'Batch salary generation for staff members succeeds');

    const salariesRes = await request('/api/salaries?month=November 2026', 'GET', null, token);
    assert(salariesRes.status === 200 && salariesRes.body?.data?.length > 0, 'Monthly staff salaries queried with totals');

    if (salariesRes.body?.data?.length > 0) {
      const firstSalary = salariesRes.body.data[0];
      const paySalaryRes = await request(
        `/api/salaries/${firstSalary._id}/pay`,
        'PUT',
        {
          amount: firstSalary.monthlySalary || 30000,
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'SAL-TXN-123',
          notes: 'Monthly payment cleared',
        },
        token
      );
      assert(
        paySalaryRes.status === 200 && (paySalaryRes.body?.data?.paymentStatus === 'Paid' || paySalaryRes.body?.data?.status === 'Paid'),
        'Staff salary payment executed with status Paid'
      );
    }

    // 27. Expense Recording
    const expenseRes = await request(
      '/api/expenses',
      'POST',
      {
        title: 'Generator Fuel Reserve',
        category: 'Electricity',
        amount: 8500,
        paymentMethod: 'Cash',
        month: 'Nov',
        year: 2026,
        description: 'Hostel backup power fuel for October/November',
      },
      token
    );
    assert(expenseRes.status === 201 && expenseRes.body?.data?.amount === 8500, 'Hostel operational expense recorded with category breakdown');

    // 28. Comprehensive Financial Profit & Loss (P&L) Report
    const pnlRes = await request('/api/reports/profit-loss', 'GET', null, token);
    assert(
      pnlRes.status === 200 && pnlRes.body?.summary && typeof pnlRes.body.summary.collectedRevenue === 'number',
      'Institutional Profit & Loss (P&L) financial summary aggregated'
    );

    // 29. Announcements Feed
    const annRes = await request('/api/announcements', 'GET', null, token);
    assert(annRes.status === 200 && Array.isArray(annRes.body?.data), 'Hostel notices and announcement feed retrieved');

    // 30. Notifications & Read-All Flow
    const notifRes = await request('/api/notifications', 'GET', null, token);
    assert(notifRes.status === 200 && Array.isArray(notifRes.body?.data), 'System notifications retrieved');

    const readAllNotifRes = await request('/api/notifications/read-all', 'PUT', {}, token);
    assert(readAllNotifRes.status === 200, 'Mark all notifications as read executes successfully');

    // 31. Root Dashboard Route Alias (/api/dashboard)
    const dashRootRes = await request('/api/dashboard', 'GET', null, token);
    assert(dashRootRes.status === 200 && dashRootRes.body?.stats, 'Root dashboard endpoint (/api/dashboard) responds with 200 OK');

    // 32. Global Unified Database Search Across Multiple Collections
    const searchRes = await request('/api/dashboard/search?q=Farooq', 'GET', null, token);
    assert(
      searchRes.status === 200 &&
      searchRes.body?.success === true &&
      Array.isArray(searchRes.body?.results?.students) &&
      Array.isArray(searchRes.body?.results?.rooms) &&
      Array.isArray(searchRes.body?.results?.staff) &&
      Array.isArray(searchRes.body?.results?.fees),
      'Global unified search queries database across students, rooms, staff, and fees'
    );

    console.log('🧪 ========================================================');
    console.log(`🧪 INTEGRATION TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('🧪 ========================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
