const express = require('express');
const cors = require('cors');

const usersRoutes = require('./routes/users.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', usersRoutes);

module.exports = app;
