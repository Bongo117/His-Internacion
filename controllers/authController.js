const db = require("../models/db");

module.exports = {
 
  mostrarLogin: (req, res) => {
    res.render("login", {
      titulo: "Iniciar Sesión",
      bodyClass: "bg-login"
    });
  },

  
  procesarLogin: (req, res) => {
  console.log("💡 procesarLogin recibidos:", req.body);
  const { usuario, password } = req.body;
  console.log("💡 valores usados en consulta:", usuario, password);

  if (!usuario?.trim() || !password?.trim()) {
    return res.send("⚠️ Completa usuario y contraseña.");
  }

  const sql = "SELECT id_usuario, username, rol FROM usuario WHERE username = ? AND password = ?";
  db.query(sql, [usuario, password], (err, resultados) => {
    if (err) {
      console.error("Error al consultar usuario:", err);
      return res.send("❌ Error interno en el servidor.");
    }
    console.log("💡 resultados de la consulta:", resultados);
    if (resultados.length === 0) {
      return res.send("❌ Usuario o contraseña incorrectos.");
    }

    
      const user = resultados[0];
      req.session.user = {
        id: user.id_usuario,
        username: user.username,
        rol: user.rol
      };
    
      return res.redirect("/");
    });
  },


  logout: (req, res) => {
    req.session.destroy(err => {
      res.redirect("/auth/login");
    });
  }
};
