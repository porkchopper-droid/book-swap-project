import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Request", requestSchema);