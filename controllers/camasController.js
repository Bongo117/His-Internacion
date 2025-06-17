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
      const msg = req.query.msg;
      res.render("listar_camas", { 
        titulo: "Listado de Camas", 
        camas, 
        msg,
        bodyClass: "bg-camas" 
      });
    });
  },

  
  mostrarFormularioNuevo: (req, res) => {
    db.query("SELECT * FROM habitacion", (err, habitaciones) => {
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
    db.query(
      'INSERT INTO cama (id_habitacion, numero, estado) VALUES (?, ?, "libre")',
      [id_habitacion, numero],
      (err) => {
        if (err) {
          console.error("Error al crear cama:", err);
          return res.send("Error al crear cama.");
        }
        res.redirect("/camas?msg=Cama creada correctamente");
      }
    );
  },

  
  cambiarEstado: (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.send("⚠️ Debe indicar un estado válido.");
    }
    
    db.query(
      "UPDATE cama SET estado = ? WHERE id_cama = ?",
      [estado, id],
      (err) => {
        if (err) {
          console.error("Error al actualizar estado de cama:", err);
          return res.send("Error al actualizar estado de cama.");
        }
       
        if (["libre", "higienizando"].includes(estado)) {
          const nuevoEstadoAdm = estado === "libre" ? "finalizada" : "cancelada";
          db.query(
            `UPDATE admision
             SET estado = ?
             WHERE id_cama_asignada = ? AND estado = 'activa'`,
            [nuevoEstadoAdm, id],
            (err2) => {
              if (err2) {
                console.error("Error al actualizar admisión tras liberar cama:", err2);
              }
              
              res.redirect(`/camas?msg=Cama puesta "${estado}" y admisión ${nuevoEstadoAdm}`);
            }
          );
        } else {
        
          res.redirect(`/camas?msg=Cama puesta "${estado}"`);
        }
      }
    );
  },


  mostrarFormularioEditar: (req, res) => {
    const { id } = req.params;
    db.query(
      "SELECT * FROM cama WHERE id_cama = ?",
      [id],
      (err, resultados) => {
        if (err || resultados.length === 0) {
          console.error("Error al obtener cama:", err);
          return res.send("Cama no encontrada.");
        }
        res.render("editar_cama", {
          titulo: "Editar Cama",
          cama: resultados[0],
          bodyClass: "bg-camas"
        });
      }
    );
  },


  actualizarCama: (req, res) => {
    const { id } = req.params;
    const { numero, estado } = req.body;
    if (!numero.trim() || !estado.trim()) {
      return res.send("⚠️ Todos los campos son obligatorios.");
    }
    db.query(
      "UPDATE cama SET numero = ?, estado = ? WHERE id_cama = ?",
      [numero, estado, id],
      (err) => {
        if (err) {
          console.error("Error al actualizar cama:", err);
          return res.send("Error al actualizar cama.");
        }
        res.redirect("/camas?msg=Edición de cama guardada");
      }
    );
  }
};
