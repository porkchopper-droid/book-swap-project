/* ----------------------- IMPORTS ---------------------- */
import User from "./models/User.js";
import { encryptMessage, decryptMessage } from "./utils/crypto.js";

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

const mongoURI = process.env.MONGO_URL;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

/* ------------------ Basic Test Route ------------------ */

app.get("/", (req, res) => {
  res.send("API is running!..🐔🐔🐔🐔🐔🐔🐔");
});

app.get("/test-encryption", (req, res) => {
  const encrypted =
    "U2FsdGVkX1+mnrWeDGuG5L0jRwlKFGukdordYeypr/f6nIq1dd+h0wOhyQtCUS95+4Af2JlgW6EQ1Hr2tS9mEg==";
  const decrypted = decryptMessage(encrypted);

  res.json({ encrypted, decrypted });
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
    console.log("📥 Socket.IO sendMessage received:");
    console.log("➡️ swapId:", swapId);
    console.log("➡️ senderId:", senderId);
    console.log("➡️ original text:", text);

    // Empty message guard
    // if (!text || !text.trim()) {
    //   console.warn("❌ Empty message blocked.");
    //   socket.emit("error", "Empty messages are not allowed.");
    //   return;
    // }

    try {
      const swap = await SwapProposal.findById(swapId);
      if (!swap || !["accepted", "completed", "reported"].includes(swap.status)) {
        console.warn("⚠️ Swap not found or not in valid status");
        return;
      }

      console.log("✅ Swap found. Proceeding with encryption...");

      // 🔐 Encrypt message
      const encryptedText = encryptMessage(text);
      console.log("🔒 Encrypted text:", encryptedText);

      // Save encrypted message
      const saved = await Message.create({
        swapId,
        sender: senderId,
        text: encryptedText,
      });

      const populated = await saved.populate("sender", "username");

      console.log("📦 Message saved and populated:", populated);

      const receiverId = senderId === String(swap.from) ? String(swap.to) : String(swap.from);

      console.log("👥 Receiver determined:", receiverId);

      // 🔓 Decrypt before sending back
      const decrypted = {
        ...populated.toObject(),
        text: decryptMessage(populated.text),
      };

      console.log("🗝️ Decrypted message for emission:", decrypted.text);

      const receiverArchived =
        (receiverId === String(swap.from) && swap.fromArchived) ||
        (receiverId === String(swap.to) && swap.toArchived);

      if (!receiverArchived) {
        // 🔔 Only bump the badge if they haven’t muted the swap
        await User.findByIdAndUpdate(receiverId, {
          $inc: { [`unreadCounts.${swapId}`]: 1 },
        });

        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit("newMessage", decrypted);
        } else {
          console.log("🕳️ Receiver is offline. No socket to emit to.");
        }
      } else {
        console.log(
          `🔇 Receiver ${receiverId} has archived swap ${swapId}; skipping badge + socket ping`
        );
      }

      // 🔁 Echo back to sender
      console.log("↩️ Emitting messageSent back to sender");
      socket.emit("messageSent", decrypted);
    } catch (err) {
      console.error("❌ sendMessage handler failed:", err);
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
