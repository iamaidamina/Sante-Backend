const verifyAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso solo para administradores' });
  }
  next();
};

module.exports = verifyAdmin;
