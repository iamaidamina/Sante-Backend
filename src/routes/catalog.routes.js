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
            CREATE TABLE IF NOT EXISTS domiciliarios (  -- ← IF NOT EXISTS evita error
                id_domiciliario INT AUTO_INCREMENT PRIMARY KEY,
                nombre_domiciliario VARCHAR(250),
                direccion_domiciliario VARCHAR(150),
                tipo_documento VARCHAR(150),
                numero_documento VARCHAR(250),
                documento_identidad VARCHAR(250),
                estado ENUM('activo','inactivo') DEFAULT 'activo',  -- ← COMA AQUÍ
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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