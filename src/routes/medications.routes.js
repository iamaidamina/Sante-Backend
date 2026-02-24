const express = require("express");
const router = express.Router();
const connection = require("../db/connection");
const authMiddleware = require("../middlewares/auth.middleware");

// GET - traer medicamentos del usuario logueado
router.get("/", authMiddleware, (req, res) => {

    const userId = req.user.id_usuario; // 👈 viene del token

    const query = "SELECT * FROM medicamentos WHERE id_usuario = ?";

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error al obtener medicamentos:", err);
            return res.status(500).json({
                message: "Error al obtener medicamentos"
            });
        }

        res.status(200).json(results);
    });
});

module.exports = router;