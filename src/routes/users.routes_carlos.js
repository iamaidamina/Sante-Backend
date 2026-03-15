const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/auth.middleware');
const { TERMS_VERSION } = require('../config/appConfig');
/**
 * @swagger
 * /api/users/register:
 * post:
 * tags: [Users]
 * summary: Registra un nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {

    const {
      nombres,
      apellidos,
      fecha_nacimiento,
      username,
      email,
      password,
      terms_accepted
    } = req.body;

    // Validación básica
    if (!nombres || !apellidos || !username || !email || !password) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios'
      });
    }

    // Validar términos
    if (!terms_accepted) {
      return res.status(400).json({
        message: 'Debes aceptar los términos y condiciones'
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
      (nombres, apellidos, fecha_nacimiento, username, email, password_hash, terms_accepted, terms_version, terms_accepted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nombres,
        apellidos,
        fecha_nacimiento,
        username,
        email,
        password_hash,
        terms_accepted,
        TERMS_VERSION
      ]
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      id_usuario: result.insertId
    });

  } catch (error) {

    console.error("Error en register:", error);

    res.status(500).json({
      message: 'Error en el servidor'
    });

  }
});

/**
 * @swagger
 * /api/users/login:
 * post:
 * tags: [Users]
 * summary: Login de usuario con registro de sesión
 */
router.post('/login', async (req, res) => {
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

    const [sesion] = await pool.query(
      `INSERT INTO sesiones_usuario (id_usuario, ip_usuario, dispositivo, hora_ingreso)
       VALUES (?, ?, ?, NOW())`,
      [user.id_usuario, ip, dispositivo]
    );

    const id_sesion = sesion.insertId;

    // --- MEJORA: INCLUIR ID_SESION EN JWT ---
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_sesion: id_sesion,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
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

/**
 * @swagger
 * /api/users/logout:
 * post:
 * tags: [Users]
 * summary: Cierre de sesión con actualización de hora de salida
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
       tiempo_estadia_segundos = TIMESTAMPDIFF(SECOND, hora_ingreso, NOW())
   WHERE id_sesion = ? AND hora_salida IS NULL`,
      [id_sesion]
    );

    res.json({ message: "Sesión cerrada correctamente" });

  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ message: "Error cerrando sesión" });
  }
});

module.exports = router;