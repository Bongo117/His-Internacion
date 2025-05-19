const express = require('express');
const router  = express.Router();
const db      = require('../models/db');  


router.get('/admitir', (req, res) => {
  res.render('admitir', { titulo: 'Admitir Paciente' });
});


router.post('/admitir', (req, res) => {
  const { id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada } = req.body;

  const sql = `
    INSERT INTO admision
      (id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada], (err, resultado) => {
    if (err) {
      console.error('❌ Error al registrar admisión:', err);
      return res.status(500).send('Error al registrar la admisión');
    }
    res.send('Admisión registrada correctamente ✅');
  });
});

module.exports = router;
