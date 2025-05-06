const { Sequelize } = require("sequelize")
require("dotenv").config()

const assurancesDB = new Sequelize(
  process.env.DB_ASSURANCES_NAME,
  process.env.DB_ASSURANCES_USER,
  process.env.DB_ASSURANCES_PASSWORD,
  {
    host: process.env.DB_ASSURANCES_HOST,
    port: process.env.DB_ASSURANCES_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      ssl:
        process.env.DB_ASSURANCES_SSL === "true"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
)

module.exports = assurancesDB
