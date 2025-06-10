/* ----------------------- IMPORTS ---------------------- */
import User from "./models/User.js";

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
import mapRoutes from "./routes/mapRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

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
app.use("/api/map", mapRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", contactRoutes);

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
    //  console.log("📥 sendMessage received:", { swapId, senderId, text });
    try {
      const swap = await SwapProposal.findById(swapId);
      // console.log("🔍 Found swap:", swap);
      if (!swap || !["accepted", "completed", "reported"].includes(swap.status)) return; // Invalid swap or not in the right status

      const message = new Message({ swapId, sender: senderId, text });
      const saved = await message.save();
      const populated = await saved.populate("sender", "username");

      const receiverId = senderId === String(swap.from) ? String(swap.to) : String(swap.from);

      // 1️⃣ Increment unread count for the receiver
      await User.findByIdAndUpdate(receiverId, {
        $inc: { [`unreadCounts.${swapId}`]: 1 },
      });

      // 2️⃣ Emit to receiver if they’re online
      const receiverSocket = connectedUsers.get(receiverId);

      /* ------------------------ DEBUG START ----------------------- */
      // console.log("📡 Emitting newMessage to socket:", receiverSocket);
      // console.log("📨 Message content:", populated);
      // console.log("🗺️ Current connectedUsers map:", connectedUsers);
      /* ------------------------ DEBUG END ------------------------ */

      if (receiverSocket) {
        io.to(receiverSocket).emit("newMessage", populated);
      }

      // 3️⃣ Echo back to sender
      socket.emit("messageSent", populated);
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
