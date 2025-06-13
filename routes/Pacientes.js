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


router.get("/editar/:id", pacientesController.mostrarFormularioEditar);


router.post("/editar/:id", pacientesController.editarPaciente);


router.post("/eliminar/:id", pacientesController.eliminarPaciente);

module.exports = router;
