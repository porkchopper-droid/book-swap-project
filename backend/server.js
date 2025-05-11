/* -------------------- DEPENDENCIES -------------------- */

import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";

/* ---------------------- Socket.IO --------------------- */

import { Server } from "socket.io";
import Message from "./models/Message.js";
import SwapProposal from "./models/SwapProposal.js";

/* ----------------------- ROUTES ----------------------- */

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

/* ---------------------- APP SETUP --------------------- */
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);

/* ----------------- MongoDB Connection ----------------- */

const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

/* ------------------ Basic Test Route ------------------ */

app.get("/", (req, res) => {
  res.send("API is running!..");
});

/* ------------- Server and Socket.io Start ------------- */

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for frontend origin in prod
    methods: ["GET", "POST"],
  },
});

const connectedUsers = new Map(); // userId => socketId

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("register", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
  });

  socket.on("sendMessage", async ({ swapId, senderId, text }) => {
    try {
      const swap = await SwapProposal.findById(swapId);
      if (!swap || swap.status !== "accepted") return;

      const message = new Message({ swapId, sender: senderId, text });
      const saved = await message.save();

      const receiverId =
        senderId === String(swap.from) ? String(swap.to) : String(swap.from);
      const receiverSocket = connectedUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("newMessage", saved);
      }

      socket.emit("messageSent", saved);
    } catch (err) {
      console.error("❌ Message failed:", err);
      socket.emit("error", "Message failed.");
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, sockId] of connectedUsers.entries()) {
      if (sockId === socket.id) connectedUsers.delete(userId);
    }
    console.log("💀 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server + Socket.io running on port ${PORT}`);
});
