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
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

const authRoutes       = require('./routes/Auth');
const admisionesRoutes = require('./routes/Admisiones');
const pacientesRoutes  = require('./routes/Pacientes');
const camasRoutes      = require('./routes/Camas');

app.use('/auth',      authRoutes);
app.use('/',          admisionesRoutes);
app.use('/pacientes', pacientesRoutes);
app.use('/camas',     camasRoutes);

app.get('/', (req, res) => {
  res.render('index', { titulo: 'Módulo de Admisión HIS' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
