const verifyAdmin = require('../middlewares/admin.middleware');
const crypto = require('crypto');
const pool = require('../db/connection');

router.post('/register-admin',
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { nombre, id_usuario } = req.body;

      if (!nombre || !id_usuario) {
        return res.status(400).json({ message: 'Datos incompletos' });
      }

      const api_key = crypto.randomBytes(32).toString('hex');

      const [result] = await pool.query(
        `INSERT INTO dispositivos (nombre, api_key, id_usuario)
         VALUES (?, ?, ?)`,
        [nombre, api_key, id_usuario]
      );

      res.status(201).json({
        message: 'Dispositivo registrado por admin',
        id_dispositivo: result.insertId,
        api_key
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
});