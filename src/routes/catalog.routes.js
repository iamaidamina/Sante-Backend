const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const pool = require("../db/connection");

/**
 * @swagger
 * /api/catalog/especialidades:
 *   get:
 *     summary: Get all especialidades for logged user
 *     tags: [Especialidades]
 * */
router.get('/especialidades', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM especialidades');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/catalog/domiciliarios:
 *   get:
 *     summary: Get all domiciliarios for logged user
 *     tags: [Domiciliarios]
 * */
router.get('/domiciliarios', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM domiciliarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * @swagger
 * /api/catalog/create-entregas:
 *   post:
 *     summary: Create entregas table if not exists
 *     tags: [CreateEntregas]
 *     responses:
 *       200:
 *         description: Table created or already exists
 *       500:
 *         description: Internal server error
 */
router.post('/create-entregas', async (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS entregas (
      id_entrega INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      lugar_compra VARCHAR(150),
      id_domiciliario INT,
      fecha_llegada DATE,
      nombre_producto VARCHAR(250),
      orden_medica VARCHAR(250),
      lugar_entrega VARCHAR(250),
      comentario VARCHAR(250),
      estado ENUM('aceptado', 'pendiente', 'entregado') DEFAULT 'pendiente',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      FOREIGN KEY (id_domiciliario) REFERENCES domiciliarios(id_domiciliario) ON DELETE SET NULL
    );
  `;

  try {
    await pool.query(createTableQuery);

    res.status(200).json({
      message: "Table 'entregas' created or already exists"
    });

  } catch (error) {
    console.error("Error creating entregas table:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});


module.exports = router;