const db = require("../models/db");

module.exports = {
  // --- LISTAR HABITACIONES CON SUS CAMAS DETALLADAS ---
  listarHabitaciones: async (req, res) => {
    try {
      const connection = await db.promise();

      // 1. Traemos todas las habitaciones
      const [habitaciones] = await connection.query("SELECT * FROM habitacion ORDER BY ala, numero");

      // 2. Traemos todas las camas con los datos del paciente (si tienen)
      const [camas] = await connection.query(`
        SELECT 
            c.id_cama, 
            c.numero, 
            c.estado, 
            c.id_habitacion,
            p.apellido, 
            p.nombre
        FROM cama c
        LEFT JOIN admision a ON c.id_cama = a.id_cama_asignada AND a.estado = 'activa'
        LEFT JOIN paciente p ON a.id_paciente = p.id_paciente
        ORDER BY c.numero
      `);

      // 3. Mapeo en Memoria (Unimos camas con habitaciones)
      // DEFENSA: "Realizo una agregación de datos en el controlador para estructurar
      // la vista jerárquicamente. Esto evita lógica compleja en la plantilla Pug."
      const habitacionesConCamas = habitaciones.map(hab => {
        // Filtramos las camas que pertenecen a esta habitación
        hab.camas = camas.filter(c => c.id_habitacion === hab.id_habitacion);
        return hab;
      });

      res.render("habitaciones_lista", { 
        titulo: "Gestión de Habitaciones", 
        habitaciones: habitacionesConCamas,
        bodyClass: "bg-habitaciones"
      });

    } catch (err) {
      console.error(err);
      res.send("Error al listar habitaciones");
    }
  },

  formularioNueva: (req, res) => {
    res.render("habitaciones_nueva", { titulo: "Nueva Habitación" });
  },

  guardarHabitacion: async (req, res) => {
    const { ala, numero, capacidad } = req.body;
    try {
      await db.promise().query(
        "INSERT INTO habitacion (ala, numero, capacidad) VALUES (?, ?, ?)",
        [ala, numero, capacidad]
      );
      res.redirect("/habitaciones");
    } catch (err) {
      console.error(err);
      res.render("habitaciones_nueva", { titulo: "Nueva Habitación", error: "Error al crear." });
    }
  },

  // Agrega una cama nueva a la habitación
  agregarCama: async (req, res) => {
    const { id_habitacion } = req.params;
    try {
      const [camas] = await db.promise().query("SELECT MAX(numero) as max_num FROM cama WHERE id_habitacion = ?", [id_habitacion]);
      const nuevoNumero = (camas[0].max_num || 0) + 1;
      
      await db.promise().query("INSERT INTO cama (id_habitacion, numero, estado) VALUES (?, ?, 'libre')", [id_habitacion, nuevoNumero]);
      res.redirect("/habitaciones");
    } catch (err) {
      console.error(err);
      res.send("Error al agregar cama.");
    }
  },

  // --- NUEVO: ELIMINAR UNA CAMA (si está libre) ---
  eliminarCama: async (req, res) => {
    const { id_cama } = req.params;
    try {
      // La consulta DELETE solo tendrá efecto si la cama existe y su estado es 'libre'.
      // Esto previene la eliminación accidental de camas ocupadas o en limpieza.
      await db.promise().query(
        "DELETE FROM cama WHERE id_cama = ? AND estado = 'libre'", 
        [id_cama]
      );
      res.redirect("/habitaciones");
    } catch (error) {
      console.error(error);
      res.send("Error al eliminar la cama.");
    }
  },

  // --- NUEVO: CAMBIAR ESTADO DE CAMA (Limpiar) ---
  cambiarEstadoCama: async (req, res) => {
    const { id_cama, accion } = req.params; // accion puede ser 'limpiar' o 'reparar'
    try {
        if (accion === 'limpiar') {
            // Pasar de 'higienizando' a 'libre'
            await db.promise().query("UPDATE cama SET estado = 'libre' WHERE id_cama = ?", [id_cama]);
        }
        res.redirect("/habitaciones");
    } catch (error) {
        console.error(error);
        res.send("Error al cambiar estado");
    }
  }
};