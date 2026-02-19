const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const crypto = require('crypto');
const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/admin.middleware');

router.post('/register-admin',
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { nombre, id_usuario } = req.body;

      if (!nombre || !id_usuario) {
        return res.status(400).json({ message: 'Datos incompletos' });
      }

      const api_key = crypto.randomBytes(32).toString('hex');

      const [result] = await pool.query(
        `INSERT INTO dispositivos (nombre, api_key, id_usuario)
         VALUES (?, ?, ?)`,
        [nombre, api_key, id_usuario]
      );

      res.status(201).json({
        message: 'Dispositivo registrado por admin',
        id_dispositivo: result.insertId,
        api_key
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
});
router.post('/uv', async (req, res) => {
  try {
    const { api_key, valor_uv } = req.body;

    if (!api_key || valor_uv === undefined) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Buscar dispositivo
    const [devices] = await pool.query(
      'SELECT id_dispositivo FROM dispositivos WHERE api_key = ? AND estado = "activo"',
      [api_key]
    );

    if (devices.length === 0) {
      return res.status(401).json({ message: 'API key inválida' });
    }

    const id_dispositivo = devices[0].id_dispositivo;

    // Calcular nivel automáticamente
    const calcularNivel = (uv) => {
      if (uv <= 2) return 'bajo';
      if (uv <= 5) return 'moderado';
      if (uv <= 7) return 'alto';
      if (uv <= 10) return 'muy_alto';
      return 'extremo';
    };

    const nivel_riesgo = calcularNivel(valor_uv);

    // Guardar en base de datos
    await pool.query(
      `INSERT INTO registros_uv 
       (id_dispositivo, valor_uv, nivel_riesgo)
       VALUES (?, ?, ?)`,
      [id_dispositivo, valor_uv, nivel_riesgo]
    );

    res.json({
      message: 'Registro UV guardado',
      nivel_riesgo
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});
module.exports = router;