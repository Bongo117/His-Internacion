// middlewares/auth.js

module.exports = {
    // 1. EL PORTERO: Verifica si el usuario inició sesión
    estaLogueado: (req, res, next) => {
        // Si existe la sesión y tiene un usuario guardado...
        if (req.session && req.session.user) {
            return next(); // ...dejalo pasar a la siguiente función (el controlador)
        }
        // Si no, mandalo al login
        return res.redirect('/auth/login');
    },

    // 2. EL VIP: Verifica si el usuario tiene el ROL correcto
    // Recibe una lista de roles permitidos (ej: ['medico', 'admin'])
    tieneRol: (rolesPermitidos) => {
        return (req, res, next) => {
            // Primero aseguramos que esté logueado
            if (!req.session.user) {
                return res.redirect('/auth/login');
            }

            // Verificamos si su rol está en la lista permitida
            if (rolesPermitidos.includes(req.session.user.rol)) {
                return next(); // Tiene permiso, pase.
            }

            // Si no tiene permiso:
            console.warn(`⛔ Acceso denegado: Usuario ${req.session.user.username} intentó entrar a zona restringida.`);
            return res.status(403).render('index', { 
                titulo: 'Error de Permisos',
                error: '⛔ No tienes autorización para realizar esta acción.'
            });
        }
    }
};