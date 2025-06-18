const db = require("../models/db");

module.exports = {
  mostrarLogin: (req, res) => {
    res.render("login", {
      titulo: "Iniciar Sesión",
      error: null,
      bodyClass: "bg-login"
    });
  },

  procesarLogin: async (req, res) => {
    console.log("💡 procesarLogin recibidos:", req.body);
    const { usuario, password } = req.body;
    console.log("💡 valores usados en consulta:", usuario, password);

    if (!usuario?.trim() || !password?.trim()) {
      return res.render("login", {
        titulo: "Iniciar Sesión",
        error: "⚠️ Completa usuario y contraseña.",
        bodyClass: "bg-login"
      });
    }

    let connection;
    try {
    
      connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      const sql = "SELECT id_usuario, username, rol FROM usuario WHERE username = ? AND password = ?";
      const [rows] = await connection.promise().query(sql, [usuario, password]);

      console.log("💡 resultados de la consulta:", rows);
      if (rows.length === 0) {
        return res.render("login", {
          titulo: "Iniciar Sesión",
          error: "❌ Usuario o contraseña incorrectos.",
          bodyClass: "bg-login"
        });
      }
      
      const user = rows[0];
      req.session.user = {
        id: user.id_usuario,
        username: user.username,
        rol: user.rol
      };
    
      return res.redirect("/");
    } catch (err) {
      console.error("Error al consultar usuario:", err);
      return res.render("login", {
        titulo: "Iniciar Sesión",
        error: "❌ Error temporal, intenta nuevamente",
        bodyClass: "bg-login"
      });
    } finally {
      
      if (connection) connection.release();
    }
  },

  logout: (req, res) => {
    req.session.destroy(err => {
      res.redirect("/auth/login");
    });
  }
};