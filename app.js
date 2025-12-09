require('dotenv').config();              
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();


app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  resave: false,
  saveUninitialized: true
}));


app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));


const authRoutes       = require('./routes/Auth');
const admisionesRoutes = require('./routes/Admisiones');
const pacientesRoutes  = require('./routes/Pacientes');
const camasRoutes      = require('./routes/Camas');
const evaluacionesRoutes = require('./routes/Evaluaciones');
const habitacionesRoutes = require('./routes/Habitaciones');

app.get('/', (req, res) => {
  res.render('index', { titulo: 'Módulo de Admisión HIS' });
});

app.use('/auth',      authRoutes);
app.use('/',          admisionesRoutes);
app.use('/pacientes', pacientesRoutes);
app.use('/camas',     camasRoutes);
app.use('/evaluaciones', evaluacionesRoutes);
app.use('/habitaciones', habitacionesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});
