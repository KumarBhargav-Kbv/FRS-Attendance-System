require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Seeding function
async function autoSeed() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping auto-seeding.');
      return;
    }

    console.log('Database is empty! Starting auto-seeding...');
    const Department = require('./models/Department');
    const Settings = require('./models/Settings');

    // Seed Department
    const department = await Department.create({
      name: 'Computer Science & Engineering (AIML)',
      code: 'CSE-AIML',
      description: 'Department of Computer Science and Engineering (Artificial Intelligence and Machine Learning)',
      hod: 'Dr. M. Nancharaiah'
    });

    // Seed Settings
    await Settings.create([
      { key: 'attendanceThreshold', value: 75, description: 'Minimum attendance percentage required' },
      { key: 'recognitionConfidenceThreshold', value: 60, description: 'Minimum face recognition confidence' },
      { key: 'instituteName', value: 'Sri Vasavi Institute of Engineering & Technology', description: 'Institute name' },
      { key: 'instituteCode', value: 'SVIET', description: 'Institute code' },
      { key: 'maxSessionDuration', value: 120, description: 'Max session duration in minutes' },
      { key: 'lateThresholdMinutes', value: 15, description: 'Late threshold in minutes' }
    ]);

    // Seed Primary Admin Account
    await User.create({
      name: 'SVIET Admin',
      email: 'vasakumarbhargav2@gmail.com',
      password: '99519663@Kb',
      role: 'ADMIN'
    });

    console.log('✅ Auto-seeding completed successfully!');
  } catch (error) {
    console.error('Auto-seed error:', error);
  }
}

// Start database and server
async function startServer() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas');
    await autoSeed();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (atlasError) {
    console.warn('⚠️ Atlas connection failed. Falling back to local in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log(`Connected to memory DB at: ${uri}`);
      await mongoose.connect(uri);
      console.log('✅ In-memory database connection successful!');
      await autoSeed();
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (In-Memory mode)`));
    } catch (memError) {
      console.error('❌ Could not start in-memory database:', memError.message);
      process.exit(1);
    }
  }
}

startServer();
