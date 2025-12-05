const db = require("../models/db");

module.exports = {
  // Listar pacientes que están ACTUALMENTE internados para evolucionarlos
  listarParaEvolucionar: async (req, res) => {
    try {
      const [internados] = await db.promise().query(`
        SELECT a.id_admision, p.nombre, p.apellido, c.numero as cama, h.ala 
        FROM admision a
        JOIN paciente p ON a.id_paciente = p.id_paciente
        JOIN cama c ON a.id_cama_asignada = c.id_cama
        JOIN habitacion h ON c.id_habitacion = h.id_habitacion
        WHERE a.estado = 'activa'
      `);
      
      res.render("evaluaciones_lista", { titulo: "Evolución Médica", pacientes: internados });
    } catch (err) {
      console.error(err);
      res.send("Error al cargar lista");
    }
  },

  // Mostrar formulario de evolución
  mostrarFormulario: async (req, res) => {
    const { id_admision } = req.params;
    try {
      // Traemos datos básicos para mostrar en el título
      const [datos] = await db.promise().query(
        "SELECT p.nombre, p.apellido FROM admision a JOIN paciente p ON a.id_paciente = p.id_paciente WHERE id_admision = ?", 
        [id_admision]
      );
      
      res.render("evaluacion_form", { 
        titulo: `Evolucionar a ${datos[0].nombre} ${datos[0].apellido}`, 
        id_admision 
      });
    } catch (error) {
      res.redirect("/evaluaciones");
    }
  },

  // Guardar la evolución (Y dar de alta si se marca el checkbox)
  guardarEvolucion: async (req, res) => {
    const { 
        id_admision, diagnostico, tratamientos, alta_medica,
        presion_arterial, temperatura, frec_cardiaca, frec_respiratoria, saturacion_o2
    } = req.body;
    let connection;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Preparamos los valores de signos vitales. Si vienen vacíos, los guardamos como NULL.
        const sv = {
            presion: presion_arterial || null,
            temp: temperatura || null,
            fc: frec_cardiaca || null,
            fr: frec_respiratoria || null,
            sat: saturacion_o2 || null
        };

        // 1. Guardar la evaluación médica (Historial clínico)
        await connection.query(
            `INSERT INTO evaluacion_medica (id_admision, diagnostico, tratamientos, alta, medico_responsable, presion_arterial, temperatura, frec_cardiaca, frec_respiratoria, saturacion_o2) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_admision, diagnostico, tratamientos, (alta_medica ? 1 : 0), req.session.user.id, sv.presion, sv.temp, sv.fc, sv.fr, sv.sat]
        );

        // 2. Si marcó "Alta Médica", cerramos la admisión y liberamos la cama
        if (alta_medica) {
            // Obtener cama
            const [adm] = await connection.query("SELECT id_cama_asignada FROM admision WHERE id_admision = ?", [id_admision]);
            const id_cama = adm[0].id_cama_asignada;

            // Finalizar admisión
            await connection.query("UPDATE admision SET estado = 'finalizada' WHERE id_admision = ?", [id_admision]);
            
            // Poner cama en limpieza
            await connection.query("UPDATE cama SET estado = 'higienizando' WHERE id_cama = ?", [id_cama]);
        }

        await connection.commit();
        res.redirect("/evaluaciones");

    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.send("Error al guardar evolución");
    } finally {
        if (connection) connection.release();
    }
  }
};