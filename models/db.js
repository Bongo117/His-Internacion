const mysql = require('mysql2');


const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'root',             
  password: '',             
  database: 'his_internacion' 
});


conexion.connect((error) => {
  if (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return;
  }
  console.log('✅ Conexión exitosa a la base de datos his_internacion');
});

module.exports = conexion;
