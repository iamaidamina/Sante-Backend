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


module.exports = router;