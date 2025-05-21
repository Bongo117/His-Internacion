const express = require('express');
const router  = express.Router();
const db      = require('../modelos/db');


router.get('/pacientes/nuevo', (req, res) => {
  res.render('pacientes_nuevo', { titulo: 'Nuevo Paciente' });
});


router.post('/pacientes/nuevo', (req, res) => {
  const {
    nombre, apellido, dni, fecha_nacimiento,
    sexo, telefono, direccion, contacto_emergencia,
    obra_social, nro_afiliado
  } = req.body;

  const sql = `
    INSERT INTO paciente
    (nombre, apellido, dni, fecha_nacimiento, sexo, telefono, direccion, contacto_emergencia, obra_social, nro_afiliado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    nombre, apellido, dni, fecha_nacimiento,
    sexo, telefono, direccion, contacto_emergencia,
    obra_social, nro_afiliado
  ];

  db.query(sql, valores, (err) => {
    if (err) {
      console.error('❌ Error al crear paciente:', err);
      return res.send('Error al crear paciente.');
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