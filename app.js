const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'Vistas'));

app.use(express.static(path.join(__dirname, 'publico')));
app.use(express.urlencoded({ extended: false }));

const authRoutes = require('./Rutas/Auth'); 
const rutaAdmisiones = require('./Rutas/Admisiones');
const rutaPacientes  = require('./Rutas/Pacientes');
const rutaCamas      = require('./Rutas/Camas');

app.use(authRoutes); 
app.use('/', rutaAdmisiones);
app.use('/', rutaPacientes);
app.use('/', rutaCamas);

app.get('/', (req, res) => {
  res.render('index', { titulo: 'Módulo de Admisión HIS' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
