const express = require('express');
const path = require('path');
const rutaAdmisiones = require('./Rutas/Admisiones');
const rutaPacientes  = require('./Rutas/Pacientes');
const rutaCamas = require('./Rutas/Camas');


const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'vistas'));


app.use(express.static(path.join(__dirname, 'publico')));
app.use(express.urlencoded({ extended: false })); 


app.get('/', (req, res) => {
  res.render('index', { titulo: 'Módulo de Admisión HIS' });
});


app.use('/', rutaAdmisiones);
app.use('/', rutaPacientes);
app.use('/', rutaCamas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
