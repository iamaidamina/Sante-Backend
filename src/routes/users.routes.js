const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // máximo 5 intentos
  skipSuccessfulRequests: true,
  message: {
    message: "Demasiados intentos de login. Intenta nuevamente en unos minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});
/**
 * @swagger
 * {
 * "/api/users/register": {
 * "post": {
 * "tags": ["Users"],
 * "summary": "Registra un nuevo usuario",
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "nombres": { "type": "string" },
 * "apellidos": { "type": "string" },
 * "fecha_nacimiento": { "type": "string", "format": "date" },
 * "username": { "type": "string" },
 * "email": { "type": "string" },
 * "password": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "201": { "description": "Usuario creado" },
 * "400": { "description": "Error de validación" },
 * "500": { "description": "Error de servidor" }
 * }
 * }
 * }
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      fecha_nacimiento,
      username,
      email,
      password
    } = req.body;

    // Validación básica
    if (!nombres || !apellidos || !username || !email || !password) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Verificar si ya existe username o email
    const [existingUser] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: 'El email o username ya está registrado'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const [result] = await pool.query(
      `INSERT INTO usuarios 
       (nombres, apellidos, fecha_nacimiento, username, email, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombres, apellidos, fecha_nacimiento, username, email, password_hash]
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      id_usuario: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * @swagger
 * {
 *   "/api/users/login": {
 *     "post": {
 *     "tags": ["Users"],
 *       "summary": "Login de usuario",
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "email": { "type": "string" },
 *                 "password": { "type": "string" }
 *               }
 *             }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "200": { "description": "Login exitoso" },
 *         "400": { "description": "Credenciales inválidas" },
 *         "500": { "description": "Error de servidor" }
 *       }
 *     }
 *   }
 * }
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }


    // --- MEJORA: REGISTRO DE SESIÓN ---
    const ip = req.ip || req.headers['x-forwarded-for'];
    const dispositivo = req.headers['user-agent'];


    // Cerrar sesiones activas anteriores del usuario
    await pool.query(
      `UPDATE sesiones_usuario
   SET estado = 'cerrada',
       hora_salida = NOW(),
       tiempo_estadia_segundos = TIMESTAMPDIFF(SECOND, hora_ingreso, NOW())
   WHERE id_usuario = ?
   AND estado = 'activa'`,
      [user.id_usuario]
    );
    const [sesion] = await pool.query(
      `INSERT INTO sesiones_usuario (id_usuario, ip_usuario, dispositivo, hora_ingreso)
       VALUES (?, ?, ?, NOW())`,
      [user.id_usuario, ip, dispositivo]
    );

    const id_sesion = sesion.insertId;

    // --- MEJORA: INCLUIR ID_SESION EN JWT ---
    // --- ACCESS TOKEN (15 min) ---
    const accessToken = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_sesion: id_sesion,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // --- REFRESH TOKEN (2 horas) ---
    const refreshToken = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_sesion: id_sesion
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // guardar refresh token en DB
    await pool.query(
      `UPDATE sesiones_usuario
 SET refresh_token = ?
 WHERE id_sesion = ?`,
      [refreshToken, id_sesion]
    );


    res.status(200).json({
      message: 'Login exitoso',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});
router.post('/refresh-token', async (req, res) => {

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(401).json({
      message: "Refresh token requerido"
    });
  }

  try {

    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      `SELECT * FROM sesiones_usuario
 WHERE id_sesion = ?
 AND refresh_token = ?
 AND estado = 'activa'
 AND hora_salida IS NULL`,
      [decoded.id_sesion, refresh_token]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: "Refresh token inválido"
      });
    }

    const refreshToken = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_sesion: id_sesion,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      access_token: newAccessToken
    });

  } catch (error) {

    return res.status(403).json({
      message: "Refresh token expirado o inválido"
    });

  }

});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     tags: [Users]
 *     summary: Cierre de sesión con actualización de hora de salida
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // MEJORA: Se extrae el id_sesion del token verificado, no del body
    const id_sesion = req.user.id_sesion;

    if (!id_sesion) {
      return res.status(400).json({ message: "No hay sesión activa vinculada al token" });
    }

    await pool.query(
      `UPDATE sesiones_usuario
 SET hora_salida = NOW(),
     estado = 'cerrada',
     refresh_token = NULL,
     tiempo_estadia_segundos = TIMESTAMPDIFF(SECOND, hora_ingreso, NOW())
 WHERE id_sesion = ? 
 AND hora_salida IS NULL`,
      [id_sesion]
    );
    res.json({ message: "Sesión cerrada correctamente" });

  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ message: "Error cerrando sesión" });
  }
});
module.exports = router;
