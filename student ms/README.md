# 🏢 Professional Hostel Management System (Full-Stack)

A complete, production-grade, enterprise-ready **Hostel Management System** built with **React 19**, **Tailwind CSS v4**, **Node.js/Express.js**, and **MongoDB / Mongoose**. Designed with an admin dashboard UI, real-time analytics, role-based access control (RBAC), printable student ID cards with secure QR code verification, financial fee vouchers, daily attendance, check-in/out inspections, complaints, visitors, and immutable audit logs.

---

## 🌟 Key Modules & Features

1. **Dashboard & Real-Time Analytics:**
   - Real-time MongoDB metrics (Total Students, Active Residents, Occupancy %, Vacant Beds, Available Rooms, Fee Collections, Pending Dues, Today's Attendance, Open Complaints, Today's Visitors).
   - Recharts visual data: Monthly Fee Collections (Bar Chart), Block Occupancy Distribution, Admissions Velocity, and Today's Attendance donut breakdown.
   - Live announcement notices and recent activity audit feed.

2. **Student Management & Admissions:**
   - Personal info (CNIC/B-Form, blood group, emergency contacts), educational details (University, Degree, Semester), and hostel records.
   - Document attachment tracking.
   - Admission workflow with auto-generated sequential IDs (`STU-2026-0001`, `HOST-2026-0001`).
   - Bed auto-allocation with strict double-booking prevention.

3. **10-Tab Comprehensive Student Profile:**
   - Tabs: **Overview**, **Personal**, **Hostel**, **Fees**, **Attendance**, **Visitors**, **Complaints**, **Leave**, **Documents**, and **Activity History**.

4. **Printable Student ID Card & Public QR Verification:**
   - CR80 standard printable student ID cards with institutional branding, photo, barcode styling, and secure QR code.
   - Flip front/back view with hostel rules and emergency contacts.
   - Single-click print or bulk print generation for all students.
   - Public QR verification page (`/verify/:token`) allowing wardens and gate security to verify resident validity without exposing private credentials.

5. **Room & Bed Management:**
   - Visual block and room layout (Single, Double, Triple, 4-Bed).
   - Real-time room capacity calculation and visual occupancy badges.
   - Individual bed level management (Assign, Vacate, Maintenance, Reserved).
   - Strict database & business validation preventing duplicate student assignments.

6. **Check-In & Check-Out Inspection Workflow:**
   - Check-in logging with timestamp and staff supervisor.
   - Formal check-out workflow: clearance of outstanding fee dues, room condition inspection checklist, room key & hostel property returns, automatic bed status release, and student deactivation without destroying audit or financial history.

7. **Fee Management & Printable Vouchers:**
   - Invoicing for Hostel Rent, Mess, Security Deposit, Utilities, and Maintenance.
   - Status tracking: Paid, Partial, Pending, Overdue.
   - Payment recording (Cash, Bank Transfer, Online) with automatic remaining balance calculations.
   - 1-Click Bulk Monthly Invoicing for all active residents.
   - Official printable fee receipt vouchers with student copy & office copy.

8. **Daily & Monthly Attendance:**
   - Date picker, fast status selectors (Present, Absent, Late, Leave).
   - "Mark All Present" 1-click batch workflow.
   - Monthly attendance percentage tracking.

9. **Leave Requests & Visitor Management:**
   - Student leave requests with emergency contact and destination. Warden approval/rejection notes.
   - Gate visitor register with CNIC, relationship, time-in, and instant time-out checkout.

10. **Complaints, Inventory & Staff Directory:**
    - Ticket management by category (Electrical, Plumbing, Mess, Cleanliness, Wi-Fi), priority, and staff assignment.
    - Hostel assets tracking with valuation, room placement, and maintenance condition.
    - Staff personnel directory with roles, CNIC, and contact details.

11. **Institutional Reports Hub & Export:**
    - Instant CSV export and formatted printable reports for:
      - Student Registry
      - Room Occupancy & Bed Capacity
      - Financial Fee Collections & Outstanding Dues
      - Daily Attendance Roster
      - Gate Visitor Logs & Student Complaints

12. **Role-Based Access Control (RBAC):**
    - 6 predefined enterprise roles:
      - **Super Admin:** Complete access across all system modules and configuration.
      - **Admin:** Student records, rooms, beds, admissions, and reports.
      - **Warden:** Student directory, rooms, attendance, visitors, complaints, leaves.
      - **Accountant:** Fees, payments, invoices, vouchers, and financial summaries.
      - **Receptionist:** Front-desk admissions, student lookup, and visitor registration.
      - **Security:** Gate visitor checks, resident QR verification, check-in/out monitoring.

13. **Security & Audit Logs:**
    - Password hashing using bcrypt.
    - JWT bearer token authentication with protected route wrappers.
    - Rate-limiting on authentication endpoints.
    - Immutable activity audit log recording user, IP, action, and timestamp.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + Modern Glassmorphic CSS Design System
