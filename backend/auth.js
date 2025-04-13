const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const SALT_ROUNDS = 12;

module.exports = {
  async loginUser({ username, password }) {
    const user = await User.findOne({ where: { username } });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      token
    };
  },

  async registerUser(userData) {
    const existing = await User.findOne({ where: { username: userData.username } });
    if (existing) throw new Error('Username already exists');

    const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    return await User.create({ ...userData, password_hash });
  }
};