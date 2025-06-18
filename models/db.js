require('dotenv').config();
const mysql = require('mysql2');

const HOST = process.env.MYSQL_HOST || process.env.DB_HOST;
const PORT = process.env.MYSQL_PORT || process.env.DB_PORT || 3306; 
const USER = process.env.MYSQL_USER || process.env.DB_USER;
const PASSWORD = process.env.MYSQL_PASSWORD || process.env.DB_PASS;
const DATABASE = process.env.MYSQL_DATABASE || process.env.DB_NAME;

const pool = mysql.createPool({
  host: HOST,
  port: PORT,
  user: USER,
  password: PASSWORD,
  database: DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  
  enableKeepAlive: true,        
  keepAliveInitialDelay: 10000, 
  timezone: 'local',            
  connectTimeout: 60000,        
  
  
  reconnect: true,
  connectionRetryCount: 3,
  connectionRetryDelay: 3000
});


pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ [DB] Error crítico al conectar:', err.message);
    console.error('❌ [DB] Verifica las variables de entorno:');
    console.error(`❌ [DB] HOST: ${HOST}, PORT: ${PORT}, USER: ${USER}`);
    console.error(`❌ [DB] DATABASE: ${DATABASE}`);
    process.exit(1);
  }
  
  console.log('✅ [DB] Conexión exitosa');
  console.log('✅ [DB] Configuración del pool:');
  console.log(`✅ [DB] Host: ${HOST}, DB: ${DATABASE}`);
  
  
  conn.ping(err => {
    if (err) {
      console.error('❌ [DB] Fallo en ping inicial:', err);
    } else {
      console.log('✅ [DB] Ping exitoso');
    }
    conn.release();
  });
});


pool.on('error', (err) => {
  console.error('❌ [DB] Error en el pool:', err.message);
  console.error('❌ [DB] Código de error:', err.code);
  
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.warn('⚠️ [DB] Reconectando...');
  } else {
    console.error('❌ [DB] Error no manejado');
  }
});

module.exports = pool;

