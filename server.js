// server.js — Socket.IO backend for Tezuka Planner
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

let globalState = {
  users: {}, // { email: { name, role, password } }
  workspaces: {
    1: { id: 1, name: "Workspace 1", tasks: [], notifications: [] },
  },
  nextTaskId: 1,
};

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.emit("init_state", globalState);

  socket.on("update_state", (data) => {
    globalState = { ...globalState, ...data };
    io.emit("sync_state", globalState);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("✅ Realtime server running on http://localhost:5000"));
