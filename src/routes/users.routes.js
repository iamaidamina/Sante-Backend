const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/auth.middleware');
const verifyCaptcha = require('../middlewares/captcha.middleware');
const rateLimit = require('express-rate-limit');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // máximo 5 intentos
  message: {
    message: "Demasiados intentos de login. Intenta nuevamente en unos minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    message: "Demasiados registros desde esta IP"
  }
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
router.post('/register', registerLimiter, verifyCaptcha, async (req, res) => {
  try {

    const missingEmailConfig = [
      'BREVO_API_KEY',
      'BREVO_FROM_EMAIL',
      'JWT_SECRET'
    ].filter((key) => !process.env[key]);

    if (missingEmailConfig.length > 0) {
      console.error('Falta configuracion de correo/verificacion:', missingEmailConfig);
      return res.status(500).json({
        message: 'Falta configurar el servicio de correo en el servidor'
      });
    }

    const {
      nombres,
      apellidos,
      fecha_nacimiento,
      username,
      email,
      password,
      terms_accepted
    } = req.body;

    // 🔒 Validar aceptación de términos
    if (!terms_accepted) {
      return res.status(400).json({
        message: 'Debes aceptar los términos y condiciones'
      });
    }

    // Validación básica
    if (!nombres || !apellidos || !username || !email || !password) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios'
      });
    }

    // Verificar usuario existente
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
      (nombres, apellidos, fecha_nacimiento, username, email, password_hash, terms_accepted, terms_accepted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nombres,
        apellidos,
        fecha_nacimiento,
        username,
        email,
        password_hash,
        terms_accepted
      ]
    );

    const emailToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const frontendBaseUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const verifyLink = `${frontendBaseUrl}/verify-email?token=${emailToken}`;

    const emailHtml = `
      <h2>Bienvenido a SANTE</h2>
      <p>Gracias por registrarte.</p>
      <p>Haz click en el siguiente enlace para activar tu cuenta:</p>
      <a href="${verifyLink}">Activar cuenta</a>
      <hr />
      <h3>Resumen de terminos y condiciones aceptados</h3>
      <p>Bienvenido a SANTE.</p>
      <p>1. La informacion registrada debe ser veridica.</p>
      <p>2. La plataforma no reemplaza atencion medica profesional.</p>
      <p>3. Los datos medicos seran tratados conforme a la politica de privacidad.</p>
      <p>4. El usuario es responsable del uso de su cuenta.</p>
      <p>5. La plataforma puede enviar notificaciones relacionadas con medicamentos.</p>
      <p>6. El usuario acepta recibir correos de verificacion.</p>
      <p>7. El uso indebido puede resultar en suspension.</p>
      <p>8. Estos terminos pueden actualizarse sin previo aviso.</p>
      <p>Este enlace expirara en 24 horas.</p>
    `;

    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_FROM_NAME || 'SANTE',
          email: process.env.BREVO_FROM_EMAIL
        },
        to: [{ email }],
        subject: 'Verifica tu cuenta - SANTE',
        htmlContent: emailHtml
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo error:', errorText);
      return res.status(502).json({
        message: 'No se pudo enviar el correo de verificacion'
      });
    }

    res.status(201).json({
      message: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.',
      id_usuario: result.insertId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error en el servidor'
    });

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

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Debes verificar tu correo antes de iniciar sesión"
      });
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

    const newAccessToken = jwt.sign(
      {
        id_usuario: decoded.id_usuario,
        id_sesion: decoded.id_sesion
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
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
router.get("/verify-email", async (req, res) => {

  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Token requerido");
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await pool.query(
      `UPDATE usuarios
       SET email_verified = TRUE
       WHERE email = ?`,
      [decoded.email]
    );

    res.send("Cuenta verificada correctamente");

  } catch (error) {

    res.status(400).send("Token inválido o expirado");

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
