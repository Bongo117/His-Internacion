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
    // 1. Recibimos los nuevos campos del body
    const { id_paciente, id_cama_asignada, motivo, tipo_ingreso, institucion_procedencia, cirugia_programada } = req.body;

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
        // VALIDACIÓN: Si es quirúrgico, requerir el procedimiento
        if (tipo_ingreso === 'quirurgico' && (!cirugia_programada || cirugia_programada.trim() === '')) {
            throw new Error("Para ingresos quirúrgicos, debe especificar el procedimiento programado.");
        }

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

        // 3. Inserción enriquecida
        // DEFENSA: "El controlador se adapta polimórficamente. Si es una cirugía, guarda el procedimiento; 
        // si es derivación, guarda el origen. Esto permite generar reportes logísticos precisos después."
        await connection.promise().query(
          `INSERT INTO admision 
          (id_paciente, id_cama_asignada, fecha_admision, motivo, tipo_ingreso, estado, institucion_procedencia, cirugia_programada) 
          VALUES (?, ?, NOW(), ?, ?, 'activa', ?, ?)`,
          [
            id_paciente, 
            id_cama_asignada, 
            motivo, 
            tipo_ingreso, 
            institucion_procedencia || null, 
            cirugia_programada || null
          ]
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

  verDetalleAdmision: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // 1. Datos principales de la admisión
      const sqlAdmision = `
        SELECT 
          a.id_admision, a.fecha_admision, a.motivo, a.tipo_ingreso, a.estado,
          a.institucion_procedencia, a.cirugia_programada,
          p.nombre, p.apellido, p.dni, p.fecha_nacimiento, p.sexo,
          c.numero AS cama_numero,
          h.numero AS habitacion_numero
        FROM admision a
        JOIN paciente p ON a.id_paciente = p.id_paciente
        JOIN cama c ON a.id_cama_asignada = c.id_cama
        JOIN habitacion h ON c.id_habitacion = h.id_habitacion
        WHERE a.id_admision = ?
      `;

      // 2. Historial de evoluciones (CORREGIDO)
      // Usamos 'fecha' en lugar de 'fecha_evaluacion' y quitamos los signos vitales que no existen
      const sqlEvoluciones = `
        SELECT
          em.fecha,  
          em.diagnostico, 
          em.tratamientos, 
          em.alta,
          u.username AS medico_responsable
        FROM evaluacion_medica em
        JOIN usuario u ON em.medico_responsable = u.id_usuario
        WHERE em.id_admision = ?
        ORDER BY em.fecha DESC
      `;

      const [admisionResult, evolucionesResult] = await Promise.all([
        connection.promise().query(sqlAdmision, [id]),
        connection.promise().query(sqlEvoluciones, [id])
      ]);

      if (admisionResult[0].length === 0) {
        return res.status(404).send("Admisión no encontrada.");
      }

      res.render("admision_detalle", {
        titulo: `Detalle de Admisión`,
        admision: admisionResult[0][0],
        evoluciones: evolucionesResult[0],
        bodyClass: "bg-admisiones"
      });

    } catch (err) {
      console.error("❌ Error al obtener detalle de admisión:", err);
      res.send("Error al cargar el detalle de la admisión.");
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
  },

  // --- INGRESO DE EMERGENCIA (PROTOCOLO SHOCKROOM) ---
  ingresoEmergencia: async (req, res) => {
    const { id_cama_asignada, motivo } = req.body;
    let connection;

    try {
        // 1. Obtener conexión del pool
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        // 2. INICIO DE TRANSACCIÓN CRÍTICA
        await connection.promise().beginTransaction();

        try {
            // A. Generar Identidad Temporal (NN)
            // Usamos la fecha en milisegundos para garantizar que el DNI sea único siempre
            const timestamp = Date.now(); 
            const dniTemporal = `NN-${timestamp}`; 
            
            // B. Insertar Paciente Fantasma
            // DEFENSA: "Creamos un registro de paciente 'placeholder' para mantener la
            // integridad referencial sin detener la atención médica."
            const [resultPaciente] = await connection.promise().query(
                `INSERT INTO paciente 
                (dni, nombre, apellido, fecha_nacimiento, sexo, telefono, direccion, contacto_emergencia, obra_social, nro_afiliado)
                VALUES (?, 'IDENTIDAD', 'DESCONOCIDA', NOW(), 'X', '000-000', 'Sin datos', 'SAME / Policía', 'Estado', 'S/D')`,
                [dniTemporal]
            );
            
            const idNuevoPaciente = resultPaciente.insertId;

            // C. Crear la Admisión de Urgencia
            await connection.promise().query(
                `INSERT INTO admision 
                (id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada, estado)
                VALUES (?, NOW(), ?, 'emergencia', ?, 'activa')`,
                [idNuevoPaciente, motivo || "Ingreso por Guardia / Shockroom", id_cama_asignada]
            );

            // D. Bloquear la cama inmediatamente
            await connection.promise().query(
                "UPDATE cama SET estado = 'ocupada' WHERE id_cama = ?", 
                [id_cama_asignada]
            );

            // E. Confirmar todo
            await connection.promise().commit();
            
            console.log(`🚨 EMERGENCIA: Paciente NN ingresado con ID ${idNuevoPaciente}`);
            res.redirect('/admisiones');

        } catch (error) {
            // Si algo falla, deshacemos todo (Rollback)
            await connection.promise().rollback();
            console.error("❌ Error crítico en emergencia:", error);
            res.send(`<h1>Error Crítico de Sistema</h1><p>${error.message}</p><a href='/admitir'>Volver</a>`);
        }

    } catch (err) {
        console.error("Error de conexión:", err);
        res.send("Error de conexión a Base de Datos");
    } finally {
        if (connection) connection.release();
    }
  },

  // --- MÓDULO DE IDENTIFICACIÓN (FUSIÓN DE HISTORIAS) ---

  // 1. Mostrar formulario de identificación para un paciente NN específico
  formularioIdentificar: async (req, res) => {
    const { id_admision } = req.params;
    try {
        const [adm] = await db.promise().query(`
            SELECT a.id_admision, a.fecha_admision, p.dni, p.nombre, p.apellido 
            FROM admision a
            JOIN paciente p ON a.id_paciente = p.id_paciente
            WHERE a.id_admision = ?`, [id_admision]);

        if (adm.length === 0) return res.redirect('/admisiones');

        res.render("identificar", { 
            titulo: "Identificar Paciente NN", 
            pacienteNN: adm[0] 
        });
    } catch (err) {
        console.error(err);
        res.send("Error al cargar formulario");
    }
  },

 // 2. Procesar la fusión (Identificar NN)
  procesarIdentificacion: async (req, res) => {
    const { id_admision, dni_real } = req.body;
    let connection;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // A. Buscar al paciente real por DNI
        const [pacienteReal] = await connection.query(
            "SELECT id_paciente, nombre, apellido FROM paciente WHERE dni = ?", 
            [dni_real]
        );

        if (pacienteReal.length === 0) {
            throw new Error(`El DNI ${dni_real} no existe. Registre al paciente antes de fusionar.`);
        }
        
        const idReal = pacienteReal[0].id_paciente;

        // --- 🛑 VALIDACIÓN NUEVA: ¿El paciente real YA está internado? ---
        const [internacionActiva] = await connection.query(
            "SELECT id_admision FROM admision WHERE id_paciente = ? AND estado = 'activa'",
            [idReal]
        );

        if (internacionActiva.length > 0) {
            // Si ya está internado, PROHIBIMOS la fusión.
            throw new Error(`IMPOSIBLE FUSIONAR: El paciente ${pacienteReal[0].apellido} ya tiene una internación ACTIVA (ID: ${internacionActiva[0].id_admision}). Primero debe dar de alta la internación anterior.`);
        }

        // B. REALIZAR LA FUSIÓN (UPDATE)
        await connection.query(
            "UPDATE admision SET id_paciente = ? WHERE id_admision = ?",
            [idReal, id_admision]
        );

        await connection.commit();
        res.redirect('/admisiones?mensaje=FusionExitosa');

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        // Renderizamos de nuevo la vista 'identificar' pasando el error para que se vea bonito
        const [adm] = await db.promise().query(`
            SELECT a.id_admision, a.fecha_admision, p.dni, p.nombre, p.apellido 
            FROM admision a
            JOIN paciente p ON a.id_paciente = p.id_paciente
            WHERE a.id_admision = ?`, [id_admision]);

        res.render("identificar", { 
            titulo: "Identificar Paciente NN", 
            pacienteNN: adm[0],
            error: error.message // <--- Aquí va el mensaje de bloqueo
        });
    } finally {
        if (connection) connection.release();
    }
  }
};