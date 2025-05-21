const express = require('express');
const router  = express.Router();
const db      = require('../modelos/db');


router.get('/pacientes/nuevo', (req, res) => {
  res.render('pacientes_nuevo', { titulo: 'Nuevo Paciente' });
});


router.post('/pacientes/nuevo', (req, res) => {
  const { nombre, apellido, dni, fecha_nacimiento, sexo } = req.body;
  const sql = `
    INSERT INTO paciente
      (nombre, apellido, dni, fecha_nacimiento, sexo)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [nombre, apellido, dni, fecha_nacimiento, sexo], (err) => {
    if (err) {
      console.error('Error al crear paciente:', err);
      return res.send('Error al crear paciente');
    }
    res.redirect('/pacientes');  
  });
});


router.get('/pacientes', (req, res) => {
  db.query('SELECT * FROM paciente', (err, pacientes) => {
    if (err) return res.send('Error al listar pacientes');
    res.render('listar_pacientes', { titulo: 'Listado de Pacientes', pacientes });
  });
});

module.exports = router;