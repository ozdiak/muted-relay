const express = require("express");
const { Server } = require("socket.io");
const Filter = require("bad-words-plus");
const app = express();
const httpServer = require("http").createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const filter = new Filter({ firstLetter: true });
filter.removeWords("ass", "butt", "damn");

app.use(express.json());

let messages = {};

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("send_message", (data) => {
    const { sender, target, message } = data;
    if (!sender || !target || !message) return;

    const filtered = filter.clean(message);
    const formattedText = `[muted] ${sender} » ${filtered}`;

    if (!messages[target]) messages[target] = [];
    messages[target].push({ sender, message: filtered, formattedText });

    io.to(target).emit("new_message", messages[target]);
  });

  socket.on("join", (target) => {
    socket.join(target);
    console.log(`Client ${socket.id} joined room: ${target}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(3000, () => {
  console.log("Relay server running on port 3000");
});
