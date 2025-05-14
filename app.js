const express = require('express');
const path = require('path');

const app = express();

// Configurar motor de vistas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'vistas')); // <-- ESTA LÍNEA ES LA CORRECTA

// Carpeta pública (estilos, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'publico')));

// Ruta principal
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Módulo de Admisión HIS' });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
