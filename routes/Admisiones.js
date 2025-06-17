const express = require("express");
const router = express.Router();
const admisionesController = require("../controllers/admisionesController");

router.use((req, res, next) => {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
});

router.get("/admitir", admisionesController.mostrarFormulario);
router.post("/admitir", admisionesController.procesarAdmision);
router.get("/admisiones", admisionesController.listarAdmisiones);

router.post("/admisiones/finalizar/:id", admisionesController.finalizarAdmision);
router.post("/admisiones/cancelar/:id", admisionesController.cancelarAdmision);

module.exports = router;
