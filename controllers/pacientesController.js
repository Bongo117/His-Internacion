const db = require("../models/db");

module.exports = {
  mostrarFormularioNuevo: (req, res) => {
    res.render("pacientes_nuevo", {
      titulo: "Nuevo Paciente",
      bodyClass: "bg-pacientes"
    });
  },

  crearPaciente: async (req, res) => {
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

    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const sql = `
        INSERT INTO paciente
        (nombre, apellido, dni, fecha_nacimiento, sexo, telefono, direccion, 
         contacto_emergencia, obra_social, nro_afiliado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const valores = [
        nombre, apellido, dni, fecha_nacimiento,
        sexo, telefono, direccion, contacto_emergencia,
        obra_social, nro_afiliado
      ];

      await connection.promise().query(sql, valores);
      res.redirect("/pacientes");
    } catch (err) {
      console.error("❌ Error al crear paciente:", err);
      res.send("❌ Error al crear paciente.");
    } finally {
      if (connection) connection.release();
    }
  },

  listarPacientes: async (req, res) => {
    const { buscar, error } = req.query;
    let sql = 'SELECT * FROM paciente';
    let params = [];

    if (buscar) {
      sql += ' WHERE nombre LIKE ? OR apellido LIKE ?';
      params = [`%${buscar}%`, `%${buscar}%`];
    }

    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const [pacientes] = await connection.promise().query(sql, params);
      
      res.render("listar_pacientes", {
        titulo: "Listado de Pacientes",
        pacientes,
        buscar,
        error: error || null,
        bodyClass: "bg-pacientes"
      });
    } catch (err) {
      console.error("❌ Error al listar pacientes:", err);
      res.render("listar_pacientes", {
        titulo: "Listado de Pacientes",
        pacientes: [],
        buscar,
        error: "Error al listar pacientes.",
        bodyClass: "bg-pacientes"
      });
    } finally {
      if (connection) connection.release();
    }
  },

  mostrarFormularioEditar: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const [resultados] = await connection.promise().query(
        'SELECT * FROM paciente WHERE id_paciente = ?',
        [id]
      );

      if (resultados.length === 0) {
        return res.send("Paciente no encontrado.");
      }

      res.render("pacientes_editar", {
        titulo: "Editar Paciente",
        paciente: resultados[0],
        bodyClass: "bg-pacientes"
      });
    } catch (err) {
      console.error("❌ Error al obtener paciente:", err);
      res.send("Paciente no encontrado.");
    } finally {
      if (connection) connection.release();
    }
  },

  editarPaciente: async (req, res) => {
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

    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const sql = `
        UPDATE paciente SET
          nombre = ?, apellido = ?, dni = ?, fecha_nacimiento = ?, sexo = ?,
          telefono = ?, direccion = ?, contacto_emergencia = ?, 
          obra_social = ?, nro_afiliado = ?
        WHERE id_paciente = ?
      `;

      const valores = [
        nombre, apellido, dni, fecha_nacimiento,
        sexo, telefono, direccion, contacto_emergencia,
        obra_social, nro_afiliado, id
      ];

      await connection.promise().query(sql, valores);
      res.redirect("/pacientes");
    } catch (err) {
      console.error("❌ Error al actualizar paciente:", err);
      res.send("Error al actualizar paciente.");
    } finally {
      if (connection) connection.release();
    }
  },

  listarAdmisionesDePaciente: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const sql = `
        SELECT 
          a.id_admision,
          DATE_FORMAT(a.fecha_admision, '%d/%m/%Y') AS fecha_admision,
          a.motivo,
          a.tipo_ingreso,
          a.estado,
          c.numero AS nro_cama,
          h.numero AS nro_habitacion
        FROM admision a
        JOIN cama c ON a.id_cama_asignada = c.id_cama
        JOIN habitacion h ON c.id_habitacion = h.id_habitacion
        WHERE a.id_paciente = ?
        ORDER BY a.fecha_admision DESC
      `;
      
      const [admisiones] = await connection.promise().query(sql, [id]);
      
      res.render("paciente_admisiones", {
        titulo: `Admisiones de Paciente #${id}`,
        admisiones,
        pacienteId: id,
        bodyClass: "bg-admisiones"
      });
    } catch (err) {
      console.error("❌ Error al obtener admisiones de paciente:", err);
      res.send("Error al cargar las admisiones.");
    } finally {
      if (connection) connection.release();
    }
  },
  
  eliminarPaciente: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // Verificar admisiones activas
      const [admisiones] = await connection.promise().query(
        `SELECT * FROM admision
         WHERE id_paciente = ? AND estado = 'activa'`,
        [id]
      );

      if (admisiones.length > 0) {
        return res.redirect("/pacientes?error=No se puede eliminar un paciente con admisión activa.");
      }

      // Eliminar paciente
      await connection.promise().query(
        'DELETE FROM paciente WHERE id_paciente = ?',
        [id]
      );

      res.redirect("/pacientes");
    } catch (err) {
      console.error("❌ Error al eliminar paciente:", err);
      res.redirect("/pacientes?error=Error al eliminar paciente.");
    } finally {
      if (connection) connection.release();
    }
  }
};