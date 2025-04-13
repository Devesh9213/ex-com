// backend/test-sequelize.js
const { Sequelize } = require('sequelize');

async function testConnection() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './test-db.sqlite', // Creates a new test database
    logging: console.log // Show SQL queries in console
  });

  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Connection successful!');
    
    console.log('Testing model synchronization...');
    await sequelize.sync({ force: true });
    console.log('✓ Tables created successfully!');
    
    await sequelize.close();
    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testConnection();