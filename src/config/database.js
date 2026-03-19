const mysql = require('mysql2');
require('dotenv').config();


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false 
  }
});

connection.connect((err) => {
    if (err) {
      console.error(' Kết nối thất bại:', err.stack);
      return;
    }
    console.log(' Kết nối thành công đến MySQL với ID:', connection.threadId);
  });
module.exports = connection;

