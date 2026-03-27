const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const pool = require("../db/connection");

/**
 * @swagger
 * {
 *   "/api/deliveries": {
 *     "post": {
 *       "tags": ["Deliveries"],
 *       "summary": "Create a new delivery",
 *       "security": [{ "bearerAuth": [] }],
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "lugar_compra": { "type": "string" },
 *                 "id_domiciliario": { "type": "integer" },
 *                 "nombre_producto": { "type": "string" },
 *                 "comentario": { "type": "string" },
 *                 "lugar_entrega": { "type": "string" },
 *                 "fecha_llegada": { "type": "string", "format": "date-time" }
 *               }
 *             }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "201": { "description": "Delivery created successfully" },
 *         "400": { "description": "Required fields missing" },
 *         "500": { "description": "Internal server error" }
 *       }
 *     }
 *   }
 * }
 */
router.post("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;

        const {
            lugar_compra ,
            id_domiciliario,
            nombre_producto,
            comentario,
            lugar_entrega,
            fecha_llegada
        } = req.body;

        if (!nombre_producto || !fecha_llegada) {
            return res.status(400).json({
                message: "Required fields missing"
            });
        }
        //probando
        const [result] = await pool.query(
            `INSERT INTO entregas 
            (id_usuario, lugar_compra, id_domiciliario, nombre_producto, comentario,lugar_entrega, fecha_llegada)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, lugar_compra, id_domiciliario, nombre_producto, comentario,lugar_entrega, fecha_llegada]
        );

        res.status(201).json({
            message: "Entrega created successfully",
            test_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating entrega:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
 * @swagger
 * /api/deliveries:
 *   get:
 *     summary: Get all deliveries for logged user
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deliveries
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
       
       const [rows] = await pool.query(
            "SELECT * FROM entregas WHERE id_usuario = ?",
            [userId]
        );

        res.json(rows);

    } catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



/**
 * @swagger
 * /api/deliveries/{id}:
 *   put:
 *     summary: Update an delivery
 *     tags: [Deliveries]
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
 *               lugar_compra:
 *                 type: string
 *               id_domiciliario:
 *                 type: string
 *               nombre_producto:
 *                 type: string
 *               comentario:
 *                 type: string
 *               lugar_entrega:
 *                 type: string
 *               fecha_llegada:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Delivery updated successfully
 *       500:
 *         description: Internal server error
 */
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { id } = req.params;

        const {
            lugar_compra,
            id_domiciliario,
            nombre_producto,
            comentario,
            lugar_entrega,
            fecha_llegada
        } = req.body;

        await pool.query(
            `UPDATE entregas
             SET lugar_compra = ?, 
                 id_domiciliario = ?, 
                 nombre_producto = ?, 
                 comentario = ?,
                 lugar_entrega= ?, 
                 fecha_llegada = ?
             WHERE id_entrega= ? AND id_usuario = ?`,
            [lugar_compra, id_domiciliario, nombre_producto, comentario,lugar_entrega, fecha_llegada, id, userId]
        );

        res.json({ message: "Delivery updated successfully" });

    } catch (error) {
        console.error("Error updating delivery:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



/**
 * @swagger
 * /api/deliveries/{id}:
 *   delete:
 *     summary: Soft delete an delivery
 *     tags: [Deliveries]
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
 *         description: Delivery deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const { id } = req.params;

        const [result] = await pool.query(
            `DELETE FROM entregas
             WHERE id_entrega= ?
             AND id_usuario = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Delivery not found or not authorized"
            });
        }

        res.status(200).json({
            message: "Delivery deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting delivery:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
