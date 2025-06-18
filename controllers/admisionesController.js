const db = require("../models/db");

module.exports = {
  mostrarFormulario: async (req, res) => {
    let connection;
    try {
      // Obtener conexión
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // Obtener pacientes y camas en paralelo
      const [pacientes, camas] = await Promise.all([
        connection.promise().query("SELECT * FROM paciente"),
        connection.promise().query("SELECT id_cama, numero FROM cama WHERE estado = 'libre'")
      ]);

      res.render("admitir", {
        titulo: "Admitir Paciente",
        pacientes: pacientes[0],
        camas: camas[0],
        error: null,
        datos: {}
      });
    } catch (err) {
      console.error("Error en mostrarFormulario:", err);
      res.send("Error al cargar datos");
    } finally {
      if (connection) connection.release();
    }
  },

  procesarAdmision: async (req, res) => {
    const {
      id_paciente,
      fecha_admision,
      motivo,
      tipo_ingreso,
      id_cama_asignada,
    } = req.body;

    // Función para recargar datos del formulario
    const loadData = async (errorMessage) => {
      let connection;
      try {
        connection = await new Promise((resolve, reject) => {
          db.getConnection((err, conn) => {
            if (err) reject(err);
            else resolve(conn);
          });
        });

        const [pacientes, camas] = await Promise.all([
          connection.promise().query("SELECT * FROM paciente"),
          connection.promise().query("SELECT id_cama, numero FROM cama WHERE estado = 'libre'")
        ]);

        res.render("admitir", {
          titulo: "Admitir Paciente",
          pacientes: pacientes[0],
          camas: camas[0],
          error: errorMessage,
          datos: req.body
        });
      } catch (err) {
        console.error("Error en loadData:", err);
        res.send("Error interno");
      } finally {
        if (connection) connection.release();
      }
    };

    // Validaciones
    if (
      !id_paciente?.trim() ||
      !fecha_admision ||
      !motivo?.trim() ||
      !tipo_ingreso ||
      !id_cama_asignada?.trim()
    ) {
      return await loadData("⚠️ Todos los campos son obligatorios para admitir un paciente.");
    }

    if (isNaN(parseInt(id_paciente)) || isNaN(parseInt(id_cama_asignada))) {
      return await loadData("⚠️ Selección inválida de paciente o cama.");
    }

    if (isNaN(Date.parse(fecha_admision))) {
      return await loadData("⚠️ Fecha de admisión inválida.");
    }

    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // Iniciar transacción
      await connection.promise().beginTransaction();

      try {
        // Verificar admisión activa
        const [admisionesActivas] = await connection.promise().query(
          `SELECT * FROM admision 
           WHERE id_paciente = ? AND estado = 'activa'`,
          [id_paciente]
        );

        if (admisionesActivas.length > 0) {
          throw new Error("Este paciente ya tiene una admisión activa");
        }

        // Verificar disponibilidad de cama
        const [camas] = await connection.promise().query(
          'SELECT * FROM cama WHERE id_cama = ? AND estado = "libre"',
          [id_cama_asignada]
        );

        if (camas.length === 0) {
          throw new Error("La cama seleccionada no está disponible");
        }

        // Obtener sexo del paciente
        const [pacientes] = await connection.promise().query(
          "SELECT sexo FROM paciente WHERE id_paciente = ?",
          [id_paciente]
        );

        if (pacientes.length === 0) {
          throw new Error("No se pudo obtener el sexo del paciente");
        }

        const sexoPaciente = pacientes[0].sexo;

        // Obtener habitación
        const [habitaciones] = await connection.promise().query(
          `SELECT h.id_habitacion
           FROM cama c
           JOIN habitacion h ON c.id_habitacion = h.id_habitacion
           WHERE c.id_cama = ?`,
          [id_cama_asignada]
        );

        if (habitaciones.length === 0) {
          throw new Error("No se pudo obtener la habitación");
        }

        const idHabitacion = habitaciones[0].id_habitacion;

        // Verificar conflicto de sexo
        const [sexosOcupantes] = await connection.promise().query(
          `SELECT p.sexo
           FROM admision a
           JOIN paciente p ON a.id_paciente = p.id_paciente
           JOIN cama c ON a.id_cama_asignada = c.id_cama
           WHERE c.id_habitacion = ? AND a.estado = 'activa'`,
          [idHabitacion]
        );

        const conflicto = sexosOcupantes.some(s => s.sexo !== sexoPaciente);
        if (conflicto) {
          throw new Error("Conflicto de sexo en la habitación. No se puede asignar.");
        }

        // Registrar admisión
        await connection.promise().query(
          `INSERT INTO admision
           (id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada)
           VALUES (?, ?, ?, ?, ?)`,
          [id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada]
        );

        // Actualizar estado de la cama
        await connection.promise().query(
          'UPDATE cama SET estado = "ocupada" WHERE id_cama = ?',
          [id_cama_asignada]
        );

        // Commit de la transacción
        await connection.promise().commit();
        res.redirect('/admisiones');
      } catch (err) {
        // Rollback en caso de error
        await connection.promise().rollback();
        console.error("❌ Error en transacción:", err);
        return await loadData(`❌ ${err.message}`);
      }
    } catch (err) {
      console.error("Error al obtener conexión:", err);
      return await loadData("❌ Error interno");
    } finally {
      if (connection) connection.release();
    }
  },

  listarAdmisiones: async (req, res) => {
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const sql = `
        SELECT a.id_admision, p.nombre, p.apellido, a.fecha_admision, a.motivo, a.tipo_ingreso, a.estado, 
               c.numero AS cama_numero, h.numero AS habitacion_numero
        FROM admision a
        JOIN paciente p ON a.id_paciente = p.id_paciente
        JOIN cama c ON a.id_cama_asignada = c.id_cama
        JOIN habitacion h ON c.id_habitacion = h.id_habitacion
        ORDER BY a.fecha_admision DESC
      `;

      const [admisiones] = await connection.promise().query(sql);
      
      res.render("listar_admisiones", {
        titulo: "Listado de Admisiones",
        admisiones,
        bodyClass: "bg-admisiones"
      });
    } catch (err) {
      console.error("❌ Error al obtener admisiones:", err);
      res.send("Error al listar admisiones.");
    } finally {
      if (connection) connection.release();
    }
  },

  finalizarAdmision: async (req, res) => {
    const { id } = req.params;
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
        // Obtener cama asociada
        const [admision] = await connection.promise().query(
          "SELECT id_cama_asignada FROM admision WHERE id_admision = ?",
          [id]
        );

        if (admision.length === 0) {
          throw new Error("Admisión no encontrada");
        }

        const id_cama = admision[0].id_cama_asignada;

        // Finalizar admisión
        await connection.promise().query(
          "UPDATE admision SET estado = 'finalizada' WHERE id_admision = ?",
          [id]
        );

        // Cambiar estado de la cama
        await connection.promise().query(
          "UPDATE cama SET estado = 'higienizando' WHERE id_cama = ?",
          [id_cama]
        );

        await connection.promise().commit();
        res.redirect("/admisiones");
      } catch (err) {
        await connection.promise().rollback();
        console.error("❌ Error al finalizar admisión:", err);
        res.send("Error al finalizar admisión.");
      }
    } catch (err) {
      console.error("Error al obtener conexión:", err);
      res.send("Error interno");
    } finally {
      if (connection) connection.release();
    }
  },

  cancelarAdmision: async (req, res) => {
    const { id } = req.params;
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
        // Obtener cama asociada
        const [admision] = await connection.promise().query(
          "SELECT id_cama_asignada FROM admision WHERE id_admision = ?",
          [id]
        );

        if (admision.length === 0) {
          throw new Error("Admisión no encontrada");
        }

        const id_cama = admision[0].id_cama_asignada;

        // Cancelar admisión
        await connection.promise().query(
          "UPDATE admision SET estado = 'cancelada' WHERE id_admision = ?",
          [id]
        );

        // Liberar cama
        await connection.promise().query(
          "UPDATE cama SET estado = 'libre' WHERE id_cama = ?",
          [id_cama]
        );

        await connection.promise().commit();
        res.redirect("/admisiones");
      } catch (err) {
        await connection.promise().rollback();
        console.error("❌ Error al cancelar admisión:", err);
        res.send("Error al cancelar admisión.");
      }
    } catch (err) {
      console.error("Error al obtener conexión:", err);
      res.send("Error interno");
    } finally {
      if (connection) connection.release();
    }
  }
};