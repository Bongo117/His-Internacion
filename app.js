const rutaAdmisiones = require('./Rutas/Admisiones');

const express = require('express');
const path = require('path');

const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'vistas')); 


app.use(express.static(path.join(__dirname, 'publico')));


app.get('/', (req, res) => {
  res.render('index', { titulo: 'Módulo de Admisión HIS' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

app.use('/', rutaAdmisiones);

app.use(express.urlencoded({ extended: false }));
