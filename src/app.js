const express = require('express');
const cors = require('cors');
//----------------------Nuevo----------------
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
//-----------------------------------------

const usersRoutes = require('./routes/users.routes');
const devicesRoutes = require('./routes/devices.routes');
const medicationsRoutes = require("./routes/medications.routes");
const appointmentsRoutes = require("./routes/appointments.routes");
const testsRoutes = require("./routes/tests.routes");

const app = express();


// --- Swagger Setup ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sante API",
      version: "1.0.0",
    },
    tags: [
      {
        name: "Users",
        description: "User authentication and management"
      },
      {
        name: "Medications",
        description: "Medication management"
      },
      {
        name: "Appointments",
        description: "Appointment management"
      },
      {
        name: "Tests",
        description: "Test management"
      },
      {
        name: "Devices",
        description: "IoT device management"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
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
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/tests", testsRoutes);


module.exports = app;
