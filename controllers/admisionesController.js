const db = require("../models/db");

module.exports = {
  // 1. Mostrar el formulario (GET)
  mostrarFormulario: async (req, res) => {
    let connection;
    try {
      // DEFENSA: Usamos async/await para manejar la asincronía de la BD de forma secuencial y limpia.
      // Evitamos el "Callback Hell". Ref: Diapo 3 (Node y Asincronismo).
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // DEFENSA: Promise.all permite ejecutar consultas en PARALELO.
      // Traemos pacientes y camas libres al mismo tiempo para renderizar la vista más rápido.
      const [pacientes, camas] = await Promise.all([
        connection.promise().query("SELECT * FROM paciente"),
        connection.promise().query("SELECT id_cama, numero, (SELECT numero FROM habitacion WHERE id_habitacion = cama.id_habitacion) as habitacion_numero FROM cama WHERE estado = 'libre'")
      ]);

      res.render("admitir", {
        titulo: "Admitir Paciente",
        pacientes: pacientes[0],
        camas: camas[0], // Pasamos las camas libres a la vista Pug
        error: null,
        datos: {}
      });
    } catch (err) {
      console.error(err);
      res.send("Error al cargar formulario");
    } finally {
      if (connection) connection.release(); // Siempre liberar conexión
    }
  },

  // 2. Procesar la Admisión (POST) - ¡AQUÍ ESTÁ LA DEFENSA FUERTE!
  procesarAdmision: async (req, res) => {
    const { id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada } = req.body;

    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // --- INICIO TRANSACCIÓN (ACID) ---
      // DEFENSA: Iniciamos una transacción para garantizar la ATOMICIDAD.
      // O se hacen todos los cambios (insertar admisión + ocupar cama) o ninguno.
      // Esto evita inconsistencias (ej: cama ocupada pero sin paciente).
      await connection.promise().beginTransaction();

      try {
        // 1. Validar: ¿El paciente ya está internado?
        const [admisionesActivas] = await connection.promise().query(
          "SELECT * FROM admision WHERE id_paciente = ? AND estado = 'activa'",
          [id_paciente] // DEFENSA: El '?' es una Sentencia Preparada (evita inyección SQL).
        );

        if (admisionesActivas.length > 0) {
          throw new Error("El paciente ya tiene una internación activa.");
        }

        // --- VALIDACIÓN DE GÉNERO EN HABITACIÓN COMPARTIDA ---
        // 1. Buscamos el sexo del paciente que queremos internar
        const [pacienteInfo] = await connection.promise().query(
            "SELECT sexo FROM paciente WHERE id_paciente = ?", 
            [id_paciente]
        );
        const sexoPaciente = pacienteInfo[0].sexo;

        // 2. Buscamos si hay ALGUIEN MÁS en esa misma habitación
        // (Buscamos la habitación de la cama seleccionada -> buscamos otras camas ocupadas en esa habitación -> buscamos el sexo del paciente en esa cama)
        const sqlValidarSexo = `
            SELECT p.sexo 
            FROM cama c1
            JOIN cama c2 ON c1.id_habitacion = c2.id_habitacion  -- Misma habitación
            JOIN admision a ON c2.id_cama = a.id_cama_asignada   -- Cama ocupada
            JOIN paciente p ON a.id_paciente = p.id_paciente     -- Paciente ocupante
            WHERE c1.id_cama = ?                                 -- La cama que yo elegí
            AND c2.id_cama != ?                                  -- Que no sea la misma cama
            AND a.estado = 'activa'                              -- Que esté internado ahora
        `;
        
        const [compañeros] = await connection.promise().query(sqlValidarSexo, [id_cama_asignada, id_cama_asignada]);

        // 3. Si hay compañero y es de otro sexo -> ERROR
        if (compañeros.length > 0) {
            const sexoCompañero = compañeros[0].sexo;
            if (sexoCompañero !== sexoPaciente) {
                throw new Error(`Habitación compartida: No se puede mezclar sexo ${sexoPaciente} con ${sexoCompañero}.`);
            }
        }

        // 2. Insertar la Admisión
        const [result] = await connection.promise().query(
          "INSERT INTO admision (id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada) VALUES (?, ?, ?, ?, ?)",
          [id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada]
        );

        // 3. Actualizar estado de la Cama a 'Ocupada'
        await connection.promise().query(
          "UPDATE cama SET estado = 'ocupada' WHERE id_cama = ?",
          [id_cama_asignada]
        );

        // --- COMMIT ---
        // DEFENSA: Confirmamos los cambios de forma permanente en la BD.
        await connection.promise().commit();
        
        res.redirect("/admisiones"); // Redirigir al listado

      } catch (error) {
        // --- ROLLBACK ---
        // DEFENSA: Si algo falla, deshacemos TODO para volver al estado seguro anterior.
        await connection.promise().rollback();
        console.error("Error en transacción:", error);
        
        // Volvemos a cargar el formulario mostrando el error (User Experience)
        const [pacientes, camas] = await Promise.all([
            connection.promise().query("SELECT * FROM paciente"),
            connection.promise().query("SELECT id_cama, numero FROM cama WHERE estado = 'libre'")
        ]);
        
        res.render("admitir", {
          titulo: "Admitir Paciente",
          pacientes: pacientes[0],
          camas: camas[0],
          error: "Error: " + error.message, // Mostramos el error al usuario
          datos: req.body // Mantenemos los datos que ya escribió
        });
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      res.send("Error de servidor");
    } finally {
      if (connection) connection.release();
    }
  },
  
  // ... (Mantén los métodos listar, finalizar y cancelar que ya tenías, esos estaban bien)
  listarAdmisiones: async (req, res) => {
      // (Pega aquí tu código original de listarAdmisiones del archivo anterior)
      // Asegúrate que use el `pool` (db.getConnection) igual que arriba.
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
  // (Pega aquí los métodos finalizarAdmision y cancelarAdmision tal cual los tenías)
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