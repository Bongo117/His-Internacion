const express = require("express");
const router = express.Router();
const pacientesController = require("../controllers/pacientesController");


router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});


router.get("/nuevo", pacientesController.mostrarFormularioNuevo);


router.post("/nuevo", pacientesController.crearPaciente);


router.get("/", pacientesController.listarPacientes);

// API para buscar pacientes por DNI (devuelve JSON para AJAX)
router.get("/api/buscar/:dni", pacientesController.buscarPacientePorDNI);


router.get("/editar/:id", pacientesController.mostrarFormularioEditar);


router.post("/editar/:id", pacientesController.editarPaciente);


router.post("/eliminar/:id", pacientesController.eliminarPaciente);
 
router.get("/:id/admisiones", pacientesController.listarAdmisionesDePaciente);

// Nueva ruta de búsqueda inteligente (acepta ?termino=...)
router.get("/api/smart-search", pacientesController.buscarPacientesFlexible);

module.exports = router;
