const db = require("../models/db");

module.exports = {
  listarCamas: async (req, res) => {
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const sql = `
        SELECT c.id_cama, c.numero, c.estado, h.numero AS habitacion
        FROM cama c
        JOIN habitacion h ON c.id_habitacion = h.id_habitacion
        ORDER BY c.id_cama
      `;

      const [camas] = await connection.promise().query(sql);
      
      const msg = req.query.msg;
      res.render("listar_camas", { 
        titulo: "Listado de Camas", 
        camas, 
        msg,
        bodyClass: "bg-camas" 
      });
    } catch (err) {
      console.error("Error al listar camas:", err);
      res.send("Error al listar camas");
    } finally {
      if (connection) connection.release();
    }
  },

  mostrarFormularioNuevo: async (req, res) => {
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const [habitaciones] = await connection.promise().query("SELECT * FROM habitacion");
      
      res.render("camas_nuevo", { 
        titulo: "Nueva Cama", 
        habitaciones: habitaciones,
        bodyClass: "bg-camas" 
      });
    } catch (err) {
      console.error("Error al obtener habitaciones:", err);
      res.send("Error al obtener habitaciones");
    } finally {
      if (connection) connection.release();
    }
  },

  crearCama: async (req, res) => {
    const { id_habitacion, numero } = req.body;
    if (!id_habitacion || !numero.trim()) {
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

      await connection.promise().query(
        'INSERT INTO cama (id_habitacion, numero, estado) VALUES (?, ?, "libre")',
        [id_habitacion, numero]
      );

      res.redirect("/camas?msg=Cama creada correctamente");
    } catch (err) {
      console.error("Error al crear cama:", err);
      res.send("Error al crear cama.");
    } finally {
      if (connection) connection.release();
    }
  },

  cambiarEstado: async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.send("⚠️ Debe indicar un estado válido.");
    }

    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      await connection.promise().beginTransaction();

      try {
        // Actualizar estado de la cama
        await connection.promise().query(
          "UPDATE cama SET estado = ? WHERE id_cama = ?",
          [estado, id]
        );

        let nuevoEstadoAdm = null;
        // Si se libera la cama, actualizar admisiones
        if (["libre", "higienizando"].includes(estado)) {
          nuevoEstadoAdm = estado === "libre" ? "finalizada" : "cancelada";
          await connection.promise().query(
            `UPDATE admision
             SET estado = ?
             WHERE id_cama_asignada = ? AND estado = 'activa'`,
            [nuevoEstadoAdm, id]
          );
        }

        await connection.promise().commit();
        
        let msg = `Cama puesta "${estado}"`;
        if (nuevoEstadoAdm) msg += ` y admisión ${nuevoEstadoAdm}`;
        
        res.redirect(`/camas?msg=${encodeURIComponent(msg)}`);
      } catch (err) {
        await connection.promise().rollback();
        console.error("Error al actualizar estado de cama:", err);
        res.send("Error al actualizar estado de cama.");
      }
    } catch (err) {
      console.error("Error al obtener conexión:", err);
      res.send("Error interno");
    } finally {
      if (connection) connection.release();
    }
  },

  // Mostrar formulario de edición
  mostrarFormularioEditar: async (req, res) => {
    const { id } = req.params;
    try {
      const [camas] = await db.promise().query("SELECT * FROM cama WHERE id_cama = ?", [id]);
      
      if (camas.length === 0) return res.redirect("/habitaciones");

      res.render("camas_editar", {
        titulo: "Editar Cama",
        cama: camas[0],
        bodyClass: "bg-habitaciones"
      });
    } catch (err) {
      console.error(err);
      res.send("Error al cargar cama");
    }
  },

  // Guardar los cambios (Aquí permitimos cambiar el estado manualmente)
  actualizarCama: async (req, res) => {
    const { id } = req.params;
    const { numero, estado } = req.body; // Recibimos el estado nuevo

    if (!numero?.trim() || !estado?.trim()) {
      return res.send("⚠️ Todos los campos son obligatorios.");
    }

    try {
      await db.promise().query(
        "UPDATE cama SET numero = ?, estado = ? WHERE id_cama = ?",
        [numero, estado, id]
      );
      // Al terminar, volvemos al tablero general que es más útil
      res.redirect("/habitaciones");
    } catch (err) {
      console.error(err);
      res.send("Error al actualizar cama");
    }
  }
};