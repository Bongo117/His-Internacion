require('dotenv').config();
const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

conexion.connect((error) => {
  if (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return;
  }
  console.log('✅ Conectado a la base de datos con éxito');
});

module.exports = conexion;

