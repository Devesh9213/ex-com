module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  return Session;
};