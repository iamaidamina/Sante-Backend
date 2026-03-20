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
router.get('/especialidades',verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM especialidades');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/create-table", async (req, res) => {
    try {
        const createTableQuery = `
            CREATE TABLE tests (
                id_test INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                nombre_medico VARCHAR(250) NOT NULL,
                nombre_examen VARCHAR(250) NOT NULL,
                descripcion VARCHAR(250),
                lugar VARCHAR(250),
                fecha_hora DATETIME,
                ruta_orden_medica VARCHAR(250),
                estado ENUM('activo','inactivo') DEFAULT 'activo',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
                    ON DELETE CASCADE
            )
        `;

        const [result] = await pool.query(createTableQuery);

        res.status(201).json({
            message: "Table 'tests' created successfully",
            table_name: 'tests'
        });

    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            return res.status(409).json({ 
                message: "Table 'tests' already exists" 
            });
        }
        console.error("Error creating table:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;