const express = require("express");
const router = express.Router();
const camasController = require("../controllers/camasController");

router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});

router.get("/", camasController.listarCamas);
router.get("/nuevo", camasController.mostrarFormularioNuevo);
router.post("/nuevo", camasController.crearCama);
router.post("/estado/:id", camasController.cambiarEstado);

// Rutas de edición
router.get("/editar/:id", camasController.mostrarFormularioEditar);
router.post("/editar/:id", camasController.actualizarCama);

module.exports = router;
