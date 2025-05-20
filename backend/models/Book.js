import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: Number,
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
    description: String,
    genre: String,
    imageUrl: String,
    isbn: {
      type: String,
      trim: true,
      match: [/^\d{10}(\d{3})?$/, "Invalid ISBN format"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // current owner
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // original owner, set only once
    },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
