module.exports = {
    development: {
      username: "root",
      password: null,
      database: "employee_tracker",
      host: "127.0.0.1",
      dialect: "sqlite",
      storage: "./database.sqlite",
      logging: console.log,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    test: {
      username: "root",
      password: null,
      database: "employee_tracker_test",
      host: "127.0.0.1",
      dialect: "sqlite",
      storage: ":memory:",
      logging: false
    },
    production: {
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASS || null,
      database: process.env.DB_NAME || "employee_tracker_prod",
      host: process.env.DB_HOST || "127.0.0.1",
      dialect: process.env.DB_DIALECT || "mysql",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 30000
      },
      logging: false
    }
  };