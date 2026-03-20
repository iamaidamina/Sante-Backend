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
 * /api/catalog/add-column:
 *   post:
 *     summary: Post all entregas for logged user
 *     tags: [Entregas]
 * */
router.post("/add-column", async (req, res) => {  // ← Endpoint correcto
    try {
        const createTableQuery = `
            ALTER TABLE entregas 
            ADD COLUMN lugar_entrega VARCHAR(250)
        `;

        await pool.query(createTableQuery);

        res.status(201).json({
            message: "Column 'lugar_entrega' added to 'entregas' table",  // ← Mensaje correcto
            table_name: 'entregas',
            column_added: 'lugar_entrega'
        });

    } catch (error) {
        console.error("Error adding column:", error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});



module.exports = router;