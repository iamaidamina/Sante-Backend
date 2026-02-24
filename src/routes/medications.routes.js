const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const verifyToken = require("../middlewares/auth.middleware");

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;

        const [rows] = await pool.query(
            "SELECT * FROM medicamentos WHERE id_usuario = ?",
            [userId]
        );

        res.json(rows);

    } catch (error) {
        console.error("Error fetching medications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
