const express = require('express');
const router = express.Router();

// Ruta principal /admitir
router.get('/admitir', (req, res) => {
  res.render('admitir', { titulo: 'Admitir Paciente' });
});

module.exports = router;
