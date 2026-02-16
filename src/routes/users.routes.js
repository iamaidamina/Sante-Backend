const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');

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

module.exports = router;
