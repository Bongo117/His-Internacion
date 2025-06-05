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
  if (
  !nombre?.trim() || !apellido?.trim() || !dni?.trim() || !fecha_nacimiento ||
  !sexo || !telefono?.trim() || !direccion?.trim() ||
  !contacto_emergencia?.trim() || !obra_social?.trim() || !nro_afiliado?.trim()
) {
  return res.send("⚠️ Todos los campos son obligatorios. Por favor, completalos.");
}

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
      return res.send('❌ Error al crear paciente.');
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


router.get('/pacientes/editar/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM paciente WHERE id_paciente = ?';
  db.query(sql, [id], (err, resultados) => {
    if (err || resultados.length === 0) {
      console.error('❌ Error al obtener paciente:', err);
      return res.send('Paciente no encontrado.');
    }
    const paciente = resultados[0];
    res.render('pacientes_editar', { titulo: 'Editar Paciente', paciente });
  });
});


router.post('/pacientes/editar/:id', (req, res) => {
  const { id } = req.params;
  const {
    nombre, apellido, dni, fecha_nacimiento,
    sexo, telefono, direccion, contacto_emergencia,
    obra_social, nro_afiliado
  } = req.body;
  if (
    !nombre?.trim() || !apellido?.trim() || !dni?.trim() || !fecha_nacimiento ||
    !sexo || !telefono?.trim() || !direccion?.trim() ||
    !contacto_emergencia?.trim() || !obra_social?.trim() || !nro_afiliado?.trim()
  ) {
    return res.send("⚠️ Todos los campos son obligatorios. Por favor, completalos.");
  }

  const sql = `
    UPDATE paciente SET
      nombre = ?, apellido = ?, dni = ?, fecha_nacimiento = ?, sexo = ?,
      telefono = ?, direccion = ?, contacto_emergencia = ?, obra_social = ?, nro_afiliado = ?
    WHERE id_paciente = ?
  `;

  const valores = [
    nombre, apellido, dni, fecha_nacimiento,
    sexo, telefono, direccion, contacto_emergencia,
    obra_social, nro_afiliado, id
  ];

  db.query(sql, valores, (err) => {
    if (err) {
      console.error('❌ Error al actualizar paciente:', err);
      return res.send('Error al actualizar paciente.');
    }
    res.redirect('/pacientes');
  });
});


router.post('/pacientes/eliminar/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM paciente WHERE id_paciente = ?';
  db.query(sql, [id], (err) => {
    if (err) {
      console.error('❌ Error al eliminar paciente:', err);
      return res.send('Error al eliminar paciente.');
    }
    res.redirect('/pacientes');
  });
});

module.exports = router;
