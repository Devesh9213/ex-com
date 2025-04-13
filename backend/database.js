const { Sequelize } = require('sequelize');
const config = require('./config/config');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log,
  define: {
    timestamps: true,       // Adds createdAt and updatedAt automatically
    underscored: true,      // Uses snake_case for column names
    freezeTableName: true   // Prevents pluralization of table names
  }
});

// Test connection
sequelize.authenticate()
  .then(() => console.log('Database connection established.'))
  .catch(err => console.error('Database connection failed:', err));

module.exports = sequelize;