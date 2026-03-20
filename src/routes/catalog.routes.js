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
 * /api/catalog/replace-table:
 *   post:
 *     summary: Post all entregas for logged user
 *     tags: [Entregas]
 * */
router.post("/replace-table", async (req, res) => {
    try {

        const createTableQuery = `
            ALTER TABLE entregas 
MODIFY COLUMN estado ENUM('aceptado','pendiente','entregado') DEFAULT 'pendiente';
        `;

        await pool.query(createTableQuery);

        res.status(201).json({
            message: "Table 'entregas' replaced successfully (dropped old + created new)",
            table_name: 'entregas'
        });

    } catch (error) {
        console.error("Error replacing table:", error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});


module.exports = router;