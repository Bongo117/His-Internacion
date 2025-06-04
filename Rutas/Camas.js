const express = require('express');
const router = express.Router();
const db = require('../modelos/db');

router.get('/camas', (req, res) => {
  const sql = `
    SELECT c.id_cama, c.numero, c.estado, h.numero AS habitacion
    FROM cama c
    JOIN habitacion h ON c.id_habitacion = h.id_habitacion
    ORDER BY c.id_cama
  `;
  db.query(sql, (err, camas) => {
    if (err) return res.send('Error al listar camas');
    res.render('listar_camas', { titulo: 'Listado de Camas', camas });
  });
});

router.get('/camas/nuevo', (req, res) => {
  const sql = 'SELECT * FROM habitacion';
  db.query(sql, (err, habitaciones) => {
    if (err) return res.send('Error al obtener habitaciones');
    res.render('camas_nuevo', { titulo: 'Nueva Cama', habitaciones });
  });
});

router.post('/camas/nuevo', (req, res) => {
  const { id_habitacion, numero } = req.body;
  const sql = 'INSERT INTO cama (id_habitacion, numero, estado) VALUES (?, ?, "libre")';
  db.query(sql, [id_habitacion, numero], (err) => {
    if (err) {
      console.error('Error al crear cama:', err);
      return res.send('Error al crear cama.');
    }
    res.redirect('/camas');
  });
});

router.post('/camas/estado/:id', (req, res) => {
  const { estado } = req.body;
  const sql = 'UPDATE cama SET estado = ? WHERE id_cama = ?';
  db.query(sql, [estado, req.params.id], (err) => {
    if (err) {
      console.error('Error al actualizar estado de cama:', err);
      return res.send('Error al actualizar estado de cama.');
    }
    res.redirect('/camas');
  });
});

module.exports = router;
