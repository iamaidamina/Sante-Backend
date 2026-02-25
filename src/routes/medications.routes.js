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
router.post("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;

        const {
            nombre,
            descripcion,
            id_frecuencia,
            id_almacenamiento
        } = req.body;

        if (!nombre) {
            return res.status(400).json({
                message: "Name is required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO medicamentos
            (id_usuario, nombre, descripcion, id_frecuencia, id_almacenamiento)
            VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                nombre,
                descripcion || null,
                id_frecuencia || null,
                id_almacenamiento || null
            ]
        );

        res.status(201).json({
            message: "Medication created successfully",
            medicationId: result.insertId,
            estado: "activo" // sabemos que queda activo por defecto
        });

    } catch (error) {
        console.error("Error creating medication:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
module.exports = router;
