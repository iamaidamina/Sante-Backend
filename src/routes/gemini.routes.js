
const express = require('express');
const verifyToken = require('../middlewares/auth.middleware');
const { obtenerRespuestaGemini } = require('../services/gemini.service');
const router = express.Router();

/**
 * @swagger

/**
 * @swagger
 * /api/gemini/chat:
 *   post:
 *     summary: Consulta a Gemini sobre medicamentos o salud
 *     tags: [Gemini]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pregunta:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta generada por Gemini
 *       400:
 *         description: Pregunta faltante
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { pregunta } = req.body;
    if (!pregunta) {
      return res.status(400).json({ message: 'Falta la pregunta' });
    }
    const respuesta = await obtenerRespuestaGemini(pregunta);
    res.json({ success: true, respuesta });
  } catch (error) {
    console.error('[Gemini Chat] Error:', error.message, error);
    res.status(500).json({ message: 'Error al consultar Gemini', error: error.message });
  }
});
module.exports = router;
