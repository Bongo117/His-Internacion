const db = require("../models/db");

module.exports = {
  // --- LISTAR HABITACIONES CON DETALLE DE OCUPACIÓN ---
  listarHabitaciones: async (req, res) => {
    try {
      // DEFENSA: "Uso una consulta compleja con AGREGACIÓN (GROUP BY) para obtener
      // métricas en tiempo real: capacidad total, ocupación actual y lista de pacientes."
      const sql = `
        SELECT 
            h.id_habitacion, 
            h.ala, 
            h.numero, 
            h.capacidad,
            COUNT(c.id_cama) as total_camas,
            SUM(CASE WHEN c.estado = 'ocupada' THEN 1 ELSE 0 END) as camas_ocupadas,
            GROUP_CONCAT(CONCAT(p.apellido, ' ', p.nombre) SEPARATOR ', ') as pacientes_nombres
        FROM habitacion h
        LEFT JOIN cama c ON h.id_habitacion = c.id_habitacion
        LEFT JOIN admision a ON c.id_cama = a.id_cama_asignada AND a.estado = 'activa'
        LEFT JOIN paciente p ON a.id_paciente = p.id_paciente
        GROUP BY h.id_habitacion
        ORDER BY h.ala, h.numero
      `;

      const [habitaciones] = await db.promise().query(sql);

      res.render("habitaciones_lista", { 
        titulo: "Gestión de Habitaciones", 
        habitaciones 
      });
    } catch (err) {
      console.error(err);
      res.send("Error al listar habitaciones");
    }
  },

  // --- MOSTRAR FORMULARIO DE CREACIÓN ---
  formularioNueva: (req, res) => {
    res.render("habitaciones_nueva", { titulo: "Nueva Habitación" });
  },

  // --- GUARDAR NUEVA HABITACIÓN ---
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
      res.render("habitaciones_nueva", { 
        titulo: "Nueva Habitación", 
        error: "Error al crear la habitación. Verifique que el número no esté duplicado." 
      });
    }
  }
};