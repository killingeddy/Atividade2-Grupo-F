// db/connections.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const sslConfig = {
  minVersion: "TLSv1.2",
  rejectUnauthorized: false, // aceita certificados públicos do Google
};

const baseConfig = {
  connectTimeout: 20000,
  waitForConnections: true,
  connectionLimit: 5,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: sslConfig,
  authPlugins: {
    mysql_clear_password: () => () => process.env.WRITE_DB_PASSWORD, // compatibilidade com auth GCP
  },
};

const writeDb = {
  ...baseConfig,
  host: process.env.WRITE_DB_HOST,
  port: Number(process.env.WRITE_DB_PORT || 3306),
  user: process.env.WRITE_DB_USER,
  password: process.env.WRITE_DB_PASSWORD,
  database: process.env.WRITE_DB_NAME,
};

const readDb = {
  ...baseConfig,
  host: process.env.READ_DB_HOST,
  port: Number(process.env.READ_DB_PORT || 3306),
  user: process.env.READ_DB_USER,
  password: process.env.READ_DB_PASSWORD,
  database: process.env.READ_DB_NAME,
};

module.exports = { writeDb, readDb };
