require('dotenv').config();

const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

// crear servidor http
const server = http.createServer(app);

// inicializar socket.io
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// guardar io en la app para usarlo en rutas
app.set("io", io);

// detectar conexiones
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // El frontend debe emitir este evento al conectarse para recibir solo sus alertas.
  socket.on("join_user_room", (id_usuario) => {
    if (!id_usuario) return;
    socket.join(`user_${id_usuario}`);
    console.log(`Socket ${socket.id} unido a user_${id_usuario}`);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});