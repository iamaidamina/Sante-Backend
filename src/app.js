const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
//----------------------Nuevo----------------
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
//-----------------------------------------

const usersRoutes = require('./routes/users.routes');
const devicesRoutes = require('./routes/devices.routes');
const medicationsRoutes = require("./routes/medications.routes");
const appointmentsRoutes = require("./routes/appointments.routes");
const testsRoutes = require("./routes/tests.routes");
const deliveriesRoutes = require('./routes/deliveries.routes');
const catalogRoutes = require('./routes/catalog.routes');

const app = express();

// Si se despliega detras de un proxy (Render, Nginx, etc.), Express debe confiar
// en el primer proxy para identificar correctamente la IP real del cliente.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.'
  }
});


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
        name: "Deliveries",
        description: "Delivery management"
      },
      {
        name: "Devices",
        description: "IoT device management"
      },
      {
        name: "Catalog",
        description: "Tables management"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middlewares
const allowedOrigins = [
  'https://sante-frontend-beryl.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/api', apiLimiter);

// Documentation Page
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas
app.use('/api/users', usersRoutes);
app.use('/api/devices', devicesRoutes);
app.use("/api/medications", medicationsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/deliveries", deliveriesRoutes);
app.use('/api/catalog', catalogRoutes);


module.exports = app;
