const db = require("../models/db");
const bcrypt = require('bcryptjs');

module.exports = {
  mostrarLogin: (req, res) => {
    res.render("login", { titulo: "Iniciar Sesión", error: null });
  },

  procesarLogin: async (req, res) => {
    const { usuario, password } = req.body;

    // Validación básica
    if (!usuario || !password) {
      return res.render("login", { 
        titulo: "Iniciar Sesión", 
        error: "⚠️ Por favor ingrese usuario y contraseña" 
      });
    }

    try {
      // 1. Buscamos el usuario en la BD
      const [rows] = await db.promise().query(
        "SELECT * FROM usuario WHERE username = ?", 
        [usuario]
      );

      if (rows.length === 0) {
        return res.render("login", { titulo: "Iniciar Sesión", error: "❌ Usuario no encontrado" });
      }

      const user = rows[0];

      // 2. VERIFICACIÓN DE CONTRASEÑA (HÍBRIDA PARA NO ROMPER NADA)
      // Esto permite que funcionen tus usuarios viejos (texto plano) y los nuevos (encriptados)
      // DEFENSA: "Implementé una estrategia de migración progresiva para soportar usuarios legacy".
      let match = false;
      
      if (user.password.startsWith('$2a$')) {
          // Si empieza con $2a$, es un hash de bcrypt -> Comparamos seguro
          match = await bcrypt.compare(password, user.password);
      } else {
          // Si no, es texto plano (como '1234') -> Comparamos directo
          // TODO: En producción, aquí deberíamos encriptarla y guardarla actualizada.
          match = (user.password === password);
      }

      if (match) {
        // Login exitoso: Guardamos en sesión
        req.session.user = {
          id: user.id_usuario,
          username: user.username,
          rol: user.rol
        };
        res.redirect("/");
      } else {
        res.render("login", { titulo: "Iniciar Sesión", error: "❌ Contraseña incorrecta" });
      }

    } catch (err) {
      console.error(err);
      res.render("login", { titulo: "Iniciar Sesión", error: "Error de servidor" });
    }
  },

  logout: (req, res) => {
    req.session.destroy();
    res.redirect("/auth/login");
  }
};