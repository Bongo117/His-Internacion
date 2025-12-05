require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '127.0.0.1',      // Forzamos IP para evitar conflictos de Windows
  user: 'root',
  password: '',           // <--- CLAVE VACÍA (La acabamos de limpiar)
  database: 'his_internacion',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Error DB:', err.message);
  } else {
    console.log('✅ Conectado a BD (Modo Desarrollo Local)');
    conn.release();
  }
});

module.exports = pool;