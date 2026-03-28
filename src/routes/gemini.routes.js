
const express = require('express');
const verifyToken = require('../middlewares/auth.middleware');
const { obtenerRespuestaGemini } = require('../services/gemini.service');
const router = express.Router();

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
    if (error.message === 'CUOTA_EXCEDIDA') {
      return res.status(429).json({
        message: 'Límite de consultas alcanzado. Reintenta en unos segundos.',
        error: 'Rate Limit Exceeded'
      });
    }

    console.error('[Gemini Chat] Error:', error.message);
    res.status(500).json({ message: 'Error al consultar Gemini', error: error.message });
  }
});
module.exports = router;
