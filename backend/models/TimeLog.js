module.exports = (sequelize, DataTypes) => {
    const TimeLog = sequelize.define('TimeLog', {
      status: {
        type: DataTypes.ENUM('working', 'break', 'logged_in', 'offline'),
        allowNull: false
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endTime: DataTypes.DATE,
      workDuration: DataTypes.INTEGER,
      breakDuration: DataTypes.INTEGER,
      breakCount: DataTypes.INTEGER
    });
  
    return TimeLog;
  };