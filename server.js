const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

/* ✅ VERY IMPORTANT HOME ROUTE */
app.get("/", (req, res) => {
  res.send("Stranger Chat Backend Running ✅");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", () => {

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

  socket.on("message", (msg) => {
    socket.partner?.emit("message", msg);
  });

  const cleanup = () => {

    if (waitingUser?.id === socket.id) {
      waitingUser = null;
    }

    if (socket.partner) {
      socket.partner.emit("stranger-left");
      socket.partner.partner = null;
      socket.partner = null;
    }
  };

  socket.on("disconnect", cleanup);
  socket.on("stop", cleanup);
});


/* ✅ CRITICAL FOR RENDER */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
