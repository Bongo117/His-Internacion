const db = require("../models/db");

module.exports = {
  
  mostrarFormularioNuevo: (req, res) => {
    res.render("pacientes_nuevo", {
      titulo: "Nuevo Paciente",
      bodyClass: "bg-pacientes",
    });
  },


  crearPaciente: (req, res) => {
    const {
      nombre, apellido, dni, fecha_nacimiento,
      sexo, telefono, direccion, contacto_emergencia,
      obra_social, nro_afiliado
    } = req.body;

    if (
      !nombre?.trim() || !apellido?.trim() || !dni?.trim() ||
      !fecha_nacimiento || !sexo || !telefono?.trim() ||
      !direccion?.trim() || !contacto_emergencia?.trim() ||
      !obra_social?.trim() || !nro_afiliado?.trim()
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
        console.error("❌ Error al crear paciente:", err);
        return res.send("❌ Error al crear paciente.");
      }
      res.redirect("/pacientes");
    });
  },

 
  listarPacientes: (req, res) => {
    const sql = "SELECT * FROM paciente ORDER BY apellido, nombre";
    db.query(sql, (err, pacientes) => {
      if (err) {
        console.error("Error al listar pacientes:", err);
        return res.send("Error al listar pacientes");
      }
      res.render("listar_pacientes", {
        titulo: "Listado de Pacientes",
        pacientes,
        bodyClass: "bg-pacientes",
      });
    });
  },

  
  mostrarFormularioEditar: (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM paciente WHERE id_paciente = ?";
    db.query(sql, [id], (err, resultados) => {
      if (err || resultados.length === 0) {
        console.error("❌ Error al obtener paciente:", err);
        return res.send("Paciente no encontrado.");
      }
      res.render("pacientes_editar", {
        titulo: "Editar Paciente",
        paciente: resultados[0],
        bodyClass: "bg-pacientes",
      });
    });
  },


  editarPaciente: (req, res) => {
    const { id } = req.params;
    const {
      nombre, apellido, dni, fecha_nacimiento,
      sexo, telefono, direccion, contacto_emergencia,
      obra_social, nro_afiliado
    } = req.body;

    if (
      !nombre?.trim() || !apellido?.trim() || !dni?.trim() ||
      !fecha_nacimiento || !sexo || !telefono?.trim() ||
      !direccion?.trim() || !contacto_emergencia?.trim() ||
      !obra_social?.trim() || !nro_afiliado?.trim()
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
        console.error("❌ Error al actualizar paciente:", err);
        return res.send("Error al actualizar paciente.");
      }
      res.redirect("/pacientes");
    });
  },

  eliminarPaciente: (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM paciente WHERE id_paciente = ?";
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("❌ Error al eliminar paciente:", err);
        return res.send("Error al eliminar paciente.");
      }
      res.redirect("/pacientes");
    });
  }
};
