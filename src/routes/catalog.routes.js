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
 * /api/catalog/create-table:
 *   post:
 *     summary: Post all domiciliarios for logged user
 *     tags: [Domiciliarios]
 * */


router.post("/create-table", async (req, res) => {
  try {
    const createTableQuery = `
            CREATE TABLE entregas (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    lugar_compra VARCHAR(150),
    id_domiciliario INT,
    fecha_llegada DATE,
    nombre_producto VARCHAR(250),
    orden_medica VARCHAR(250),
    comentario VARCHAR(250),
    estado ENUM('aceptado','pendiente','entregado'),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,
        FOREIGN KEY (id_domiciliario) REFERENCES domiciliarios(id_domiciliario)
        ON DELETE SET NULL
)
        `;

    const [result] = await pool.query(createTableQuery);

    res.status(201).json({
      message: "Table 'domiciliarios' created successfully",  // ← Corregido
      table_name: 'domiciliarios'                             // ← Corregido
    });

  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message  // ← Para debug
    });
  }
});


module.exports = router;