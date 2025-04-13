const db = require('./backend/models');

async function test() {
  try {
    // Test connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test query
    const users = await db.User.findAll();
    console.log(`📊 Found ${users.length} users`);
    
    // Check admin exists
    const admin = await db.User.findOne({ where: { username: 'admin' } });
    console.log(admin ? '✅ Admin user exists' : '❌ Admin user missing');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.sequelize.close();
    process.exit();
  }
}

test();
