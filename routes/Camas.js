const express = require("express");
const router = express.Router();
const camasController = require("../controllers/camasController");

// Middleware para verificar sesión
router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});

// Listar camas
router.get("/", camasController.listarCamas);

// Formulario para crear nueva cama
router.get("/nuevo", camasController.mostrarFormularioNuevo);

// Procesar creación de nueva cama
router.post("/nuevo", camasController.crearCama);

// Cambiar estado de una cama
router.post("/estado/:id", camasController.cambiarEstado);

module.exports = router;
