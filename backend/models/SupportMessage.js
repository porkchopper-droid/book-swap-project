import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema({
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("SupportMessage", supportMessageSchema);
