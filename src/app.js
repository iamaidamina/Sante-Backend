const express = require('express');
const cors = require('cors');
//----------------------Nuevo----------------
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
//-----------------------------------------

const usersRoutes = require('./routes/users.routes');
const devicesRoutes = require('./routes/devices.routes');
const medicationsRoutes = require("./routes/medications.routes");

const app = express();


// --- Swagger Setup ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sante API Documentation',
            version: '1.0.0',
            description: 'Interactive list of API endpoints for the Sante Backend',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
            },
        ],
    },
    // IMPORTANT: Point this to the folder where your .routes.js files are
    apis: ['./src/routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(cors());
app.use(express.json());

// Documentation Page
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas
app.use('/api/users', usersRoutes);
app.use('/api/devices', devicesRoutes);
app.use("/api/medications", medicationsRoutes);

module.exports = app;
