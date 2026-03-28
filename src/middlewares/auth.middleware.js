const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const verifyToken = async (req, res, next) => {
  // 1. Extraer el header de autorización
  const authHeader = req.headers.authorization;

  // Verificamos que el header exista y empiece con 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Acceso denegado. Token no proporcionado o formato inválido.' 
    });
  }

  // 2. Obtener solo el token (quitando la palabra 'Bearer')
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verificar el token usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* 4. Inyectamos TODO el contenido decodificado en req.user.     .
    */
    req.user = decoded;
    
    // NUEVA VERIFICACIÓN DE SESIÓN PARA QUE NO SE ROBEN TOKENS
    const [rows] = await pool.query(
      `SELECT estado 
       FROM sesiones_usuario
       WHERE id_sesion = ?`,
      [decoded.id_sesion]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: "Sesión inválida"
      });
    }

    if (rows[0].estado !== 'activa') {
      return res.status(403).json({
        message: "La sesión ya fue cerrada"
      });
    }

    next(); 

  } catch (error) {
    // 5. Diferenciar entre token expirado y token inválido 
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        expired: true 
      });
    }

    return res.status(403).json({ 
      message: 'Token inválido o corrupto.' 
    });
  }
};

module.exports = verifyToken;