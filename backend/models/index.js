// backend/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(config.development);

const defineModel = (modelDefiner) => {
  return modelDefiner(sequelize, DataTypes);
};

const User = defineModel(require('./User'));
const Session = defineModel(require('./Session'));
const TimeLog = defineModel(require('./TimeLog'));
const Screenshot = defineModel(require('./Screenshot'));

// Define relationships here...

module.exports = {
  sequelize,
  User,
  Session,
  TimeLog,
  Screenshot
};