const express = require('express');
const multer = require('multer');
const verifyToken = require('../middlewares/auth.middleware');
const { analizarFormula } = require('../services/gemini.service');

const router = express.Router();

// Configurar multer para almacenar en memoria (no en disco)

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
    res.status(500).json({ message: 'Error al consultar Gemini', error: error.message });
  }
});
      return res.status(400).json({ message: 'No se recibio ninguna imagen' });
    }

    console.log(`[Gemini TEST] Analizando formula - tipo: ${req.file.mimetype}, tamano: ${req.file.size} bytes`);

    const resultado = await analizarFormula(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('[Gemini TEST] Error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'No se pudo analizar la formula medica',
    });
  }
});

module.exports = router;
