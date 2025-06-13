const db = require("../models/db");

module.exports = {

  listarCamas: (req, res) => {
    const sql = `
      SELECT c.id_cama, c.numero, c.estado, h.numero AS habitacion
      FROM cama c
      JOIN habitacion h ON c.id_habitacion = h.id_habitacion
      ORDER BY c.id_cama
    `;
    db.query(sql, (err, camas) => {
      if (err) {
        console.error("Error al listar camas:", err);
        return res.send("Error al listar camas");
      }
      res.render("listar_camas", { 
        titulo: "Listado de Camas", 
        camas, 
        bodyClass: "bg-camas" 
      });
    });
  },

  
  mostrarFormularioNuevo: (req, res) => {
    const sql = "SELECT * FROM habitacion";
    db.query(sql, (err, habitaciones) => {
      if (err) {
        console.error("Error al obtener habitaciones:", err);
        return res.send("Error al obtener habitaciones");
      }
      res.render("camas_nuevo", { 
        titulo: "Nueva Cama", 
        habitaciones, 
        bodyClass: "bg-camas" 
      });
    });
  },


  crearCama: (req, res) => {
    const { id_habitacion, numero } = req.body;
    if (!id_habitacion || !numero.trim()) {
      return res.send("⚠️ Todos los campos son obligatorios.");
    }
    const sql = 'INSERT INTO cama (id_habitacion, numero, estado) VALUES (?, ?, "libre")';
    db.query(sql, [id_habitacion, numero], (err) => {
      if (err) {
        console.error("Error al crear cama:", err);
        return res.send("Error al crear cama.");
      }
      res.redirect("/camas");
    });
  },

 
  cambiarEstado: (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.send("⚠️ Debe indicar un estado válido.");
    }
    const sql = "UPDATE cama SET estado = ? WHERE id_cama = ?";
    db.query(sql, [estado, id], (err) => {
      if (err) {
        console.error("Error al actualizar estado de cama:", err);
        return res.send("Error al actualizar estado de cama.");
      }
      res.redirect("/camas");
    });
  },
  mostrarFormularioEditar: (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM cama WHERE id_cama = ?';
  db.query(sql, [id], (err, resultados) => {
    if (err || resultados.length === 0) {
      console.error("Error al obtener cama:", err);
      return res.send("Cama no encontrada.");
    }
    const cama = resultados[0];
    res.render('editar_cama', { titulo: 'Editar Cama', cama, bodyClass: 'bg-camas' });
  });
},

actualizarCama: (req, res) => {
  const { id } = req.params;
  const { numero, estado } = req.body;

  if (!numero.trim() || !estado.trim()) {
    return res.send("⚠️ Todos los campos son obligatorios.");
  }

  const sql = 'UPDATE cama SET numero = ?, estado = ? WHERE id_cama = ?';
  db.query(sql, [numero, estado, id], (err) => {
    if (err) {
      console.error("Error al actualizar cama:", err);
      return res.send("Error al actualizar cama.");
    }
    res.redirect('/camas');
  });
}

};
