const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const pool = require("../db/connection");

// CREATE appointment
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_medico:
 *                 type: string
 *               id_especialidad:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *               lugar:
 *                 type: string
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;

        const {
            nombre_medico,
            id_especialidad,
            descripcion,
            tipo,
            lugar,
            fecha_hora
        } = req.body;

        if (!nombre_medico || !fecha_hora) {
            return res.status(400).json({
                message: "Required fields missing"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO citas 
            (id_usuario, nombre_medico, id_especialidad, descripcion, tipo, lugar, fecha_hora)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, nombre_medico, id_especialidad, descripcion, tipo, lugar, fecha_hora]
        );

        res.status(201).json({
            message: "Appointment created successfully",
            appointment_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// GET all appointments (logged user)
/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments for logged user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        /*
        const [rows] = await pool.query(
            `SELECT c.*, e.nombre_especialidad
             FROM citas c
             LEFT JOIN especialidades e 
             ON c.id_especialidad = e.id_especialidad
             WHERE c.id_usuario = ? AND c.estado = 'activo'
             ORDER BY c.fecha_hora DESC`,
            [userId]
        );
        */
       
       const [rows] = await pool.query(
            "SELECT * FROM citas WHERE id_usuario = ?",
            [userId]
        );

        res.json(rows);

    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// UPDATE appointment
/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_medico:
 *                 type: string
 *               id_especialidad:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *               lugar:
 *                 type: string
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       500:
 *         description: Internal server error
 */
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { id } = req.params;

        const {
            nombre_medico,
            id_especialidad,
            descripcion,
            tipo,
            lugar,
            fecha_hora
        } = req.body;

        await pool.query(
            `UPDATE citas 
             SET nombre_medico = ?, 
                 id_especialidad = ?, 
                 descripcion = ?, 
                 tipo = ?, 
                 lugar = ?, 
                 fecha_hora = ?
             WHERE id_cita = ? AND id_usuario = ?`,
            [nombre_medico, id_especialidad, descripcion, tipo, lugar, fecha_hora, id, userId]
        );

        res.json({ message: "Appointment updated successfully" });

    } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// SOFT DELETE appointment
/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Soft delete an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { id } = req.params;
        /*
        await pool.query(
            `UPDATE citas 
             SET estado = 'inactivo'
             WHERE id_cita = ? AND id_usuario = ?`,
            [id, userId]
        );

        res.json({ message: "Appointment deleted successfully" });
        */
        const [result] = await pool.query(
            `DELETE FROM citas
             WHERE id_cita= ?
             AND id_usuario = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Appointment not found or not authorized"
            });
        }

        res.status(200).json({
            message: "Appoinment deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting appointment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
