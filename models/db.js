require('dotenv').config();
const mysql = require('mysql2');

const HOST     = process.env.MYSQL_HOST     || process.env.DB_HOST;
const PORT     = process.env.MYSQL_PORT     || process.env.DB_PORT;
const USER     = process.env.MYSQL_USER     || process.env.DB_USER;
const PASSWORD = process.env.MYSQL_PASSWORD || process.env.DB_PASS;
const DATABASE = process.env.MYSQL_DATABASE || process.env.DB_NAME;

const pool = mysql.createPool({
  host:               HOST,
  port:               PORT,
  user:               USER,
  password:           PASSWORD,
  database:           DATABASE,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
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

