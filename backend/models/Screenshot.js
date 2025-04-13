module.exports = (sequelize, DataTypes) => {
    const Screenshot = sequelize.define('Screenshot', {
      filename: {
        type: DataTypes.STRING,
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });
  
    return Screenshot;
  };