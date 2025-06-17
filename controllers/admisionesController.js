const db = require("../models/db");

module.exports = {
  mostrarFormulario: (req, res) => {
    const queryPacientes = "SELECT * FROM paciente";
    const queryCamas = "SELECT id_cama, numero FROM cama WHERE estado = 'libre'";

    db.query(queryPacientes, (err, pacientes) => {
      if (err) return res.send("Error al obtener pacientes");
      db.query(queryCamas, (err, camas) => {
        if (err) return res.send("Error al obtener camas");
        res.render("admitir", {
          titulo: "Admitir Paciente",
          pacientes,
          camas,
          error: null,
          datos: {}
        });
      });
    });
  },

  procesarAdmision: (req, res) => {
    const {
      id_paciente,
      fecha_admision,
      motivo,
      tipo_ingreso,
      id_cama_asignada,
    } = req.body;

    const loadData = (errorMessage) => {
      db.query("SELECT * FROM paciente", (err, pacientes) => {
        if (err) return res.send("Error al obtener pacientes");
        db.query("SELECT id_cama, numero FROM cama WHERE estado = 'libre'", (err, camas) => {
          if (err) return res.send("Error al obtener camas");
          res.render("admitir", {
            titulo: "Admitir Paciente",
            pacientes,
            camas,
            error: errorMessage,
            datos: req.body
          });
        });
      });
    };

    if (
      !id_paciente?.trim() ||
      !fecha_admision ||
      !motivo?.trim() ||
      !tipo_ingreso ||
      !id_cama_asignada?.trim()
    ) {
      return loadData("⚠️ Todos los campos son obligatorios para admitir un paciente.");
    }

    if (isNaN(parseInt(id_paciente)) || isNaN(parseInt(id_cama_asignada))) {
      return loadData("⚠️ Selección inválida de paciente o cama.");
    }

    if (isNaN(Date.parse(fecha_admision))) {
      return loadData("⚠️ Fecha de admisión inválida.");
    }

    const sqlCheckAdmision = `
      SELECT * FROM admision 
      WHERE id_paciente = ? AND estado = 'activa'
    `;

    db.query(sqlCheckAdmision, [id_paciente], (err, resultado) => {
      if (err) {
        console.error("Error al verificar admisión activa:", err);
        return loadData("❌ Error al verificar si el paciente ya está admitido.");
      }

      if (resultado.length > 0) {
        return loadData("⚠️ Este paciente ya tiene una admisión activa.");
      }

      const sqlCama = 'SELECT * FROM cama WHERE id_cama = ? AND estado = "libre"';
      db.query(sqlCama, [id_cama_asignada], (err, resultadoCama) => {
        if (err || resultadoCama.length === 0) {
          return loadData("❌ La cama seleccionada no está disponible.");
        }

        const sqlSexoPaciente = "SELECT sexo FROM paciente WHERE id_paciente = ?";
        db.query(sqlSexoPaciente, [id_paciente], (err, resultadoPaciente) => {
          if (err || resultadoPaciente.length === 0) {
            return loadData("❌ No se pudo obtener el sexo del paciente.");
          }

          const sexoPaciente = resultadoPaciente[0].sexo;

          const sqlHabitacion = `
            SELECT h.id_habitacion
            FROM cama c
            JOIN habitacion h ON c.id_habitacion = h.id_habitacion
            WHERE c.id_cama = ?
          `;
          db.query(sqlHabitacion, [id_cama_asignada], (err, resultadoHab) => {
            if (err || resultadoHab.length === 0) {
              return loadData("❌ No se pudo obtener la habitación.");
            }

            const idHabitacion = resultadoHab[0].id_habitacion;

            const sqlSexos = `
              SELECT p.sexo
              FROM admision a
              JOIN paciente p ON a.id_paciente = p.id_paciente
              JOIN cama c ON a.id_cama_asignada = c.id_cama
              WHERE c.id_habitacion = ? AND a.estado = 'activa'
            `;
            db.query(sqlSexos, [idHabitacion], (err, sexosOcupantes) => {
              if (err) {
                return loadData("❌ Error al verificar sexo en habitación.");
              }

              const conflicto = sexosOcupantes.some(
                (s) => s.sexo !== sexoPaciente
              );
              if (conflicto) {
                return loadData("⚠️ Conflicto de sexo en la habitación. No se puede asignar.");
              }

              const sqlInsert = `
                INSERT INTO admision
                (id_paciente, fecha_admision, motivo, tipo_ingreso, id_cama_asignada)
                VALUES (?, ?, ?, ?, ?)
              `;
              db.query(
                sqlInsert,
                [
                  id_paciente,
                  fecha_admision,
                  motivo,
                  tipo_ingreso,
                  id_cama_asignada,
                ],
                (err) => {
                  if (err) {
                    console.error("❌ Error al registrar admisión:", err);
                    return loadData("❌ Error al registrar la admisión");
                  }

                  db.query(
                    'UPDATE cama SET estado = "ocupada" WHERE id_cama = ?',
                    [id_cama_asignada]
                  );

                  res.redirect('/admisiones');
                }
              );
            });
          });
        });
      });
    });
  },

  listarAdmisiones: (req, res) => {
    const sql = `
      SELECT a.id_admision, p.nombre, p.apellido, a.fecha_admision, a.motivo, a.tipo_ingreso, a.estado, c.numero AS cama_numero, h.numero AS habitacion_numero
      FROM admision a
      JOIN paciente p ON a.id_paciente = p.id_paciente
      JOIN cama c ON a.id_cama_asignada = c.id_cama
      JOIN habitacion h ON c.id_habitacion = h.id_habitacion
      ORDER BY a.fecha_admision DESC
    `;

    db.query(sql, (err, admisiones) => {
      if (err) {
        console.error("❌ Error al obtener admisiones:", err);
        return res.send("Error al listar admisiones.");
      }
      res.render("listar_admisiones", {
        titulo: "Listado de Admisiones",
        admisiones,
        bodyClass: "bg-admisiones"
      });
    });
  },

  finalizarAdmision: (req, res) => {
    const { id } = req.params;

    const sqlFinalizar = "UPDATE admision SET estado = 'finalizada' WHERE id_admision = ?";
    const sqlLiberarCama = `
      UPDATE cama 
      SET estado = 'higienizando' 
      WHERE id_cama = (SELECT id_cama_asignada FROM admision WHERE id_admision = ?)
    `;

    db.query(sqlFinalizar, [id], (err) => {
      if (err) {
        console.error("❌ Error al finalizar admisión:", err);
        return res.send("Error al finalizar admisión.");
      }

      db.query(sqlLiberarCama, [id]);
      res.redirect("/admisiones");
    });
  },

  cancelarAdmision: (req, res) => {
    const { id } = req.params;

    const sqlCancelar = "UPDATE admision SET estado = 'cancelada' WHERE id_admision = ?";
    const sqlLiberarCama = `
      UPDATE cama 
      SET estado = 'libre' 
      WHERE id_cama = (SELECT id_cama_asignada FROM admision WHERE id_admision = ?)
    `;

    db.query(sqlCancelar, [id], (err) => {
      if (err) {
        console.error("❌ Error al cancelar admisión:", err);
        return res.send("Error al cancelar admisión.");
      }

      db.query(sqlLiberarCama, [id]);
      res.redirect("/admisiones");
    });
  }
};
