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
            // Se renderiza una vista específica para errores de permisos,
            // mostrando un mensaje claro en rojo y ocultando el contenido normal de la página.
            return res.status(403).render('acceso_denegado', {
                titulo: 'Acceso Denegado',
                mensaje: `No tienes los permisos necesarios para realizar esta acción. El rol de tu usuario ('${req.session.user.rol}') no está autorizado.`,
                sugerencia: 'Por favor, inicia sesión con un usuario que tenga los permisos adecuados.'
            });
        }
    }
};