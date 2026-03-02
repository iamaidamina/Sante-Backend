const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/auth.middleware');
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    //  Generar token
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    res.status(200).json({
      message: 'Login exitoso',
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});
router.get('/profile', verifyToken, async (req, res) => {
  res.json({
    message: 'Ruta protegida',
    user: req.user
  });
});
module.exports = router;
