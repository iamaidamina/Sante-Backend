require('dotenv').config();

const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

// crear servidor http
const server = http.createServer(app);


// inicializar socket.io con CORS solo para el dominio de Vercel
const io = new Server(server, {
  cors: {
    origin: [
      "https://sante-frontend-beryl.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// guardar io en la app para usarlo en rutas
app.set("io", io);

// detectar conexiones
io.on("connection", (socket) => {

  console.log("=================================");
  console.log("Cliente conectado:", socket.id);

  // El frontend debe emitir este evento al conectarse
  socket.on("join_user_room", (id_usuario) => {

    if (!id_usuario) {
      console.log(`Socket ${socket.id} intentó unirse sin id_usuario`);
      return;
    }

    const room = `user_${id_usuario}`;

    socket.join(room);

    console.log(`Usuario ${id_usuario} conectado`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Room asignada: ${room}`);
    console.log("=================================");

  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });

});

// iniciar scheduler de notificaciones WhatsApp y WebSocket
const { initScheduler } = require('./src/services/scheduler.service');

// iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  initScheduler(io);
});