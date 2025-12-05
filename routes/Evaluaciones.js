const express = require("express");
const router = express.Router();
const evaluacionesController = require("../controllers/evaluacionesController");

// Middleware de seguridad (Solo logueados)
router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});

router.get("/", evaluacionesController.listarParaEvolucionar);
router.get("/nueva/:id_admision", evaluacionesController.mostrarFormulario);
router.post("/guardar", evaluacionesController.guardarEvolucion);

module.exports = router;