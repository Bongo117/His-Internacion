require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST,    
  port:     process.env.MYSQL_PORT,      
  user:     process.env.MYSQL_USER,       
  password: process.env.MYSQL_PASSWORD,   
  database: process.env.MYSQL_DATABASE,   
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Pool de conexiones MySQL inicializado');
  conn.release();
});

module.exports = pool;
