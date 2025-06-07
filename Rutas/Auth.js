const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
});


router.get('/login', (req, res) => {
  res.render('login', { titulo: 'Login' });
});


router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    req.session.user = username;
    res.redirect('/'); 
  } else {
    res.render('login', { titulo: 'Login', error: '⚠️ Usuario o contraseña incorrectos' });
  }
});


router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.send('Error al cerrar sesión.');
    }
    res.redirect('/login');
  });
});

module.exports = router;
