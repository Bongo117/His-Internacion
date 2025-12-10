const express = require("express");
const router = express.Router();
const admisionesController = require("../controllers/admisionesController");

// 👇 IMPORTAMOS EL NUEVO MIDDLEWARE
const { estaLogueado, tieneRol } = require("../middlewares/auth");

// 1. Candado General: Nadie entra a NADA de aquí si no está logueado
router.use(estaLogueado);

// 2. Rutas Específicas con Roles
// Cualquiera logueado puede ver el formulario (médicos, enfermeros, recepción)
router.get("/admitir", admisionesController.mostrarFormulario);

// Pero supongamos que SOLO 'recepcionista' y 'enfermero' pueden crear la admisión
// (Los médicos solo evalúan, no hacen el papeleo de ingreso)
router.post("/admitir", tieneRol(['recepcionista', 'enfermero', 'admin']), admisionesController.procesarAdmision);

// Listar admisiones (Todos pueden ver)
router.get("/admisiones", admisionesController.listarAdmisiones);

// Acciones de cierre (Solo admin o enfermero)
router.post("/admisiones/:id/finalizar", tieneRol(['enfermero', 'admin']), admisionesController.finalizarAdmision);
router.post("/admisiones/:id/cancelar", tieneRol(['admin']), admisionesController.cancelarAdmision);

// 👇 ESTA ES LA NUEVA RUTA PARA EMERGENCIA (SHOCKROOM)
// Esta suele ser abierta a médicos también en caso de urgencia
router.post("/admitir/emergencia", tieneRol(['medico', 'enfermero', 'admin']), admisionesController.ingresoEmergencia);

module.exports = router;