- **Icons:** Lucide React
- **Charts:** Recharts
- **QR Codes:** QRCode.react
- **Routing:** React Router v7
- **HTTP Client:** Axios with JWT request interceptors

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcrypt
- **Security:** Helmet, CORS, Express Rate Limit, Multer file type & size validation
- **Zero-Friction DB Support:** Automated fallback to `mongodb-memory-server` if local MongoDB is not running, ensuring instant turnkey operation.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18 or newer installed on your machine.
- **MongoDB:** (Optional) Local MongoDB running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI. If not installed, the system automatically starts an in-memory MongoDB instance out of the box!

### 2. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Start the backend server
node src/server.js
# Or in development with auto-reload:
npm run dev
```
The backend starts on `http://127.0.0.1:5000`.

### 3. Frontend Setup & Startup
```powershell
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the frontend dev server
npm run dev
```
Open `http://localhost:5173` (or the displayed Vite local URL) in your browser.

---

## 🔑 Default Seed Login Accounts

All seed accounts use the default password: **`admin123`**

| Role | Email | Password | Allowed Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@hostel.com` | `admin123` | Full Access (All modules + Settings + Logs) |
| **Admin** | `admin@hostel.com` | `admin123` | Students, Rooms, Beds, Admissions, Reports |
| **Warden** | `warden@hostel.com` | `admin123` | Students, Rooms, Attendance, Visitors, Complaints, Leaves |
| **Accountant** | `accountant@hostel.com` | `admin123` | Fees, Invoices, Payments, Receipts, Reports |
| **Receptionist** | `receptionist@hostel.com` | `admin123` | Admissions, Students, Visitors, Check-In/Out |
| **Security** | `security@hostel.com` | `admin123` | Visitors, QR Verification, Gate Check-In/Out |

> **Pro Tip:** The Login page features quick-fill buttons for all 6 demo roles for instant 1-click testing!

---

## 📊 Database Seeding

To re-seed or populate sample data manually:
```powershell
cd backend
npm run seed
```
This populates:
- 6 Role accounts with hashed passwords
- 7 Rooms across 2 Blocks with 16 individual Beds
- 5 Student profiles with complete personal, educational, and hostel data
- Fee invoices & partial/full payment records
- Daily attendance sheets
- Leave requests, gate visitors, and maintenance tickets
- Staff directory & hostel inventory
- System identity and institutional settings

---

## 🧪 Automated Integration Tests

A full end-to-end integration test suite is included in the backend:
```powershell
cd backend
npm test
# Or:
node test-e2e.js
```
The test suite validates:
- Authentication & JWT token issuance
- Dashboard aggregation queries
- Double-bed assignment prevention
- Sequential ID generation (`STU`, `HOST`, `INV`, `CMP`)
- Public QR token verification
- Payment reconciliation
- Bulk attendance marking
- Leave workflow approval
- Gate visitor check-in/out
- Asset queries & reports generation
- Immutable audit log entry creation

---

## 📁 Project Structure

```
student ms/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection with memory-server fallback
│   │   ├── controllers/     # 18 Modular business logic controllers
│   │   ├── middleware/      # Auth, RBAC, error handling, upload
│   │   ├── models/          # 17 Mongoose schemas with validation
│   │   ├── routes/          # RESTful route definitions
│   │   ├── seed/            # Comprehensive seed generator
│   │   ├── utils/           # ID generator, audit logger
│   │   └── server.js        # Express application entry & auto-bootstrapper
│   ├── test-e2e.js          # Automated 21-step integration test suite
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios instance with auth interceptors
    │   ├── components/
    │   │   ├── layout/      # Sidebar, Navbar, App Layout
    │   │   └── ui/          # Button, Modal, Card, Badge, StatCard, etc.
    │   ├── context/         # Auth, Theme, Notification, Hostel contexts
    │   ├── pages/           # 18 Production-ready views (Dashboard, Students, Profile, Fees, etc.)
    │   ├── App.jsx          # Protected route declarations
    │   ├── main.jsx         # App mounting
    │   └── index.css        # Tailwind CSS v4 styling & dark theme tokens
    ├── vite.config.js       # Vite configuration with API reverse proxy
    └── package.json
```

---

## 📝 License
Built for educational, institutional, and commercial hostel management applications.


## Security and setup notes

- Copy `backend/.env.example` to `backend/.env` and set a unique, long random `JWT_SECRET` before starting the API. Never commit or share `.env` files.
- Set `FRONTEND_URL` to the exact trusted frontend origin(s). In production, do not use wildcard CORS origins. Multiple trusted origins may be comma-separated.
- Production startup requires a reachable persistent MongoDB. The temporary in-memory database fallback is development-only and its data is not durable.
- Before production use, configure HTTPS, backups and restore drills, least-privilege database credentials, and test role permissions with separate accounts.
- This archive intentionally excludes installed dependency folders and private environment files. Run `npm install` in each app folder to restore dependencies.
