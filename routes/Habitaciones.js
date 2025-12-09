const express = require("express");
const router = express.Router();
const habitacionesController = require("../controllers/habitacionesController");

// Middleware de seguridad
router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});

router.get("/", habitacionesController.listarHabitaciones);
router.get("/nueva", habitacionesController.formularioNueva);
router.post("/guardar", habitacionesController.guardarHabitacion);

// 👇 ESTA ES LA LÍNEA QUE FALTABA O NO SE RECONOCÍA
router.post("/:id_habitacion/agregar_cama", habitacionesController.agregarCama);

// --- NUEVA RUTA PARA ELIMINAR CAMA ---
router.post("/cama/:id_cama/eliminar", habitacionesController.eliminarCama);

// ... otras rutas ...
router.post("/cama/:id_cama/:accion", habitacionesController.cambiarEstadoCama);

module.exports = router;