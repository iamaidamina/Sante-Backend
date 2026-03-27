const express = require('express');
const multer = require('multer');
const verifyToken = require('../middlewares/auth.middleware');
const { analizarFormula } = require('../services/gemini.service');

const router = express.Router();

// Configurar multer para almacenar en memoria (no en disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB maximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imagenes (JPG, PNG, WebP, GIF) y PDF.'));
    }
  },
});

/**
 * @swagger
 * /api/gemini/analizar-formula:
 *   post:
 *     summary: Analiza una foto de formula medica con IA
 *     tags: [Gemini]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               formula:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Formula analizada exitosamente
 *       400:
 *         description: No se pudo analizar la formula
 */
router.post('/analizar-formula', verifyToken, upload.single('formula'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibio ninguna imagen' });
    }

    console.log(`[Gemini] Analizando formula - tipo: ${req.file.mimetype}, tamano: ${req.file.size} bytes`);

    const resultado = await analizarFormula(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('[Gemini] Error analizando formula:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'No se pudo analizar la formula medica',
    });
  }
});

// Endpoint de prueba sin autenticacion (ELIMINAR en produccion)
router.post('/test-formula', upload.single('formula'), async (req, res) => {
  try {
    if (!req.file) {
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
