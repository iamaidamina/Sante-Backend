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
            almacenamiento
        } = req.body;

        // Validación mínima
        if (!nombre) {
            return res.status(400).json({
                message: "Name is required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO medicamentos
             (id_usuario, nombre, descripcion, id_frecuencia, almacenamiento)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                nombre,
                descripcion || null,
                id_frecuencia || null,
                almacenamiento || null
            ]
        );

        res.status(201).json({
            message: "Medication created successfully",
            medicationId: result.insertId
        });

    } catch (error) {
        console.error("Error creating medication:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { id } = req.params;

        const {
            nombre,
            descripcion,
            id_frecuencia,
            almacenamiento,
            estado
        } = req.body;

        // Validar estado si viene
        if (estado && !['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({
                message: "Invalid status value"
            });
        }

        const [result] = await pool.query(
            `UPDATE medicamentos
             SET nombre = ?,
                 descripcion = ?,
                 id_frecuencia = ?,
                 almacenamiento = ?,
                 estado = ?
             WHERE id_medicamento = ?
             AND id_usuario = ?`,
            [
                nombre,
                descripcion || null,
                id_frecuencia || null,
                almacenamiento || null,
                estado || 'activo',
                id,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Medication not found or not authorized"
            });
        }

        res.json({
            message: "Medication updated successfully"
        });

    } catch (error) {
        console.error("Error updating medication:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { id } = req.params;

        const [result] = await pool.query(
            `DELETE FROM medicamentos
             WHERE id_medicamento = ?
             AND id_usuario = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Medication not found or not authorized"
            });
        }

        res.status(200).json({
            message: "Medication deleted successfully"
        });

        // Alternativa más REST:
        // res.status(204).send();

    } catch (error) {
        console.error("Error deleting medication:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});
module.exports = router;
