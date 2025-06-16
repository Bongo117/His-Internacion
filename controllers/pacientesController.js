const db = require("../models/db");

module.exports = {
  mostrarFormularioNuevo: (req, res) => {
    res.render("pacientes_nuevo", {
      titulo: "Nuevo Paciente",
      bodyClass: "bg-pacientes"
    });
  },

  crearPaciente: (req, res) => {
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
      return res.send("⚠️ Todos los campos son obligatorios.");
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
  },

  listarPacientes: (req, res) => {
    const { buscar } = req.query;
    let sql = 'SELECT * FROM paciente';
    let params = [];

    if (buscar) {
      sql += ' WHERE nombre LIKE ? OR apellido LIKE ?';
      params = [`%${buscar}%`, `%${buscar}%`];
    }

    db.query(sql, params, (err, pacientes) => {
      if (err) {
        console.error("❌ Error al listar pacientes:", err);
        return res.render('listar_pacientes', {
          titulo: "Listado de Pacientes",
          pacientes: [],
          buscar,
          error: "Error al listar pacientes.",
          bodyClass: "bg-pacientes"
        });
      }

      res.render("listar_pacientes", {
        titulo: "Listado de Pacientes",
        pacientes,
        buscar,
        error: null,
        bodyClass: "bg-pacientes"
      });
    });
  },

  mostrarFormularioEditar: (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM paciente WHERE id_paciente = ?';

    db.query(sql, [id], (err, resultados) => {
      if (err || resultados.length === 0) {
        console.error("❌ Error al obtener paciente:", err);
        return res.send("Paciente no encontrado.");
      }

      const paciente = resultados[0];
      res.render("pacientes_editar", {
        titulo: "Editar Paciente",
        paciente,
        bodyClass: "bg-pacientes"
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
      !nombre?.trim() || !apellido?.trim() || !dni?.trim() || !fecha_nacimiento ||
      !sexo || !telefono?.trim() || !direccion?.trim() ||
      !contacto_emergencia?.trim() || !obra_social?.trim() || !nro_afiliado?.trim()
    ) {
      return res.send("⚠️ Todos los campos son obligatorios.");
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

  
    const sqlCheck = `
      SELECT * FROM admision
      WHERE id_paciente = ? AND estado = 'activa'
    `;

    db.query(sqlCheck, [id], (err, admisiones) => {
      if (err) {
        console.error("Error al verificar admisiones:", err);
        return res.redirect("/pacientes?error=Error al verificar restricciones.");
      }

      if (admisiones.length > 0) {
        return res.redirect("/pacientes?error=No se puede eliminar un paciente con admisión activa.");
      }

      const sql = 'DELETE FROM paciente WHERE id_paciente = ?';
      db.query(sql, [id], (err) => {
        if (err) {
          console.error("❌ Error al eliminar paciente:", err);
          return res.redirect("/pacientes?error=Error al eliminar paciente.");
        }
        res.redirect("/pacientes");
      });
    });
  }
};

