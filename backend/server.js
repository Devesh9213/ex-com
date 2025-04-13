const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize, User, Session, TimeLog, Screenshot } = require('./models');
const { Op } = require('sequelize');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'app://electron'],
    credentials: true
  }
});

const PORT = 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
const SALT_ROUNDS = 10;

const liveUsers = new Map();

// WebSocket setup
// WebSocket setup
io.on('connection', (socket) => {
  console.log('🟢 WebSocket connected:', socket.id);

  socket.on('user-online', (data) => {
    // Remove any previous entries with same user.id
    for (const [sockId, user] of liveUsers.entries()) {
      if (user.id === data.id) {
        liveUsers.delete(sockId);
      }
    }

    liveUsers.set(socket.id, { ...data, time: new Date() });
    io.emit('live-users', Array.from(liveUsers.values()));
  });

  socket.on('status-update', (data) => {
    // Find and update the correct user by ID
    for (const [sockId, user] of liveUsers.entries()) {
      if (user.id === data.id) {
        liveUsers.set(sockId, {
          ...user,
          status: data.status,
          time: new Date()
        });
        break;
      }
    }

    io.emit('live-users', Array.from(liveUsers.values()));
  });

  socket.on('disconnect', () => {
    liveUsers.delete(socket.id);
    io.emit('live-users', Array.from(liveUsers.values()));
    console.log('🔴 Disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'app://electron'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// ✅ Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const session = await Session.findOne({ where: { token } });
    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// DB Initialization
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync();

    const adminCount = await User.count();
    if (adminCount === 0) {
      await User.create({
        username: 'admin',
        password: await bcrypt.hash('admin123', SALT_ROUNDS),
        role: 'admin'
      });
      console.log('👤 Admin user created');
    }
  } catch (error) {
    console.error('❌ DB Init Failed:', error);
    throw error;
  }
};

// Auth routes
app.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'employee' } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, password: hashedPassword, role });
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '8h' });
    await Session.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 8 * 3600000)
    });

    await TimeLog.create({ userId: user.id, status: 'logged_in', startTime: new Date() });

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time logs
app.post('/time-logs', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['working', 'break', 'logged_in', 'offline'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const previousLog = await TimeLog.findOne({
      where: { userId: req.user.id, endTime: null },
      order: [['startTime', 'DESC']]
    });

    if (previousLog) {
      const duration = Math.floor((new Date() - previousLog.startTime) / 1000);
      if (previousLog.status === 'working') previousLog.workDuration = duration;
      else if (previousLog.status === 'break') previousLog.breakDuration = duration;

      previousLog.endTime = new Date();
      await previousLog.save();
    }

    const newLog = await TimeLog.create({
      userId: req.user.id,
      status,
      startTime: new Date()
    });

    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes
app.get('/admin/employees', authenticate, requireAdmin, async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: ['id', 'username', 'createdAt'],
      include: [{
        model: TimeLog,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('workDuration')), 'totalWork'],
          [sequelize.fn('SUM', sequelize.col('breakDuration')), 'totalBreak'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions']
        ]
      }],
      group: ['User.id']
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/employee/:id/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await TimeLog.findAll({
      where: { userId: id },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('startTime')), 'date'],
        [sequelize.literal('ROUND(SUM(workDuration)/3600, 2)'), 'totalHours'],
        [sequelize.literal('ROUND(SUM(breakDuration)/60, 2)'), 'totalBreakMinutes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sessions']
      ],
      group: [sequelize.fn('DATE', sequelize.col('startTime'))],
      order: [[sequelize.fn('DATE', sequelize.col('startTime')), 'DESC']]
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start && end) {
      where.startTime = {
        [Op.between]: [new Date(start), new Date(end)]
      };
    }

    const logs = await TimeLog.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'createdAt'],
        where: { role: 'employee' },
        required: true
      }],
      attributes: [
        'userId',
        [sequelize.fn('SUM', sequelize.col('workDuration')), 'totalHours'],
        [sequelize.fn('SUM', sequelize.col('breakDuration')), 'totalBreakMinutes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sessions']
      ],
      group: ['userId', 'User.id']
    });

    const data = logs.map(log => ({
      id: log.User.id,
      username: log.User.username,
      createdAt: log.User.createdAt,
      totalHours: log.dataValues.totalHours / 3600,
      totalBreakMinutes: log.dataValues.totalBreakMinutes / 60,
      sessions: log.dataValues.sessions
    }));

    res.json(data);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
(async () => {
  try {
    await initializeDatabase();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();
