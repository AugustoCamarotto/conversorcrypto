const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
    process.env.DB_NAME || "db_crypto_converter",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "Aprojeto#dev",
    {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: false, // Defina como console.log para ver as queries SQL
    }
);

module.exports = sequelize;

