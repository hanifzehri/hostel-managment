const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Initialize app
const app = express();

// Connect Database & safe admin bootstrapping
connectDB().then(async () => {
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      if (process.env.AUTO_SEED === 'true') {
        console.log('[AUTO-INIT] 🌟 AUTO_SEED is enabled. Seeding demo records...');
        const { seedDataInternal } = require('./seed/seed');
        await seedDataInternal();
        console.log('[AUTO-INIT] ✅ Turnkey seed completed. Ready for login!');
      } else {
        console.log('[AUTO-INIT] 🌟 Fresh database detected. Creating initial Superadmin without overwriting any collections...');
        await User.create({
          name: 'Hostel Administrator',
          email: 'superadmin@hostel.com',
          password: process.env.INITIAL_ADMIN_PASSWORD || 'admin123',
          role: 'superadmin',
          phone: '+92 300 9876541',
        });
        await User.create({
          name: 'Hostel Staff Admin',
          email: 'admin@hostel.com',
          password: process.env.INITIAL_ADMIN_PASSWORD || 'admin123',
          role: 'admin',
          phone: '+92 333 7891234',
        });
        console.log('[AUTO-INIT] ✅ Initial admin accounts ready (superadmin@hostel.com, admin@hostel.com).');
      }
    }
  } catch (initErr) {
    console.error('[AUTO-INIT] ⚠️ Auto-init error:', initErr.message);
  }
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware & CORS configuration
const defaultOrigins = [
  'https://hostel-managment-khuzdar.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOriginsList = [...defaultOrigins.map((v) => v.replace(/\/+$/, '')), ...envOrigins];

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server, mobile app, health check or curl requests without Origin header
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowedOriginsList.some((allowed) => allowed === cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.endsWith('.onrender.com') ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded assets statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limit on sensitive auth endpoints & general API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Prevent private database and API data from being cached by browsers/proxies
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// API Route Mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/beds', require('./routes/bedRoutes'));
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/check-in-out', require('./routes/checkInOutRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/salaries', require('./routes/salaryRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity-logs', require('./routes/auditRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hostel Management System API is live and operational 🚀',
    version: '1.0.0',
    status: 'online',
    frontend: 'https://hostel-managment-khuzdar.vercel.app',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Hostel Management System API',
  });
});

// Serve frontend production build & PWA if dist directory exists
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// 404 Handler for API
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: [${req.method}] ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[SERVER] 🚀 Hostel Management System API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED_REJECTION]', err);
});

module.exports = app;
