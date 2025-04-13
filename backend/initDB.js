require('dotenv').config();
const db = require('./models');

async function initialize() {
  try {
    // Test connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models
    await db.sequelize.sync({ force: true });
    console.log('🔄 All models synchronized');
    
    // Create admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.User.create({
      username: 'admin',
      password_hash: hashedPassword,
      full_name: 'Admin User',
      role: 'admin'
    });
    console.log('👤 Admin user created');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

initialize();