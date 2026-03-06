const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const crypto = require('crypto');
const verifyToken = require('../middlewares/auth.middleware');
const verifyAdmin = require('../middlewares/admin.middleware');

/**
 * @swagger
 * /api/devices/register-admin:
 *   post:
 *     summary: Register a new device (Admin only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - id_usuario
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Sensor UV Torre 3
 *               id_usuario:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Device registered successfully
 *       400:
 *         description: Incomplete data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /api/devices/uv:
 *   post:
 *     summary: Receive UV sensor data
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - api_key
 *               - valor_uv
 *             properties:
 *               api_key:
 *                 type: string
 *                 example: a8f4c6e3b9f2...
 *               valor_uv:
 *                 type: number
 *                 example: 7.5
 *     responses:
 *       200:
 *         description: UV record stored successfully
 *       400:
 *         description: Incomplete data
 *       401:
 *         description: Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post('/uv', async (req, res) => {
  try {
    const { api_key, valor_uv } = req.body;

    if (!api_key || valor_uv === undefined) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Buscar dispositivo
    const [devices] = await pool.query(
      'SELECT id_dispositivo, id_usuario FROM dispositivos WHERE api_key = ? AND estado = "activo"',
      [api_key]
    );

    if (devices.length === 0) {
      return res.status(401).json({ message: 'API key inválida' });
    }

    const id_dispositivo = devices[0].id_dispositivo;
    const id_usuario = devices[0].id_usuario;

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
    const io = req.app.get("io");

    if (
      io &&
      (nivel_riesgo === "alto" || nivel_riesgo === "muy_alto" || nivel_riesgo === "extremo")
    ) {
      // Opcion actual (sin auth en frontend): envia a todos los clientes conectados.
      io.emit("alerta_uv", {
        mensaje: "Radiacion UV alta. Usa bloqueador solar.",
        valor: valor_uv,
        nivel_riesgo,
        id_dispositivo
      });

      // Opcion futura (cuando frontend tenga auth + rooms por usuario):
      // io.to(`user_${id_usuario}`).emit("alerta_uv", {
      //   mensaje: "Radiacion UV alta. Usa bloqueador solar.",
      //   valor: valor_uv,
      //   nivel_riesgo,
      //   id_dispositivo
      // });
    }

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