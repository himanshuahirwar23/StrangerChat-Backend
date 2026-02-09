const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 JOIN CHAT (called when user clicks Start)
  socket.on("join", () => {

    // If someone already waiting, match them
    if (waitingUser && waitingUser.id !== socket.id) {

      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched");
      waitingUser.emit("matched");

      waitingUser = null;

    } else {
      waitingUser = socket;
    }
  });

  // 🔥 MESSAGE
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  // 🔥 STOP / DISCONNECT
  const cleanup = () => {

    // If user was waiting
    if (waitingUser?.id === socket.id) {
      waitingUser = null;
    }

    // If user had a partner
    if (socket.partner) {
      socket.partner.emit("stranger-left");
      socket.partner.partner = null;
      socket.partner = null;
    }
  };

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    cleanup();
  });

  socket.on("stop", () => {
    cleanup();
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
