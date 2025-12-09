const express = require("express");
const router = express.Router();
const habitacionesController = require("../controllers/habitacionesController");

// Middleware de protección (Solo usuarios logueados)
router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});

router.get("/", habitacionesController.listarHabitaciones);
router.get("/nueva", habitacionesController.formularioNueva);
router.post("/guardar", habitacionesController.guardarHabitacion);

module.exports = router;