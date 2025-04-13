'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const salt = await bcrypt.genSalt(10);
    
    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      password_hash: await bcrypt.hash('admin123', salt),
      full_name: 'Administrator',
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { username: 'admin' }, {});
  }
};